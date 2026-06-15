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

/**
 * Rôles fusionnés : tout utilisateur connecté peut organiser ET participer.
 * `requireRole` ne fait plus que vérifier l'authentification (le paramètre de rôle
 * est conservé pour compat des appels existants, mais ignoré).
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function requireRole(_role?: Role) {
  return requireUser()
}
