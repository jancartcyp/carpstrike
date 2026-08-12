'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { clearSpace, setSpace } from '@/lib/auth/mode'
import { parseSpace, type SpaceMode, spaceHome } from '@/lib/auth/space'
import { isPasswordPwned } from '@/lib/auth/pwned-password'
import { createClient } from '@/lib/supabase/server'
import { type AuthFormState, loginSchema, signupSchema } from '@/lib/validations/auth'

/** Espace demandé par le formulaire (organisateur / pêcheur), pêcheur par défaut. */
function requestedSpace(formData: FormData): SpaceMode {
  return parseSpace(formData.get('space') as string | null) ?? 'fisherman'
}

async function siteOrigin() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL
  const h = await headers()
  const proto = h.get('x-forwarded-proto') ?? 'https'
  const host = h.get('host') ?? 'localhost:3000'
  return `${proto}://${host}`
}

// Traduit les erreurs d'inscription Supabase (messages renvoyés en anglais) en français lisible.
// On se base d'abord sur le `code` stable, sinon sur le contenu du message.
function frenchSignupError(error: { message: string; code?: string }): string {
  const code = error.code ?? ''
  const msg = error.message.toLowerCase()

  if (code === 'user_already_exists' || msg.includes('already registered') || msg.includes('already been registered')) {
    return 'Un compte existe déjà avec cette adresse email. Connecte-toi ou utilise « mot de passe oublié ».'
  }
  // Protection anti-mots de passe fuités (HaveIBeenPwned) + mots de passe trop faibles.
  if (code === 'weak_password' || msg.includes('pwned') || msg.includes('breach') || msg.includes('data breach') || msg.includes('compromis') || msg.includes('weak')) {
    return 'Ce mot de passe a déjà été exposé dans une fuite de données connue (ou est trop faible). Choisis-en un autre, plus robuste.'
  }
  if (code.includes('rate_limit') || msg.includes('rate limit') || msg.includes('too many')) {
    return 'Trop de tentatives. Patiente quelques minutes avant de réessayer.'
  }
  if (code === 'signup_disabled' || msg.includes('signups not allowed') || msg.includes('signup is disabled')) {
    return 'Les inscriptions sont momentanément désactivées. Réessaie plus tard.'
  }
  if (code === 'email_address_invalid' || (msg.includes('invalid') && msg.includes('email'))) {
    return 'Cette adresse email est invalide. Vérifie-la et réessaie.'
  }
  return 'Impossible de créer le compte pour le moment. Vérifie tes informations et réessaie.'
}

export async function signup(
  _prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const parsed = signupSchema.safeParse({
    firstName: formData.get('firstName'),
    lastName: formData.get('lastName'),
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors }
  }

  const { firstName, lastName, email, password } = parsed.data

  // Protection anti-mots de passe fuités (équivalent gratuit de l'option Supabase Pro).
  if (await isPasswordPwned(password)) {
    return {
      errors: {
        password: [
          'Ce mot de passe a déjà été exposé dans une fuite de données connue. Choisis-en un autre, plus robuste.',
        ],
      },
    }
  }

  const supabase = await createClient()

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { firstName, lastName },
      emailRedirectTo: `${await siteOrigin()}/auth/confirm`,
    },
  })

  if (error) {
    return { message: frenchSignupError(error) }
  }

  // La ligne applicative `User` est créée à la volée par getCurrentUser (auth/dal)
  // à la première requête authentifiée — évite tout conflit d'unicité ici.

  // L'espace choisi à l'inscription devient l'espace actif.
  const space = requestedSpace(formData)
  await setSpace(space)

  // Si confirmation email désactivée → session immédiate, on redirige.
  if (data.session) {
    redirect(spaceHome(space))
  }

  // Sinon, confirmation requise.
  return {
    message: 'Compte créé ! Vérifie ta boîte mail pour confirmer ton adresse avant de te connecter.',
  }
}

export async function login(
  _prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors }
  }

  const { email, password } = parsed.data
  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return { message: 'Email ou mot de passe incorrect.' }
  }

  // L'espace choisi à la connexion détermine où l'on arrive et ce à quoi on accède.
  const space = requestedSpace(formData)
  await setSpace(space)

  redirect(spaceHome(space))
}

/** Bascule l'espace actif (organisateur ↔ pêcheur) sans se reconnecter. */
export async function switchSpace(formData: FormData) {
  const target = parseSpace(formData.get('space') as string | null)
  if (!target) redirect('/')
  await setSpace(target)
  redirect(spaceHome(target))
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  // L'espace actif est propre à la session : on le réinitialise.
  await clearSpace()
  redirect('/')
}
