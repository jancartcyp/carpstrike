'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireRole } from '@/lib/auth/dal'
import { prisma } from '@/lib/prisma'
import { uniqueEnduroSlug } from '@/lib/slug'
import {
  type EnduroFormState,
  type SectionKey,
  SECTION_FIELDS,
  SECTION_SCHEMAS,
  createEnduroSchema,
  isStructurallyLocked,
  LOCKED_SECTIONS,
} from '@/lib/validations/enduro'

const SECTOR_COLORS = [
  '#e8212b',
  '#f0a500',
  '#00c850',
  '#4a9eff',
  '#b87de8',
  '#cd7f32',
  '#ff2d3a',
  '#c0c0c0',
  '#00b8a9',
  '#ff8c1a',
  '#9b6bff',
  '#4ade80',
]

const eurosToCents = (euros: number) => Math.round(euros * 100)

/** Revalide les pages impactées par une modification d'enduro. */
function revalidateEnduro(slug?: string) {
  revalidatePath('/dashboard')
  revalidatePath('/enduros')
  if (slug) revalidatePath(`/enduros/${slug}`)
}

/** Charge un enduro en vérifiant la propriété ; redirige si introuvable/non autorisé. */
async function requireOwnedEnduro(enduroId: string, organizerId: string) {
  const enduro = await prisma.enduro.findFirst({ where: { id: enduroId, organizerId } })
  if (!enduro) redirect('/dashboard')
  return enduro
}

// ─────────────────────────────────────────────
// Création
// ─────────────────────────────────────────────

export async function createEnduro(
  _prev: EnduroFormState,
  formData: FormData
): Promise<EnduroFormState> {
  const user = await requireRole('ORGANIZER')

  const parsed = createEnduroSchema.safeParse({
    name: formData.get('name'),
    description: formData.get('description'),
    mode: formData.get('mode'),
    startAt: formData.get('startAt'),
    endAt: formData.get('endAt'),
    durationHours: formData.get('durationHours'),
    locationName: formData.get('locationName'),
    address: formData.get('address'),
    postalCode: formData.get('postalCode'),
    maxTeams: formData.get('maxTeams'),
    maxFishersPerTeam: formData.get('maxFishersPerTeam'),
    minWeightKg: formData.get('minWeightKg'),
    registrationFee: formData.get('registrationFee'),
    prizePool: formData.get('prizePool'),
    theme: formData.get('theme'),
    rulesText: formData.get('rulesText'),
    sectorsCount: formData.get('sectorsCount'),
  })

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors }
  }

  const d = parsed.data
  const slug = await uniqueEnduroSlug(d.name)

  const enduro = await prisma.enduro.create({
    data: {
      organizerId: user.id,
      name: d.name,
      slug,
      description: d.description ?? null,
      status: 'DRAFT',
      mode: d.mode,
      startAt: d.startAt,
      endAt: d.endAt,
      durationHours: d.durationHours,
      locationName: d.locationName,
      address: d.address ?? null,
      postalCode: d.postalCode ?? null,
      maxTeams: d.maxTeams,
      maxFishersPerTeam: d.maxFishersPerTeam,
      registrationFee: eurosToCents(d.registrationFee),
      prizePool: d.prizePool !== undefined ? eurosToCents(d.prizePool) : null,
      minWeightKg: d.minWeightKg,
      theme: d.theme ?? null,
      rulesText: d.rulesText ?? null,
      sectors: {
        create: Array.from({ length: d.sectorsCount }, (_, i) => ({
          name: String.fromCharCode(65 + i),
          color: SECTOR_COLORS[i % SECTOR_COLORS.length],
        })),
      },
    },
  })

  revalidateEnduro(slug)
  redirect(`/dashboard/enduros/${enduro.id}`)
}

// ─────────────────────────────────────────────
// Édition par section (page Paramètres)
// ─────────────────────────────────────────────

export async function updateEnduroSection(
  _prev: EnduroFormState,
  formData: FormData
): Promise<EnduroFormState> {
  const user = await requireRole('ORGANIZER')

  const enduroId = String(formData.get('enduroId') ?? '')
  const section = String(formData.get('section') ?? '') as SectionKey

  const schema = SECTION_SCHEMAS[section]
  if (!schema) return { message: 'Section inconnue.' }

  const enduro = await requireOwnedEnduro(enduroId, user.id)

  if (LOCKED_SECTIONS.includes(section) && isStructurallyLocked(enduro.status)) {
    return { message: 'Cette section est verrouillée tant que l’enduro est en cours.' }
  }

  const raw: Record<string, FormDataEntryValue | null> = {}
  for (const key of SECTION_FIELDS[section]) {
    raw[key] = formData.get(key)
  }

  const parsed = schema.safeParse(raw)
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors }
  }

  const data = parsed.data as Record<string, unknown>
  const update: Record<string, unknown> = {}

  switch (section) {
    case 'infos':
      update.name = data.name
      update.description = data.description ?? null
      break
    case 'dates':
      update.startAt = data.startAt
      update.endAt = data.endAt
      update.durationHours = data.durationHours
      break
    case 'lieu':
      update.locationName = data.locationName
      update.address = data.address ?? null
      update.postalCode = data.postalCode ?? null
      break
    case 'equipes':
      update.maxTeams = data.maxTeams
      update.maxFishersPerTeam = data.maxFishersPerTeam
      break
    case 'regles':
      update.minWeightKg = data.minWeightKg
      break
    case 'inscriptions':
      update.registrationFee = eurosToCents(data.registrationFee as number)
      update.prizePool =
        data.prizePool !== undefined ? eurosToCents(data.prizePool as number) : null
      break
    case 'presentation':
      update.theme = data.theme ?? null
      update.rulesText = data.rulesText ?? null
      break
  }

  await prisma.enduro.update({ where: { id: enduro.id }, data: update })
  revalidateEnduro(enduro.slug)
  return { ok: true, message: 'Modifications enregistrées.' }
}

