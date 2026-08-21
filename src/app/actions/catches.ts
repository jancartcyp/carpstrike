'use server'

import { randomUUID } from 'node:crypto'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireRole } from '@/lib/auth/dal'
import { requireOwnedEnduro } from '@/lib/auth/owner'
import { getCommissaire } from '@/lib/commissaire/dal'
import { catchWindow } from '@/lib/enduro-status'
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

  // Saisie fermée hors période : avant le départ, après la fin (+ tampon), ou enduro clôturé/annulé.
  const window = catchWindow(enduro)
  if (!window.open) {
    return { message: window.reason }
  }

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
  // Ici on ne reçoit que l'URL publique résultante — elle doit venir de notre bucket ET du
  // dossier de CET enduro (interdit une URL arbitraire ou empruntée à un autre enduro).
  const prefix = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${CATCHES_BUCKET}/${enduro.id}/`
  const rawPhotoUrl = (formData.get('photoUrl') as string | null)?.trim() || null
  const rawThumbUrl = (formData.get('photoThumbUrl') as string | null)?.trim() || null

  let photoUrl: string | null = null
  let photoThumbUrl: string | null = null
  if (rawPhotoUrl) {
    if (!rawPhotoUrl.startsWith(prefix)) {
      return { message: 'Photo invalide. Réessayez.' }
    }
    photoUrl = rawPhotoUrl
    // La miniature est facultative : si elle manque ou n'est pas valide, l'affichage
    // retombe simplement sur la version pleine.
    if (rawThumbUrl && rawThumbUrl.startsWith(prefix)) {
      photoThumbUrl = rawThumbUrl
    }
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
      photoThumbUrl,
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
  | {
      ok: true
      full: { path: string; token: string }
      thumb: { path: string; token: string }
    }
  | { ok: false; message: string }

/**
 * Prépare l'envoi d'une photo : deux chemins + tokens d'upload signés (usage unique),
 * un pour la version pleine et un pour la miniature.
 * Le navigateur compresse puis uploade directement vers Supabase Storage via ces tokens
 * (`uploadToSignedUrl`), sans passer par la Server Action → aucune limite de taille.
 */
export async function createCatchPhotoUpload(): Promise<CatchUploadPrep> {
  const commissaire = await getCommissaire()
  if (!commissaire) return { ok: false, message: 'Session expirée. Reconnectez-vous.' }

  // Inutile d'accepter des fichiers si la saisie est fermée.
  const window = catchWindow(commissaire.enduro)
  if (!window.open) return { ok: false, message: window.reason! }

  const id = randomUUID()
  const fullPath = `${commissaire.enduro.id}/${id}.jpg`
  const thumbPath = `${commissaire.enduro.id}/${id}-thumb.jpg`

  const admin = createAdminClient()
  const [full, thumb] = await Promise.all([
    admin.storage.from(CATCHES_BUCKET).createSignedUploadUrl(fullPath),
    admin.storage.from(CATCHES_BUCKET).createSignedUploadUrl(thumbPath),
  ])
  if (full.error || !full.data || thumb.error || !thumb.data) {
    return { ok: false, message: "Impossible de préparer l'envoi de la photo." }
  }
  return {
    ok: true,
    full: { path: full.data.path, token: full.data.token },
    thumb: { path: thumb.data.path, token: thumb.data.token },
  }
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
