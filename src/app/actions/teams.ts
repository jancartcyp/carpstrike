'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireRole } from '@/lib/auth/dal'
import { requireOwnedEnduro } from '@/lib/auth/owner'
import { prisma } from '@/lib/prisma'
import { removeCatchPhotos } from '@/lib/storage-cleanup'
import { findUserIdsByEmails } from '@/lib/team-linking'
import { isStructurallyLocked, type EnduroFormState } from '@/lib/validations/enduro'
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

  if (isStructurallyLocked(enduro.status)) {
    return { message: 'Impossible d’ajouter une équipe : l’enduro est en direct ou clôturé.' }
  }

  const parsed = addTeamSchema.safeParse({
    name: formData.get('name'),
    captainFirstName: formData.get('captainFirstName'),
    captainLastName: formData.get('captainLastName'),
    captainEmail: formData.get('captainEmail'),
    partnerFirstName: formData.get('partnerFirstName'),
    partnerLastName: formData.get('partnerLastName'),
    partnerEmail: formData.get('partnerEmail'),
    sectorId: formData.get('sectorId'),
  })
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors }
  }

  const d = parsed.data
  const sectorId = await resolveSectorId(d.sectorId, enduro.id)

  // Emails facultatifs : s'ils correspondent à un compte CarpStrike existant, le membre y est
  // rattaché automatiquement (même mécanisme que pour les inscriptions en ligne).
  const userIdByEmail = await findUserIdsByEmails([d.captainEmail, d.partnerEmail])

  const members = [
    {
      firstName: d.captainFirstName,
      lastName: d.captainLastName,
      email: d.captainEmail ?? null,
      isCaptain: true,
      userId: d.captainEmail ? (userIdByEmail.get(d.captainEmail.toLowerCase()) ?? null) : null,
    },
  ]
  if (d.partnerFirstName && d.partnerLastName) {
    members.push({
      firstName: d.partnerFirstName,
      lastName: d.partnerLastName,
      email: d.partnerEmail ?? null,
      isCaptain: false,
      userId: d.partnerEmail ? (userIdByEmail.get(d.partnerEmail.toLowerCase()) ?? null) : null,
    })
  }

  // Pas de numéro de poste à la création : attribué ensuite (lancer de précision ou saisie groupée).
  await prisma.team.create({
    data: {
      enduroId: enduro.id,
      name: d.name,
      status: 'CONFIRMED',
      paymentStatus: 'NONE',
      sectorId,
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

  if (!isStructurallyLocked(enduro.status)) {
    // Photos récupérées avant la cascade, pour ne pas laisser de fichiers orphelins.
    const photos = await prisma.catch.findMany({
      where: {
        teamId,
        enduroId: enduro.id,
        OR: [{ photoUrl: { not: null } }, { photoThumbUrl: { not: null } }],
      },
      select: { photoUrl: true, photoThumbUrl: true },
    })
    await prisma.team.deleteMany({ where: { id: teamId, enduroId: enduro.id } })
    await removeCatchPhotos(photos.flatMap((p) => [p.photoUrl, p.photoThumbUrl]))
    revalidateTeams(enduro.id, enduro.slug)
  }
  redirect(`/dashboard/enduros/${enduro.id}/equipes`)
}

/**
 * Enregistre en une seule fois le secteur + numéro de poste de toutes les équipes d'un enduro.
 * Champs attendus par équipe : `sector_<teamId>` et `peg_<teamId>`.
 */
export async function assignTeamPegs(
  _prev: EnduroFormState,
  formData: FormData
): Promise<EnduroFormState> {
  const user = await requireRole('ORGANIZER')
  const enduroId = String(formData.get('enduroId') ?? '')
  const enduro = await requireOwnedEnduro(enduroId, user.id)

  if (isStructurallyLocked(enduro.status)) {
    return { message: 'Impossible de modifier les postes : l’enduro est en direct ou clôturé.' }
  }

  const [teams, sectors] = await Promise.all([
    prisma.team.findMany({ where: { enduroId: enduro.id }, select: { id: true } }),
    prisma.sector.findMany({ where: { enduroId: enduro.id }, select: { id: true } }),
  ])
  const validSectorIds = new Set(sectors.map((s) => s.id))

  await prisma.$transaction(
    teams.map((t) => {
      const sectorRaw = String(formData.get(`sector_${t.id}`) ?? '')
      const sectorId = validSectorIds.has(sectorRaw) ? sectorRaw : null
      const pegRaw = String(formData.get(`peg_${t.id}`) ?? '').trim()
      const pegNumber =
        pegRaw !== '' && Number.isFinite(Number(pegRaw)) && Number(pegRaw) > 0
          ? Math.trunc(Number(pegRaw))
          : null
      return prisma.team.update({ where: { id: t.id }, data: { sectorId, pegNumber } })
    })
  )

  revalidateTeams(enduro.id, enduro.slug)
  return { ok: true, message: 'Postes enregistrés.' }
}
