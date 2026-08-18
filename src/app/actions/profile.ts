'use server'

import { randomUUID } from 'node:crypto'
import { revalidatePath } from 'next/cache'
import { requireUser } from '@/lib/auth/dal'
import { prisma } from '@/lib/prisma'
import { createAdminClient } from '@/lib/supabase/admin'

const AVATARS_BUCKET = 'avatars'

export type AvatarUploadPrep =
  | { ok: true; path: string; token: string }
  | { ok: false; message: string }

/** Prépare l'envoi de la photo de profil : URL d'upload signée (le navigateur uploade en direct). */
export async function createAvatarUpload(): Promise<AvatarUploadPrep> {
  const user = await requireUser()
  const path = `${user.id}/${randomUUID()}.jpg`
  const admin = createAdminClient()
  const { data, error } = await admin.storage.from(AVATARS_BUCKET).createSignedUploadUrl(path)
  if (error || !data) return { ok: false, message: "Impossible de préparer l'envoi de la photo." }
  return { ok: true, path: data.path, token: data.token }
}

export type AvatarState = { ok?: boolean; message?: string } | undefined

/** Enregistre l'URL de la photo de profil (déjà uploadée côté navigateur). */
export async function updateAvatar(_prev: AvatarState, formData: FormData): Promise<AvatarState> {
  const user = await requireUser()
  const url = (formData.get('avatarUrl') as string | null)?.trim() || null
  if (!url) return { message: 'Aucune image reçue.' }

  // Doit venir de notre bucket ET du dossier de CET utilisateur (pas l'image d'un autre compte).
  const prefix = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${AVATARS_BUCKET}/${user.id}/`
  if (!url.startsWith(prefix)) return { message: 'Image invalide.' }

  await prisma.user.update({ where: { id: user.id }, data: { avatarUrl: url } })
  revalidatePath('/profil')
  revalidatePath('/', 'layout')
  return { ok: true }
}
