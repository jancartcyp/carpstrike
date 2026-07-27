import { prisma } from '@/lib/prisma'

export type RankingTeam = {
  id: string
  name: string
  sectorName: string | null
  pegNumber: number | null
  catches: number
  biggest: number
  total: number
  sectorRank: number
  rank: number
}

/** Clé de secteur pour le groupement (les équipes sans secteur partagent un groupe). */
function sectorKey(sectorName: string | null): string {
  return sectorName ?? '—'
}

function byTotalThenBiggest(a: { total: number; biggest: number }, b: { total: number; biggest: number }) {
  if (b.total !== a.total) return b.total - a.total
  return b.biggest - a.biggest
}

/**
 * Classement général avec **rotation de secteurs** (SPEC 4.2).
 * 1. Tri intra-secteur par total (puis plus grosse prise) → sectorRank.
 * 2. Construction par « tours » : tous les 1ers de secteur, puis les 2es, etc.
 * Fonction pure (testable indépendamment de la DB).
 */
export function buildGeneralRanking<T extends { sectorName: string | null; total: number; biggest: number }>(
  teams: T[]
): (T & { sectorRank: number; rank: number })[] {
  const bySector = new Map<string, T[]>()
  for (const t of teams) {
    const key = sectorKey(t.sectorName)
    const arr = bySector.get(key)
    if (arr) arr.push(t)
    else bySector.set(key, [t])
  }

  // Tri intra-secteur + attribution du rang de secteur.
  const ranked = new Map<T, number>()
  for (const arr of bySector.values()) {
    arr.sort(byTotalThenBiggest)
    arr.forEach((t, i) => ranked.set(t, i + 1))
  }

  const maxRank = Math.max(0, ...[...bySector.values()].map((a) => a.length))
  const final: (T & { sectorRank: number; rank: number })[] = []

  for (let tour = 1; tour <= maxRank; tour++) {
    const thisTour = teams
      .filter((t) => ranked.get(t) === tour)
      .sort(byTotalThenBiggest)
    for (const t of thisTour) {
      final.push({ ...t, sectorRank: tour, rank: final.length + 1 })
    }
  }

  return final
}

/** Classement complet d'un enduro public (depuis les prises VALID). */
export async function getEnduroRanking(slug: string) {
  const enduro = await prisma.enduro.findFirst({
    where: { slug, status: { in: ['LIVE', 'PUBLISHED', 'FINISHED'] } },
    select: {
      id: true,
      slug: true,
      name: true,
      status: true,
      locationName: true,
      startAt: true,
      endAt: true,
      durationHours: true,
    },
  })
  if (!enduro) return null

  const teams = await prisma.team.findMany({
    where: { enduroId: enduro.id, status: 'CONFIRMED' },
    select: {
      id: true,
      name: true,
      pegNumber: true,
      sector: { select: { name: true } },
      catches: { where: { status: 'VALID' }, select: { weightKg: true } },
    },
  })

  const base = teams.map((t) => {
    const weights = t.catches.map((c) => c.weightKg)
    return {
      id: t.id,
      name: t.name,
      sectorName: t.sector?.name ?? null,
      pegNumber: t.pegNumber,
      catches: weights.length,
      biggest: weights.length ? Math.max(...weights) : 0,
      total: weights.reduce((s, w) => s + w, 0),
    }
  })

  const general: RankingTeam[] = buildGeneralRanking(base)

  // Stats par secteur.
  const sectorMap = new Map<
    string,
    { name: string; teams: number; totalKg: number; catches: number; leader: string | null; leaderKg: number }
  >()
  for (const t of general) {
    const key = sectorKey(t.sectorName)
    const s =
      sectorMap.get(key) ??
      { name: t.sectorName ?? 'Sans secteur', teams: 0, totalKg: 0, catches: 0, leader: null, leaderKg: 0 }
    s.teams += 1
    s.totalKg += t.total
    s.catches += t.catches
    if (t.total > s.leaderKg) {
      s.leaderKg = t.total
      s.leader = t.name
    }
    sectorMap.set(key, s)
  }
  const sectors = [...sectorMap.values()].sort((a, b) => a.name.localeCompare(b.name))

  const totalKg = general.reduce((s, t) => s + t.total, 0)
  const totalCatches = general.reduce((s, t) => s + t.catches, 0)
  const biggestTeam = general.reduce<RankingTeam | null>(
    (max, t) => (t.biggest > (max?.biggest ?? 0) ? t : max),
    null
  )

  return {
    enduro,
    general,
    sectors,
    stats: {
      totalKg,
      totalCatches,
      teams: general.length,
      biggestCatch: biggestTeam ? { team: biggestTeam.name, weightKg: biggestTeam.biggest } : null,
      podium: general.slice(0, 3),
    },
  }
}

export type EnduroRanking = NonNullable<Awaited<ReturnType<typeof getEnduroRanking>>>

