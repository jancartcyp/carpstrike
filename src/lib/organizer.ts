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

/** Équipes d'un enduro (avec membres et secteur) pour la gestion organisateur. */
export async function getEnduroTeams(enduroId: string) {
  return prisma.team.findMany({
    where: { enduroId },
    orderBy: [{ status: 'asc' }, { createdAt: 'asc' }],
    include: {
      members: { orderBy: { isCaptain: 'desc' } },
      sector: { select: { id: true, name: true, color: true } },
    },
  })
}
export type EnduroTeam = Awaited<ReturnType<typeof getEnduroTeams>>[number]

/** Demandes d'inscription d'un enduro (mode WITH_REGISTRATION). */
export async function getEnduroRequests(enduroId: string) {
  return prisma.registrationRequest.findMany({
    where: { enduroId },
    orderBy: { requestedAt: 'desc' },
  })
}
export type EnduroRequest = Awaited<ReturnType<typeof getEnduroRequests>>[number]

/** Commissaires d'un enduro (avec nombre de prises saisies). */
export async function getEnduroCommissaires(enduroId: string) {
  return prisma.commissaire.findMany({
    where: { enduroId },
    orderBy: { createdAt: 'asc' },
    include: { _count: { select: { catches: true } } },
  })
}
export type EnduroCommissaire = Awaited<ReturnType<typeof getEnduroCommissaires>>[number]

/** Annonces (communications) d'un enduro pour l'historique organisateur. */
export async function getEnduroCommunications(enduroId: string) {
  return prisma.communication.findMany({
    where: { enduroId },
    orderBy: { createdAt: 'desc' },
  })
}
export type EnduroCommunication = Awaited<ReturnType<typeof getEnduroCommunications>>[number]

/** Prises d'un enduro pour la page validations (équipe, secteur, commissaire). */
export async function getEnduroCatches(enduroId: string) {
  return prisma.catch.findMany({
    where: { enduroId },
    orderBy: { caughtAt: 'desc' },
    include: {
      team: { select: { name: true, pegNumber: true, sector: { select: { name: true } } } },
      commissaire: { select: { displayName: true } },
    },
  })
}
export type EnduroCatch = Awaited<ReturnType<typeof getEnduroCatches>>[number]
