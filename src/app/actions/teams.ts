'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireRole } from '@/lib/auth/dal'
import { requireOwnedEnduro } from '@/lib/auth/owner'
import { prisma } from '@/lib/prisma'
import type { EnduroFormState } from '@/lib/validations/enduro'
import { addTeamSchema } from '@/lib/validations/registration'

function revalidateTeams(enduroId: string, slug: string) {
  revalidatePath(`/dashboard/enduros/${enduroId}/equipes`)
  revalidatePath(`/dashboard/enduros/${enduroId}`)
  revalidatePath('/dashboard')
  revalidatePath('/enduros')
  revalidatePath(`/enduros/${slug}`)
}

/** Vérifie qu'un secteur (optionnel) appartient bien à l'enduro ; sinon null. */
async function resolveSectorId(sectorId: string | undefined, enduroId: string) {
  if (!sectorId) return null
  const sector = await prisma.sector.findFirst({
    where: { id: sectorId, enduroId },
    select: { id: true },
  })
  return sector?.id ?? null
}

export async function addTeam(
  _prev: EnduroFormState,
  formData: FormData
): Promise<EnduroFormState> {
  const user = await requireRole('ORGANIZER')
  const enduroId = String(formData.get('enduroId') ?? '')
  const enduro = await requireOwnedEnduro(enduroId, user.id)

  const parsed = addTeamSchema.safeParse({
    name: formData.get('name'),
    captainFirstName: formData.get('captainFirstName'),
    captainLastName: formData.get('captainLastName'),
    partnerFirstName: formData.get('partnerFirstName'),
    partnerLastName: formData.get('partnerLastName'),
    sectorId: formData.get('sectorId'),
    pegNumber: formData.get('pegNumber'),
  })
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors }
  }

  const d = parsed.data
  const sectorId = await resolveSectorId(d.sectorId, enduro.id)

  const members = [
    { firstName: d.captainFirstName, lastName: d.captainLastName, isCaptain: true },
  ]
  if (d.partnerFirstName && d.partnerLastName) {
    members.push({
      firstName: d.partnerFirstName,
      lastName: d.partnerLastName,
      isCaptain: false,
    })
  }

  await prisma.team.create({
    data: {
      enduroId: enduro.id,
      name: d.name,
      status: 'CONFIRMED',
      paymentStatus: 'NONE',
      sectorId,
      pegNumber: d.pegNumber ?? null,
      members: { create: members },
    },
  })

  revalidateTeams(enduro.id, enduro.slug)
  return { ok: true, message: 'Équipe ajoutée.' }
}

export async function deleteTeam(formData: FormData) {
  const user = await requireRole('ORGANIZER')
  const enduroId = String(formData.get('enduroId') ?? '')
  const teamId = String(formData.get('teamId') ?? '')
  const enduro = await requireOwnedEnduro(enduroId, user.id)

  if (enduro.status !== 'LIVE') {
    await prisma.team.deleteMany({ where: { id: teamId, enduroId: enduro.id } })
    revalidateTeams(enduro.id, enduro.slug)
  }
  redirect(`/dashboard/enduros/${enduro.id}/equipes`)
}

export async function assignTeamSector(formData: FormData) {
  const user = await requireRole('ORGANIZER')
  const enduroId = String(formData.get('enduroId') ?? '')
  const teamId = String(formData.get('teamId') ?? '')
  const enduro = await requireOwnedEnduro(enduroId, user.id)

  const sectorId = await resolveSectorId(String(formData.get('sectorId') ?? '') || undefined, enduro.id)
  const pegRaw = String(formData.get('pegNumber') ?? '').trim()
  const pegNumber = pegRaw && Number.isFinite(Number(pegRaw)) ? Number(pegRaw) : null

  await prisma.team.updateMany({
    where: { id: teamId, enduroId: enduro.id },
    data: { sectorId, pegNumber },
  })

  revalidateTeams(enduro.id, enduro.slug)
  redirect(`/dashboard/enduros/${enduro.id}/equipes`)
}
