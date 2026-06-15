'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { type AuthFormState, loginSchema, signupSchema } from '@/lib/validations/auth'

// Rôles fusionnés : tout compte peut organiser ET participer. Valeur stockée par défaut.
const DEFAULT_ROLE = 'FISHERMAN' as const

async function siteOrigin() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL
  const h = await headers()
  const proto = h.get('x-forwarded-proto') ?? 'https'
  const host = h.get('host') ?? 'localhost:3000'
  return `${proto}://${host}`
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
    return { message: error.message }
  }

  // Crée l'utilisateur applicatif (table User) lié au même id que auth.users.
  if (data.user) {
    await prisma.user.upsert({
      where: { id: data.user.id },
      update: { email, firstName, lastName },
      create: { id: data.user.id, email, firstName, lastName, role: DEFAULT_ROLE },
    })
  }

  // Si confirmation email désactivée → session immédiate, on redirige.
  if (data.session) {
    redirect('/dashboard')
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

  redirect('/dashboard')
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/')
}
