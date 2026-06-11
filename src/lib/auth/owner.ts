import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'

/**
 * Charge un enduro en vérifiant qu'il appartient bien à l'organisateur.
 * Redirige vers /dashboard si introuvable ou non autorisé.
 * Utilisé par les server actions (défense en profondeur en plus du proxy).
 */
export async function requireOwnedEnduro(enduroId: string, organizerId: string) {
  const enduro = await prisma.enduro.findFirst({ where: { id: enduroId, organizerId } })
  if (!enduro) redirect('/dashboard')
  return enduro
}
