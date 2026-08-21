import { cache } from 'react'
import { redirect } from 'next/navigation'
import type { Role } from '@/generated/prisma/enums'
import { getSpace } from '@/lib/auth/mode'
import { type SpaceMode, spaceHome } from '@/lib/auth/space'
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

  const existing = await prisma.user.findUnique({ where: { id: user.id } })
  if (existing) return existing

  // Auto-réparation : compte Auth valide sans ligne applicative
  // (ex. suppression manuelle côté Supabase, ou échec passé à l'inscription).
  return ensureAppUser(user)
})

/**
 * Crée la ligne `User` pour un compte Auth qui n'en a pas encore.
 * Si l'email est déjà occupé par un ancien compte (orphelin dont l'utilisateur
 * Auth a été supprimé), on récupère cet ancien compte : on repointe ses relations
 * vers le nouvel id puis on le supprime — le tout dans une transaction.
 */
async function ensureAppUser(authUser: { id: string; email?: string; user_metadata?: Record<string, unknown> }) {
  const email = authUser.email ?? `${authUser.id}@carpstrike.local`
  const firstName = (authUser.user_metadata?.firstName as string | undefined) ?? ''
  const lastName = (authUser.user_metadata?.lastName as string | undefined) ?? ''

  return prisma.$transaction(async (tx) => {
    const orphan = await tx.user.findUnique({ where: { email } })
    let created

    if (orphan && orphan.id !== authUser.id) {
      // Libère l'email, crée le nouveau compte, puis repointe les relations.
      await tx.user.update({
        where: { id: orphan.id },
        data: { email: `ancien-${orphan.id}@carpstrike.invalid` },
      })
      created = await tx.user.create({
        data: { id: authUser.id, email, firstName, lastName, role: 'FISHERMAN' },
      })
      await tx.enduro.updateMany({ where: { organizerId: orphan.id }, data: { organizerId: authUser.id } })
      await tx.teamMember.updateMany({ where: { userId: orphan.id }, data: { userId: authUser.id } })
      await tx.payment.updateMany({ where: { userId: orphan.id }, data: { userId: authUser.id } })
      await tx.communication.updateMany({ where: { sentById: orphan.id }, data: { sentById: authUser.id } })
      await tx.user.delete({ where: { id: orphan.id } })
    } else {
      created = await tx.user.create({
        data: { id: authUser.id, email, firstName, lastName, role: 'FISHERMAN' },
      })
    }

    // Rapproche les équipes déjà inscrites avec cette adresse email (formulaire public
    // rempli avant la création du compte) : le pêcheur retrouve sa participation dans son
    // profil et reçoit désormais les notifications de son équipe.
    if (authUser.email) {
      await tx.teamMember.updateMany({
        where: { userId: null, email: { equals: authUser.email, mode: 'insensitive' } },
        data: { userId: authUser.id },
      })
    }

    return created
  })
}

/** Exige un utilisateur connecté, sinon redirige vers /connexion. */
export async function requireUser() {
  const user = await getCurrentUser()
  if (!user) redirect('/connexion')
  return user
}

/**
 * Exige un utilisateur connecté **dans le bon espace de session**.
 *
 * Un même compte (même email) peut servir aux deux espaces, mais l'accès dépend de
 * celui choisi à la connexion : l'espace organisateur et l'espace pêcheur sont cloisonnés.
 * Ce contrôle double celui du proxy (qui ne couvre pas les Server Actions).
 */
export async function requireRole(role?: Role) {
  const user = await requireUser()
  if (!role) return user

  const space = await getSpace()
  const needed: SpaceMode = role === 'ORGANIZER' ? 'organizer' : 'fisherman'
  if (space !== needed) {
    redirect(`${spaceHome(space)}?espace=${space}`)
  }
  return user
}