const SPECIES_LABELS: Record<string, string> = {
  COMMUNE: 'Commune',
  MIROIR: 'Miroir',
  CUIR: 'Cuir',
  KOI: 'Koï',
  AMOUR_BLANC: 'Amour blanc',
}

/** Résultats finaux d'un enduro CLÔTURÉ (FINISHED) : classement figé + espèces + galerie. */
export async function getEnduroResults(slug: string) {
  const enduro = await prisma.enduro.findFirst({
    where: { slug, status: 'FINISHED' },
    select: {
      id: true,
      slug: true,
      name: true,
      status: true,
      locationName: true,
      startAt: true,
      endAt: true,
      durationHours: true,
      prizePool: true,
    },
  })
  if (!enduro) return null

  const teams = await prisma.team.findMany({
    where: { enduroId: enduro.id, status: 'CONFIRMED' },
    select: {
      id: true,
      name: true,
      pegNumber: true,
      sector: { select: { name: true } },
      catches: {
        where: { status: 'VALID' },
        select: { weightKg: true, species: true, photoUrl: true },
      },
    },
  })

  const base = teams.map((t) => {
    const weights = t.catches.map((c) => c.weightKg)
    return {
      id: t.id,
      name: t.name,
      sectorName: t.sector?.name ?? null,
      pegNumber: t.pegNumber,
      catches: weights.length,
      biggest: weights.length ? Math.max(...weights) : 0,
      total: weights.reduce((s, w) => s + w, 0),
    }
  })
  const general = buildGeneralRanking(base)

  // Répartition par espèce + galerie (prises avec photo).
  const speciesCount = new Map<string, number>()
  const gallery: { url: string; weightKg: number; team: string }[] = []
  for (const t of teams) {
    for (const c of t.catches) {
      speciesCount.set(c.species, (speciesCount.get(c.species) ?? 0) + 1)
      if (c.photoUrl) gallery.push({ url: c.photoUrl, weightKg: c.weightKg, team: t.name })
    }
  }
  const species = [...speciesCount.entries()]
    .map(([key, count]) => ({ key, label: SPECIES_LABELS[key] ?? key, count }))
    .sort((a, b) => b.count - a.count)

  gallery.sort((a, b) => b.weightKg - a.weightKg)

  const totalKg = general.reduce((s, t) => s + t.total, 0)
  const totalCatches = general.reduce((s, t) => s + t.catches, 0)
  const biggestTeam = general.reduce<RankingTeam | null>(
    (max, t) => (t.biggest > (max?.biggest ?? 0) ? t : max),
    null
  )

  return {
    enduro,
    general,
    podium: general.slice(0, 3),
    species,
    gallery: gallery.slice(0, 12),
    stats: {
      totalKg,
      totalCatches,
      teams: general.length,
      biggestCatch: biggestTeam ? { team: biggestTeam.name, weightKg: biggestTeam.biggest } : null,
    },
  }
}

export type EnduroResults = NonNullable<Awaited<ReturnType<typeof getEnduroResults>>>

/** Détail d'une équipe pour la page publique : toutes ses prises (photos incluses) + son rang. */
export async function getTeamCatchDetail(slug: string, teamId: string) {
  const ranking = await getEnduroRanking(slug)
  if (!ranking) return null

  const team = await prisma.team.findFirst({
    where: { id: teamId, enduro: { slug } },
    select: {
      id: true,
      name: true,
      pegNumber: true,
      sector: { select: { name: true } },
      members: {
        orderBy: { isCaptain: 'desc' },
        select: { firstName: true, lastName: true, isCaptain: true, userId: true },
      },
      catches: {
        orderBy: { caughtAt: 'desc' },
        select: {
          id: true,
          weightKg: true,
          species: true,
          photoUrl: true,
          caughtAt: true,
          status: true,
          note: true,
          commissaire: { select: { displayName: true } },
        },
      },
    },
  })
  if (!team) return null

  const rankEntry = ranking.general.find((t) => t.id === teamId)
  const valid = team.catches.filter((c) => c.status === 'VALID')
  const totalKg = valid.reduce((s, c) => s + c.weightKg, 0)
  const biggestKg = valid.reduce((m, c) => Math.max(m, c.weightKg), 0)

  return {
    enduro: ranking.enduro,
    team: {
      id: team.id,
      name: team.name,
      pegNumber: team.pegNumber,
      sectorName: team.sector?.name ?? null,
      members: team.members,
    },
    rank: rankEntry?.rank ?? null,
    validCount: valid.length,
    totalKg,
    biggestKg,
    catches: team.catches.map((c) => ({
      id: c.id,
      weightKg: c.weightKg,
      species: c.species,
      speciesLabel: SPECIES_LABELS[c.species] ?? c.species,
      photoUrl: c.photoUrl,
      caughtAt: c.caughtAt,
      status: c.status,
      note: c.note,
      commissaire: c.commissaire?.displayName ?? null,
    })),
  }
}

export type TeamCatchDetail = NonNullable<Awaited<ReturnType<typeof getTeamCatchDetail>>>