// ─────────────────────────────────────────────
// Cycle de vie (lancement gratuit : aucun paiement)
// ─────────────────────────────────────────────

export async function publishEnduro(formData: FormData) {
  const user = await requireRole('ORGANIZER')
  const enduro = await requireOwnedEnduro(String(formData.get('enduroId') ?? ''), user.id)
  if (enduro.status === 'DRAFT') {
    await prisma.enduro.update({ where: { id: enduro.id }, data: { status: 'PUBLISHED' } })
    revalidateEnduro(enduro.slug)
  }
  redirect(`/dashboard/enduros/${enduro.id}`)
}

export async function setEnduroLive(formData: FormData) {
  const user = await requireRole('ORGANIZER')
  const enduro = await requireOwnedEnduro(String(formData.get('enduroId') ?? ''), user.id)
  if (enduro.status === 'PUBLISHED') {
    await prisma.enduro.update({ where: { id: enduro.id }, data: { status: 'LIVE' } })
    revalidateEnduro(enduro.slug)
  }
  redirect(`/dashboard/enduros/${enduro.id}`)
}

export async function closeEnduro(formData: FormData) {
  const user = await requireRole('ORGANIZER')
  const enduro = await requireOwnedEnduro(String(formData.get('enduroId') ?? ''), user.id)
  if (enduro.status === 'LIVE' || enduro.status === 'PUBLISHED') {
    await prisma.enduro.update({ where: { id: enduro.id }, data: { status: 'FINISHED' } })
    revalidateEnduro(enduro.slug)
  }
  redirect(`/dashboard/enduros/${enduro.id}`)
}

export async function cancelEnduro(formData: FormData) {
  const user = await requireRole('ORGANIZER')
  const enduro = await requireOwnedEnduro(String(formData.get('enduroId') ?? ''), user.id)
  if (enduro.status !== 'CANCELLED' && enduro.status !== 'FINISHED') {
    await prisma.enduro.update({ where: { id: enduro.id }, data: { status: 'CANCELLED' } })
    revalidateEnduro(enduro.slug)
  }
  redirect(`/dashboard/enduros/${enduro.id}`)
}

export async function deleteEnduro(formData: FormData) {
  const user = await requireRole('ORGANIZER')
  const enduro = await requireOwnedEnduro(String(formData.get('enduroId') ?? ''), user.id)
  const confirmName = String(formData.get('confirmName') ?? '').trim()

  if (confirmName !== enduro.name) {
    redirect(`/dashboard/enduros/${enduro.id}/parametres?delete=mismatch`)
  }

  await prisma.enduro.delete({ where: { id: enduro.id } })
  revalidateEnduro(enduro.slug)
  redirect('/dashboard')
}

// ─────────────────────────────────────────────
// Secteurs
// ─────────────────────────────────────────────

export async function addSector(formData: FormData) {
  const user = await requireRole('ORGANIZER')
  const enduro = await requireOwnedEnduro(String(formData.get('enduroId') ?? ''), user.id)
  if (isStructurallyLocked(enduro.status)) redirect(`/dashboard/enduros/${enduro.id}/secteurs`)

  const name = String(formData.get('name') ?? '').trim()
  const count = await prisma.sector.count({ where: { enduroId: enduro.id } })
  if (name) {
    await prisma.sector.create({
      data: {
        enduroId: enduro.id,
        name: name.slice(0, 20),
        color: SECTOR_COLORS[count % SECTOR_COLORS.length],
      },
    })
    revalidateEnduro(enduro.slug)
  }
  redirect(`/dashboard/enduros/${enduro.id}/secteurs`)
}

export async function renameSector(formData: FormData) {
  const user = await requireRole('ORGANIZER')
  const enduro = await requireOwnedEnduro(String(formData.get('enduroId') ?? ''), user.id)
  const sectorId = String(formData.get('sectorId') ?? '')
  const name = String(formData.get('name') ?? '').trim()

  if (name) {
    // Le `enduroId` dans le where garantit que le secteur appartient bien à cet enduro.
    await prisma.sector.updateMany({
      where: { id: sectorId, enduroId: enduro.id },
      data: { name: name.slice(0, 20) },
    })
    revalidateEnduro(enduro.slug)
  }
  redirect(`/dashboard/enduros/${enduro.id}/secteurs`)
}

export async function deleteSector(formData: FormData) {
  const user = await requireRole('ORGANIZER')
  const enduro = await requireOwnedEnduro(String(formData.get('enduroId') ?? ''), user.id)
  const sectorId = String(formData.get('sectorId') ?? '')

  if (!isStructurallyLocked(enduro.status)) {
    const teamCount = await prisma.team.count({
      where: { sectorId, enduroId: enduro.id },
    })
    if (teamCount === 0) {
      await prisma.sector.deleteMany({ where: { id: sectorId, enduroId: enduro.id } })
      revalidateEnduro(enduro.slug)
    }
  }
  redirect(`/dashboard/enduros/${enduro.id}/secteurs`)
}
