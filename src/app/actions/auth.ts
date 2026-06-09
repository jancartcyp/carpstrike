'use server'

import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { type AuthFormState, loginSchema, signupSchema } from '@/lib/validations/auth'

function destForRole(role: string | null | undefined) {
  return role === 'ORGANIZER' ? '/dashboard' : '/profil'
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
    role: formData.get('role'),
  })

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors }
  }

  const { firstName, lastName, email, password, role } = parsed.data
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { role, firstName, lastName } },
  })

  if (error) {
    return { message: error.message }
  }

  // Crée l'utilisateur applicatif (table User) lié au même id que auth.users.
  if (data.user) {
    await prisma.user.upsert({
      where: { id: data.user.id },
      update: { email, firstName, lastName, role },
      create: { id: data.user.id, email, firstName, lastName, role },
    })
  }

  // Si confirmation email désactivée → session immédiate, on redirige.
  if (data.session) {
    redirect(destForRole(role))
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

  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return { message: 'Email ou mot de passe incorrect.' }
  }

  const dbUser = await prisma.user.findUnique({ where: { id: data.user.id } })
  redirect(destForRole(dbUser?.role))
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/')
}
