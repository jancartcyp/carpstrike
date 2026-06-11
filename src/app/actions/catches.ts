'use server'

import { randomUUID } from 'node:crypto'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireRole } from '@/lib/auth/dal'
import { requireOwnedEnduro } from '@/lib/auth/owner'
import { getCommissaire } from '@/lib/commissaire/dal'
import { prisma } from '@/lib/prisma'
import { CATCHES_BUCKET, createAdminClient } from '@/lib/supabase/admin'
import { catchSchema } from '@/lib/validations/catch'

export type CatchFormState = { errors?: Record<string, string[]>; message?: string; ok?: boolean } | undefined

export async function submitCatch(
  _prev: CatchFormState,
  formData: FormData
): Promise<CatchFormState> {
  const commissaire = await getCommissaire()
  if (!commissaire) return { message: 'Session expirée. Reconnectez-vous.' }

  const parsed = catchSchema.safeParse({
    teamId: formData.get('teamId'),
    weightKg: formData.get('weightKg'),
    species: formData.get('species'),
    note: formData.get('note'),
  })
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors }
  }

  const { teamId, weightKg, species, note } = parsed.data
  const enduro = commissaire.enduro

  // L'équipe doit appartenir à cet enduro.
  const team = await prisma.team.findFirst({
    where: { id: teamId, enduroId: enduro.id },
    select: { id: true },
  })
  if (!team) return { message: 'Équipe introuvable.' }

  // Refus sous la maille minimum (SPEC 4.3).
  if (weightKg < enduro.minWeightKg) {
    return { message: `Sous la maille minimum (${enduro.minWeightKg} kg) — prise non enregistrée.` }
  }

  // Photo : upload si fournie ; obligatoire si l'organisateur l'exige.
  let photoUrl: string | null = null
  const photo = formData.get('photo')
  if (photo instanceof File && photo.size > 0) {
    const ext = (photo.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '')
    const path = `${enduro.id}/${randomUUID()}.${ext || 'jpg'}`
    const admin = createAdminClient()
    const buffer = Buffer.from(await photo.arrayBuffer())
    const { error } = await admin.storage
      .from(CATCHES_BUCKET)
      .upload(path, buffer, { contentType: photo.type || 'image/jpeg', upsert: false })
    if (error) {
      return { message: 'Échec de l’upload de la photo. Réessayez.' }
    }
    photoUrl = admin.storage.from(CATCHES_BUCKET).getPublicUrl(path).data.publicUrl
  } else if (enduro.requirePhoto) {
    return { message: 'La photo est obligatoire pour cet enduro.' }
  }

  await prisma.catch.create({
    data: {
      enduroId: enduro.id,
      teamId,
      commissaireId: commissaire.id,
      weightKg,
      species,
      photoUrl,
      status: 'VALID',
      note: note ?? null,
    },
  })

  revalidatePath('/commissaire/app')
  revalidatePath(`/dashboard/enduros/${enduro.id}/validations`)
  revalidatePath(`/dashboard/enduros/${enduro.id}`)
  revalidatePath(`/enduros/${enduro.slug}`)
  revalidatePath('/enduros')
  return { ok: true }
}

// ── Organisateur : contester / annuler une prise ──

async function setCatchStatus(formData: FormData, status: 'CONTESTED' | 'CANCELLED' | 'VALID') {
  const user = await requireRole('ORGANIZER')
  const catchId = String(formData.get('catchId') ?? '')
  const c = await prisma.catch.findUnique({ where: { id: catchId }, select: { id: true, enduroId: true } })
  if (!c) redirect('/dashboard')
  const enduro = await requireOwnedEnduro(c.enduroId, user.id)
  await prisma.catch.update({ where: { id: c.id }, data: { status } })
  revalidatePath(`/dashboard/enduros/${enduro.id}/validations`)
  revalidatePath(`/dashboard/enduros/${enduro.id}`)
  revalidatePath(`/enduros/${enduro.slug}`)
  redirect(`/dashboard/enduros/${enduro.id}/validations`)
}

export async function contestCatch(formData: FormData) {
  await setCatchStatus(formData, 'CONTESTED')
}
export async function cancelCatch(formData: FormData) {
  await setCatchStatus(formData, 'CANCELLED')
}
export async function restoreCatch(formData: FormData) {
  await setCatchStatus(formData, 'VALID')
}
