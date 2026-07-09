'use server'

import { revalidatePath } from 'next/cache'
import { getCurrentUser } from '@/lib/auth/dal'
import { prisma } from '@/lib/prisma'

/** Marque toutes les notifications non lues de l'utilisateur courant comme lues. */
export async function markAllNotificationsRead() {
  const user = await getCurrentUser()
  if (!user) return
  await prisma.notification.updateMany({
    where: { userId: user.id, read: false },
    data: { read: true },
  })
  revalidatePath('/notifications')
  revalidatePath('/', 'layout')
}
