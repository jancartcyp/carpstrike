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
