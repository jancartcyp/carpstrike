import { cache } from 'react'
import { prisma } from '@/lib/prisma'

/** Liste des enduros d'un organisateur (pour le dashboard). */
export async function getOrganizerEnduros(organizerId: string) {
  const enduros = await prisma.enduro.findMany({
    where: { organizerId },
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { teams: true, sectors: true } } },
  })

  return enduros.map((e) => ({
    id: e.id,
    slug: e.slug,
    name: e.name,
    status: e.status,
    mode: e.mode,
    startAt: e.startAt,
    endAt: e.endAt,
    durationHours: e.durationHours,
    locationName: e.locationName,
    maxTeams: e.maxTeams,
    teamsCount: e._count.teams,
    sectorsCount: e._count.sectors,
  }))
}

export type OrganizerEnduroListItem = Awaited<
  ReturnType<typeof getOrganizerEnduros>
>[number]

/**
 * Détail d'un enduro pour son organisateur (contrôle de propriété).
 * Renvoie `null` si introuvable OU si l'utilisateur n'en est pas le propriétaire.
 */
export const getOrganizerEnduro = cache(async (id: string, organizerId: string) => {
  return prisma.enduro.findFirst({
    where: { id, organizerId },
    include: {
      sectors: {
        orderBy: { name: 'asc' },
        include: { _count: { select: { teams: true } } },
      },
      _count: { select: { teams: true } },
    },
  })
})

export type OrganizerEnduro = NonNullable<Awaited<ReturnType<typeof getOrganizerEnduro>>>
