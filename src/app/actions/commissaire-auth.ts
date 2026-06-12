'use server'

import { redirect } from 'next/navigation'
import {
  clearCommissaireSession,
  setCommissaireSession,
} from '@/lib/commissaire/session'
import { verifyPassword } from '@/lib/commissaire/password'
import { prisma } from '@/lib/prisma'
import { clientIp, rateLimit } from '@/lib/rate-limit'
import { commissaireLoginSchema } from '@/lib/validations/catch'

export type CommissaireLoginState = { message?: string } | undefined

export async function loginCommissaire(
  _prev: CommissaireLoginState,
  formData: FormData
): Promise<CommissaireLoginState> {
  // Anti-brute-force : limite par IP.
  if (!rateLimit(`clogin:${await clientIp()}`, 10, 5 * 60 * 1000)) {
    return { message: 'Trop de tentatives. Réessayez dans quelques minutes.' }
  }

  const parsed = commissaireLoginSchema.safeParse({
    username: formData.get('username'),
    password: formData.get('password'),
  })
  if (!parsed.success) {
    return { message: 'Identifiant et mot de passe requis.' }
  }

  const { username, password } = parsed.data
  const commissaire = await prisma.commissaire.findUnique({
    where: { username },
    include: { enduro: { select: { status: true } } },
  })

  const invalid = { message: 'Identifiant ou mot de passe incorrect.' }
  if (!commissaire || !commissaire.active) return invalid
  if (!verifyPassword(password, commissaire.passwordHash)) return invalid
  if (commissaire.enduro.status === 'FINISHED' || commissaire.enduro.status === 'CANCELLED') {
    return { message: 'Cet enduro est clôturé : accès commissaire désactivé.' }
  }

  await setCommissaireSession(commissaire.id)
  redirect('/commissaire/app')
}

export async function logoutCommissaire() {
  await clearCommissaireSession()
  redirect('/commissaire')
}
