import { cache } from 'react'
import { redirect } from 'next/navigation'
import type { Role } from '@/generated/prisma/enums'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'

/**
 * Data Access Layer — point unique de vérification de l'utilisateur courant.
 * Importe next/headers (via createClient) → module strictement serveur.
 *
 * Vérifie l'identité auprès du serveur Auth Supabase (getUser, donc fiable),
 * puis charge l'utilisateur applicatif depuis la table User (Prisma).
 * Mémoïsé par requête via React cache().
 */
export const getCurrentUser = cache(async () => {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  return prisma.user.findUnique({ where: { id: user.id } })
})

/** Exige un utilisateur connecté, sinon redirige vers /connexion. */
export async function requireUser() {
  const user = await getCurrentUser()
  if (!user) redirect('/connexion')
  return user
}

/** Exige un utilisateur connecté avec un rôle précis, sinon redirige. */
export async function requireRole(role: Role) {
  const user = await requireUser()
  if (user.role !== role) redirect('/')
  return user
}
