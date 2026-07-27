'use server'

import { randomUUID } from 'node:crypto'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireRole } from '@/lib/auth/dal'
import { requireOwnedEnduro } from '@/lib/auth/owner'
import { getCommissaire } from '@/lib/commissaire/dal'
import { notifyTeamMembers } from '@/lib/notifications'
import { prisma } from '@/lib/prisma'
import { broadcastEnduroUpdate } from '@/lib/realtime'
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

  // La photo est envoyée directement du navigateur vers Supabase Storage (URL signée),
  // ce qui contourne les limites de taille des Server Actions / fonctions serverless.
  // Ici on ne reçoit que l'URL publique résultante — on la valide (doit venir de notre bucket).
  const rawPhotoUrl = (formData.get('photoUrl') as string | null)?.trim() || null
  let photoUrl: string | null = null
  if (rawPhotoUrl) {
    const prefix = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${CATCHES_BUCKET}/`
    if (!rawPhotoUrl.startsWith(prefix)) {
      return { message: 'Photo invalide. Réessayez.' }
    }
    photoUrl = rawPhotoUrl
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

  // Notifie les membres de l'équipe (comptes liés). Non bloquant.
  try {
    await notifyTeamMembers(teamId, enduro.id, {
      type: 'CATCH_VALIDATED',
      title: 'Nouvelle prise enregistrée',
      body: `Une prise de ${weightKg} kg (${species.toLowerCase()}) a été validée pour votre équipe.`,
      linkUrl: `/enduros/${enduro.slug}/classement`,
    })
  } catch {
    // Une erreur de notification ne doit pas faire échouer la saisie de la prise.
  }

  // Realtime : signale le classement live (instantané, best-effort).
  await broadcastEnduroUpdate(enduro.id)

  revalidatePath('/commissaire/app')
  revalidatePath(`/dashboard/enduros/${enduro.id}/validations`)
  revalidatePath(`/dashboard/enduros/${enduro.id}`)
  revalidatePath(`/enduros/${enduro.slug}`)
  revalidatePath('/enduros')
  return { ok: true }
}

// ── Upload photo : URL signée (le navigateur envoie le fichier directement à Storage) ──

export type CatchUploadPrep =
  | { ok: true; path: string; token: string }
  | { ok: false; message: string }

/**
 * Prépare un envoi de photo : renvoie un chemin + token d'upload signé (usage unique).
 * Le navigateur uploade ensuite directement vers Supabase Storage via ce token
 * (`uploadToSignedUrl`), sans passer par la Server Action → aucune limite de taille.
 */
export async function createCatchPhotoUpload(): Promise<CatchUploadPrep> {
  const commissaire = await getCommissaire()
  if (!commissaire) return { ok: false, message: 'Session expirée. Reconnectez-vous.' }

  const path = `${commissaire.enduro.id}/${randomUUID()}.jpg`
  const admin = createAdminClient()
  const { data, error } = await admin.storage.from(CATCHES_BUCKET).createSignedUploadUrl(path)
  if (error || !data) return { ok: false, message: "Impossible de préparer l'envoi de la photo." }
  return { ok: true, path: data.path, token: data.token }
}

// ── Organisateur : contester / annuler une prise ──

async function setCatchStatus(formData: FormData, status: 'CONTESTED' | 'CANCELLED' | 'VALID') {
  const user = await requireRole('ORGANIZER')
  const catchId = String(formData.get('catchId') ?? '')
  const c = await prisma.catch.findUnique({ where: { id: catchId }, select: { id: true, enduroId: true } })
  if (!c) redirect('/dashboard')
  const enduro = await requireOwnedEnduro(c.enduroId, user.id)
  await prisma.catch.update({ where: { id: c.id }, data: { status } })
  await broadcastEnduroUpdate(enduro.id)
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
