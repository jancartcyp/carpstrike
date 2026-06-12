import { prisma } from '@/lib/prisma'
import { getEnduroRanking } from '@/lib/ranking'

export type FishermanParticipation = {
  enduroSlug: string
  enduroName: string
  status: string
  startAt: Date
  endAt: Date
  teamId: string
  teamName: string
  sectorName: string | null
  total: number
  catches: number
  biggest: number
  rank: number | null
  isPodium: boolean
}

/** Profil d'un pêcheur : participations, stats agrégées, trophées (podiums). */
export async function getFishermanProfile(userId: string) {
  const memberships = await prisma.teamMember.findMany({
    where: { userId },
    include: {
      team: {
        include: {
          enduro: { select: { slug: true, name: true, status: true, startAt: true, endAt: true } },
          sector: { select: { name: true } },
          catches: { where: { status: 'VALID' }, select: { weightKg: true } },
        },
      },
    },
  })

  const participations: FishermanParticipation[] = []
  // Cache des classements par slug pour éviter les recalculs.
  const rankingCache = new Map<string, Awaited<ReturnType<typeof getEnduroRanking>>>()

  for (const m of memberships) {
    const team = m.team
    const enduro = team.enduro
    const weights = team.catches.map((c) => c.weightKg)
    const total = weights.reduce((s, w) => s + w, 0)
    const biggest = weights.length ? Math.max(...weights) : 0

    // Rang de l'équipe (si l'enduro est public/classé).
    let rank: number | null = null
    if (['LIVE', 'PUBLISHED', 'FINISHED'].includes(enduro.status)) {
      let ranking = rankingCache.get(enduro.slug)
      if (ranking === undefined) {
        ranking = await getEnduroRanking(enduro.slug)
        rankingCache.set(enduro.slug, ranking)
      }
      rank = ranking?.general.find((t) => t.id === team.id)?.rank ?? null
    }

    participations.push({
      enduroSlug: enduro.slug,
      enduroName: enduro.name,
      status: enduro.status,
      startAt: enduro.startAt,
      endAt: enduro.endAt,
      teamId: team.id,
      teamName: team.name,
      sectorName: team.sector?.name ?? null,
      total,
      catches: weights.length,
      biggest,
      rank,
      isPodium: enduro.status === 'FINISHED' && rank !== null && rank <= 3,
    })
  }

  participations.sort((a, b) => b.startAt.getTime() - a.startAt.getTime())

  return {
    participations,
    stats: {
      enduros: participations.length,
      totalCatches: participations.reduce((s, p) => s + p.catches, 0),
      biggest: participations.reduce((m, p) => Math.max(m, p.biggest), 0),
      trophies: participations.filter((p) => p.isPodium).length,
    },
  }
}

export type FishermanProfile = Awaited<ReturnType<typeof getFishermanProfile>>
