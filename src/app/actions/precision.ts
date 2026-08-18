'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireRole } from '@/lib/auth/dal'
import { requireOwnedEnduro } from '@/lib/auth/owner'
import { prisma } from '@/lib/prisma'

export type PrecisionFormState = { message?: string; ok?: boolean } | undefined

// Un lancer vide efface la valeur ; sinon entier de 0 à 100 000 cm (1 km, borne large).
const throwField = z
  .string()
  .trim()
  .transform((v) => (v === '' ? null : v))
  .pipe(
    z
      .string()
      .regex(/^\d+$/, { error: 'Distance invalide' })
      .transform((v) => Number(v))
      .pipe(z.number().int().min(0).max(100000))
      .nullable()
  )

const saveThrowsSchema = z.object({
  enduroId: z.string().min(1),
  teamId: z.string().min(1),
  throw1Cm: throwField,
  throw2Cm: throwField,
})

/** Enregistre les 2 lancers d'une équipe (organisateur propriétaire uniquement). */
export async function saveTeamThrows(
  _prev: PrecisionFormState,
  formData: FormData
): Promise<PrecisionFormState> {
  const user = await requireRole('ORGANIZER')

  const parsed = saveThrowsSchema.safeParse({
    enduroId: formData.get('enduroId'),
    teamId: formData.get('teamId'),
    throw1Cm: formData.get('throw1Cm') ?? '',
    throw2Cm: formData.get('throw2Cm') ?? '',
  })
  if (!parsed.success) {
    return { message: 'Distances invalides (nombres entiers en cm).' }
  }

  const { enduroId, teamId, throw1Cm, throw2Cm } = parsed.data
  const enduro = await requireOwnedEnduro(enduroId, user.id)

  // Verrou aligné sur l'UI (lancer/page.tsx) : plus de saisie une fois clôturé ou annulé.
  if (enduro.status === 'FINISHED' || enduro.status === 'CANCELLED') {
    return { message: 'Impossible de modifier les lancers : l’enduro est clôturé ou annulé.' }
  }

  // L'équipe doit appartenir à cet enduro.
  const team = await prisma.team.findFirst({
    where: { id: teamId, enduroId: enduro.id },
    select: { id: true },
  })
  if (!team) return { message: 'Équipe introuvable.' }

  await prisma.team.update({
    where: { id: team.id },
    data: { throw1Cm, throw2Cm },
  })

  revalidatePath(`/dashboard/enduros/${enduro.id}/lancer`)
  return { ok: true }
}
