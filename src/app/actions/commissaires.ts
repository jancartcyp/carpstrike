'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireRole } from '@/lib/auth/dal'
import { requireOwnedEnduro } from '@/lib/auth/owner'
import { generateReadablePassword, hashPassword } from '@/lib/commissaire/password'
import { prisma } from '@/lib/prisma'
import { slugify } from '@/lib/slug'
import { createCommissaireSchema } from '@/lib/validations/catch'

export type CommissaireCreateState =
  | {
      errors?: Record<string, string[]>
      message?: string
      ok?: boolean
      /** Identifiants en clair, affichés une seule fois après génération. */
      created?: { displayName: string; username: string; password: string }
    }
  | undefined

async function uniqueUsername(base: string, enduroSlug: string): Promise<string> {
  const root = `${slugify(base) || 'commissaire'}.${enduroSlug}`
  let candidate = root
  let n = 1
  while (await prisma.commissaire.findUnique({ where: { username: candidate }, select: { id: true } })) {
    n += 1
    candidate = `${root}-${n}`
  }
  return candidate
}

export async function createCommissaire(
  _prev: CommissaireCreateState,
  formData: FormData
): Promise<CommissaireCreateState> {
  const user = await requireRole('ORGANIZER')
  const enduro = await requireOwnedEnduro(String(formData.get('enduroId') ?? ''), user.id)

  const parsed = createCommissaireSchema.safeParse({
    firstName: formData.get('firstName'),
    lastName: formData.get('lastName'),
  })
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors }
  }

  const { firstName, lastName } = parsed.data
  const displayName = `${firstName} ${lastName}`
  const username = await uniqueUsername(`${firstName.charAt(0)}${lastName}`, enduro.slug)
  const password = generateReadablePassword()

  await prisma.commissaire.create({
    data: {
      enduroId: enduro.id,
      displayName,
      username,
      passwordHash: hashPassword(password),
      active: true,
    },
  })

  revalidatePath(`/dashboard/enduros/${enduro.id}/commissaires`)
  return { ok: true, created: { displayName, username, password } }
}

/** Charge le commissaire + vérifie la propriété de l'enduro par l'organisateur courant. */
async function ownedCommissaire(commissaireId: string, organizerId: string) {
  const commissaire = await prisma.commissaire.findUnique({ where: { id: commissaireId } })
  if (!commissaire) redirect('/dashboard')
  await requireOwnedEnduro(commissaire.enduroId, organizerId)
  return commissaire
}

export async function regenerateCommissairePassword(
  _prev: CommissaireCreateState,
  formData: FormData
): Promise<CommissaireCreateState> {
  const user = await requireRole('ORGANIZER')
  const commissaire = await ownedCommissaire(String(formData.get('commissaireId') ?? ''), user.id)

  const password = generateReadablePassword()
  await prisma.commissaire.update({
    where: { id: commissaire.id },
    data: { passwordHash: hashPassword(password) },
  })

  revalidatePath(`/dashboard/enduros/${commissaire.enduroId}/commissaires`)
  return {
    ok: true,
    created: { displayName: commissaire.displayName, username: commissaire.username, password },
  }
}

export async function toggleCommissaire(formData: FormData) {
  const user = await requireRole('ORGANIZER')
  const commissaire = await ownedCommissaire(String(formData.get('commissaireId') ?? ''), user.id)
  await prisma.commissaire.update({
    where: { id: commissaire.id },
    data: { active: !commissaire.active },
  })
  revalidatePath(`/dashboard/enduros/${commissaire.enduroId}/commissaires`)
  redirect(`/dashboard/enduros/${commissaire.enduroId}/commissaires`)
}

export async function deleteCommissaire(formData: FormData) {
  const user = await requireRole('ORGANIZER')
  const commissaire = await ownedCommissaire(String(formData.get('commissaireId') ?? ''), user.id)
  // Refus si des prises sont déjà rattachées (intégrité de l'historique).
  const catches = await prisma.catch.count({ where: { commissaireId: commissaire.id } })
  if (catches === 0) {
    await prisma.commissaire.delete({ where: { id: commissaire.id } })
    revalidatePath(`/dashboard/enduros/${commissaire.enduroId}/commissaires`)
  }
  redirect(`/dashboard/enduros/${commissaire.enduroId}/commissaires`)
}
