import { cache } from 'react'
import { prisma } from '@/lib/prisma'

type NotificationType = 'GENERIC' | 'ANNOUNCEMENT' | 'CATCH_VALIDATED'
type RecipientFilter = 'ALL' | 'CONFIRMED' | 'WAITLIST' | 'PENDING'

type NotifPayload = {
  type: NotificationType
  title: string
  body: string
  linkUrl?: string | null
}

/** Crée une notification pour une liste d'utilisateurs (dédupliquée). Renvoie le nombre créé. */
async function createForUsers(userIds: string[], enduroId: string | null, p: NotifPayload) {
  const unique = [...new Set(userIds)]
  if (unique.length === 0) return 0
  await prisma.notification.createMany({
    data: unique.map((userId) => ({
      userId,
      enduroId,
      type: p.type,
      title: p.title,
      body: p.body,
      linkUrl: p.linkUrl ?? null,
    })),
  })
  return unique.length
}

/**
 * Notifie les membres d'équipes (ayant un compte lié) d'un enduro, filtrés par statut d'équipe.
 * Les inscriptions anonymes (TeamMember.userId null) ne sont pas notifiables → ignorées.
 */
export async function notifyEnduroMembers(
  enduroId: string,
  recipients: RecipientFilter,
  p: NotifPayload
) {
  const members = await prisma.teamMember.findMany({
    where: {
      userId: { not: null },
      team: {
        enduroId,
        ...(recipients !== 'ALL' ? { status: recipients } : {}),
      },
    },
    select: { userId: true },
  })
  const userIds = members.map((m) => m.userId).filter((x): x is string => x !== null)
  return createForUsers(userIds, enduroId, p)
}

/** Notifie les membres (comptes liés) d'une équipe précise. */
export async function notifyTeamMembers(teamId: string, enduroId: string, p: NotifPayload) {
  const members = await prisma.teamMember.findMany({
    where: { teamId, userId: { not: null } },
    select: { userId: true },
  })
  const userIds = members.map((m) => m.userId).filter((x): x is string => x !== null)
  return createForUsers(userIds, enduroId, p)
}

/** Nombre de notifications non lues (pour la pastille du header). */
export const getUnreadNotificationCount = cache(async (userId: string) =>
  prisma.notification.count({ where: { userId, read: false } })
)

/** 50 dernières notifications de l'utilisateur. */
export async function getUserNotifications(userId: string) {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })
}
export type UserNotification = Awaited<ReturnType<typeof getUserNotifications>>[number]
