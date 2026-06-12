import { cache } from 'react'
import type { Prisma } from '@/generated/prisma/client'
import { prisma } from '@/lib/prisma'

/** Enduros en cours (status LIVE) avec stats calculées pour les cartes. */
export async function getLiveEnduros() {
  const enduros = await prisma.enduro.findMany({
    where: { status: 'LIVE' },
    orderBy: { endAt: 'asc' },
    include: {
      _count: { select: { teams: true } },
      teams: {
        select: {
          catches: { where: { status: 'VALID' }, select: { weightKg: true } },
        },
      },
    },
  })

  return enduros.map((e) => {
    let catchesCount = 0
    let leaderKg = 0
    for (const team of e.teams) {
      const total = team.catches.reduce((sum, c) => sum + c.weightKg, 0)
      catchesCount += team.catches.length
      if (total > leaderKg) leaderKg = total
    }
    return {
      id: e.id,
      slug: e.slug,
      name: e.name,
      locationName: e.locationName,
      startAt: e.startAt,
      endAt: e.endAt,
      durationHours: e.durationHours,
      teamsCount: e._count.teams,
      catchesCount,
      leaderKg,
    }
  })
}

/** Enduros à venir (status PUBLISHED, début dans le futur). */
export async function getUpcomingEnduros() {
  const enduros = await prisma.enduro.findMany({
    where: { status: 'PUBLISHED', startAt: { gt: new Date() } },
    orderBy: { startAt: 'asc' },
    include: { _count: { select: { teams: true } } },
  })

  return enduros.map((e) => ({
    id: e.id,
    slug: e.slug,
    name: e.name,
    locationName: e.locationName,
    startAt: e.startAt,
    endAt: e.endAt,
    durationHours: e.durationHours,
    maxTeams: e.maxTeams,
    registrationFee: e.registrationFee,
    prizePool: e.prizePool,
    inscritsCount: e._count.teams,
  }))
}

export type LiveEnduro = Awaited<ReturnType<typeof getLiveEnduros>>[number]
export type UpcomingEnduro = Awaited<ReturnType<typeof getUpcomingEnduros>>[number]

// ─────────────────────────────────────────────
// Recherche publique
// ─────────────────────────────────────────────

export type EnduroSortKey = 'date' | 'price-asc' | 'price-desc' | 'prize-desc'

export interface SearchEnduroFilters {
  /** Texte libre : nom, lieu ou code postal. */
  q?: string
  /** Statuts publics retenus (LIVE / PUBLISHED). Vide = tous les publics. */
  statuses?: Array<'LIVE' | 'PUBLISHED'>
  /** Durées en heures (24, 48, 72, 96). Vide = toutes. */
  durations?: number[]
  /** Prix maximum par équipe, en euros. */
  maxPriceEuros?: number
  /** Tri des résultats. */
  sort?: EnduroSortKey
}

/** Statuts d'enduro visibles publiquement dans la recherche. */
const PUBLIC_STATUSES = ['LIVE', 'PUBLISHED'] as const

/**
 * Recherche d'enduros publiés/en cours avec filtres (données réelles DB).
 * Tous les filtres sont optionnels et combinables.
 */
export async function searchEnduros(filters: SearchEnduroFilters = {}) {
  const { q, statuses, durations, maxPriceEuros, sort = 'date' } = filters

  const where: Prisma.EnduroWhereInput = {
    status: {
      in: statuses && statuses.length > 0 ? statuses : [...PUBLIC_STATUSES],
    },
  }

  if (q && q.trim()) {
    const term = q.trim()
    where.OR = [
      { name: { contains: term, mode: 'insensitive' } },
      { locationName: { contains: term, mode: 'insensitive' } },
      { postalCode: { contains: term, mode: 'insensitive' } },
    ]
  }

  if (durations && durations.length > 0) {
    where.durationHours = { in: durations }
  }

  if (typeof maxPriceEuros === 'number' && Number.isFinite(maxPriceEuros)) {
    where.registrationFee = { lte: Math.round(maxPriceEuros * 100) }
  }

  const orderBy: Prisma.EnduroOrderByWithRelationInput =
    sort === 'price-asc'
      ? { registrationFee: 'asc' }
      : sort === 'price-desc'
        ? { registrationFee: 'desc' }
        : sort === 'prize-desc'
          ? { prizePool: 'desc' }
          : { startAt: 'asc' }

  const enduros = await prisma.enduro.findMany({
    where,
    orderBy,
    include: { _count: { select: { teams: true } } },
  })

  return enduros.map((e) => ({
    id: e.id,
    slug: e.slug,
    name: e.name,
    status: e.status,
    locationName: e.locationName,
    postalCode: e.postalCode,
    startAt: e.startAt,
    endAt: e.endAt,
    durationHours: e.durationHours,
    maxTeams: e.maxTeams,
    registrationFee: e.registrationFee,
    prizePool: e.prizePool,
    inscritsCount: e._count.teams,
  }))
}

export type SearchEnduro = Awaited<ReturnType<typeof searchEnduros>>[number]

/**
 * Détail public d'un enduro par slug (page publique).
 * Renvoie `null` si introuvable ou non visible publiquement.
 */
export const getEnduroBySlug = cache(async (slug: string) => {
  const enduro = await prisma.enduro.findFirst({
    where: { slug, status: { in: ['LIVE', 'PUBLISHED', 'FINISHED'] } },
    include: {
      organizer: { select: { firstName: true, lastName: true } },
      sectors: { select: { id: true, name: true, color: true }, orderBy: { name: 'asc' } },
      _count: { select: { teams: true } },
    },
  })

  if (!enduro) return null

  const confirmedTeams = await prisma.team.count({
    where: { enduroId: enduro.id, status: 'CONFIRMED' },
  })

  return {
    ...enduro,
    confirmedTeams,
    spotsLeft: Math.max(0, enduro.maxTeams - confirmedTeams),
  }
})

export type EnduroDetail = NonNullable<Awaited<ReturnType<typeof getEnduroBySlug>>>

/**
 * Données publiques pour le formulaire d'inscription (mode WITH_REGISTRATION).
 * Renvoie `null` si l'enduro n'accepte pas d'inscriptions en ligne.
 */
export const getEnduroForRegistration = cache(async (slug: string) => {
  const enduro = await prisma.enduro.findFirst({
    where: { slug, status: 'PUBLISHED', mode: 'WITH_REGISTRATION' },
    select: {
      id: true,
      slug: true,
      name: true,
      locationName: true,
      postalCode: true,
      startAt: true,
      endAt: true,
      durationHours: true,
      maxTeams: true,
      maxFishersPerTeam: true,
      registrationFee: true,
      rulesText: true,
    },
  })

  if (!enduro) return null

  const confirmedTeams = await prisma.team.count({
    where: { enduroId: enduro.id, status: 'CONFIRMED' },
  })

  return { ...enduro, confirmedTeams, spotsLeft: Math.max(0, enduro.maxTeams - confirmedTeams) }
})

export type EnduroForRegistration = NonNullable<
  Awaited<ReturnType<typeof getEnduroForRegistration>>
>

/** Annonces publiques (recipients ALL) d'un enduro, pour affichage sur la page publique. */
export async function getPublicAnnouncements(enduroId: string) {
  return prisma.communication.findMany({
    where: { enduroId, recipients: 'ALL' },
    orderBy: { createdAt: 'desc' },
    take: 10,
    select: { id: true, subject: true, body: true, priority: true, createdAt: true },
  })
}
export type PublicAnnouncement = Awaited<ReturnType<typeof getPublicAnnouncements>>[number]
