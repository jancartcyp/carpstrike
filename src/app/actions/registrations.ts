'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import type { Prisma } from '@/generated/prisma/client'
import { requireRole } from '@/lib/auth/dal'
import { requireOwnedEnduro } from '@/lib/auth/owner'
import { prisma } from '@/lib/prisma'
import type { EnduroFormState } from '@/lib/validations/enduro'
import { type MemberInput, registrationSchema, rejectSchema } from '@/lib/validations/registration'

// ─────────────────────────────────────────────
// Public : envoi d'une demande d'inscription
// ─────────────────────────────────────────────

export async function submitRegistration(
  _prev: EnduroFormState,
  formData: FormData
): Promise<EnduroFormState> {
  const enduroId = String(formData.get('enduroId') ?? '')

  // Construit la liste des membres depuis les champs indexés m0_*, m1_*.
  const members: Record<string, FormDataEntryValue | null>[] = []
  for (const i of [0, 1]) {
    const firstName = formData.get(`m${i}_firstName`)
    const lastName = formData.get(`m${i}_lastName`)
    // On ignore le 2e pêcheur s'il est entièrement vide.
    if (i === 1 && !firstName && !lastName) continue
    members.push({
      firstName,
      lastName,
      email: formData.get(`m${i}_email`),
      phone: formData.get(`m${i}_phone`),
    })
  }

  const parsed = registrationSchema.safeParse({
    teamName: formData.get('teamName'),
    comment: formData.get('comment'),
    acceptRules: formData.get('acceptRules'),
    members,
  })

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors }
  }

  // L'enduro doit accepter les inscriptions en ligne.
  const enduro = await prisma.enduro.findFirst({
    where: { id: enduroId, status: 'PUBLISHED', mode: 'WITH_REGISTRATION' },
    select: { id: true },
  })
  if (!enduro) {
    return { message: 'Les inscriptions en ligne ne sont pas ouvertes pour cet enduro.' }
  }

  const membersJson: Prisma.InputJsonValue = parsed.data.members.map((m) => ({
    firstName: m.firstName,
    lastName: m.lastName,
    email: m.email ?? null,
    phone: m.phone ?? null,
  }))

  await prisma.registrationRequest.create({
    data: {
      enduroId: enduro.id,
      teamName: parsed.data.teamName,
      status: 'PENDING',
      members: membersJson,
    },
  })

  revalidatePath(`/dashboard/enduros/${enduro.id}/demandes`)
  return { ok: true }
}

// ─────────────────────────────────────────────
// Organisateur : accepter / refuser
// ─────────────────────────────────────────────

function revalidateEnduroTeams(enduroId: string, slug: string) {
  revalidatePath(`/dashboard/enduros/${enduroId}/demandes`)
  revalidatePath(`/dashboard/enduros/${enduroId}/equipes`)
  revalidatePath(`/dashboard/enduros/${enduroId}`)
  revalidatePath('/dashboard')
  revalidatePath('/enduros')
  revalidatePath(`/enduros/${slug}`)
}

export async function approveRegistration(formData: FormData) {
  const user = await requireRole('ORGANIZER')
  const requestId = String(formData.get('requestId') ?? '')

  const request = await prisma.registrationRequest.findUnique({ where: { id: requestId } })
  if (!request) redirect('/dashboard')

  const enduro = await requireOwnedEnduro(request.enduroId, user.id)

  if (request.status === 'PENDING') {
    const confirmed = await prisma.team.count({
      where: { enduroId: enduro.id, status: 'CONFIRMED' },
    })
    const full = confirmed >= enduro.maxTeams
    const members = Array.isArray(request.members) ? (request.members as unknown as MemberInput[]) : []

    await prisma.$transaction([
      prisma.team.create({
        data: {
          enduroId: enduro.id,
          name: request.teamName,
          status: full ? 'WAITLIST' : 'CONFIRMED',
          paymentStatus: 'NONE',
          members: {
            create: members.map((m, idx) => ({
              firstName: m.firstName,
              lastName: m.lastName,
              email: m.email ?? null,
              isCaptain: idx === 0,
            })),
          },
        },
      }),
      prisma.registrationRequest.update({
        where: { id: request.id },
        data: { status: 'APPROVED', decidedAt: new Date() },
      }),
    ])

    revalidateEnduroTeams(enduro.id, enduro.slug)
  }

  redirect(`/dashboard/enduros/${enduro.id}/demandes`)
}

export async function rejectRegistration(formData: FormData) {
  const user = await requireRole('ORGANIZER')
  const requestId = String(formData.get('requestId') ?? '')

  const parsed = rejectSchema.safeParse({ reason: formData.get('reason') })
  const request = await prisma.registrationRequest.findUnique({ where: { id: requestId } })
  if (!request) redirect('/dashboard')

  const enduro = await requireOwnedEnduro(request.enduroId, user.id)

  if (request.status === 'PENDING' && parsed.success) {
    await prisma.registrationRequest.update({
      where: { id: request.id },
      data: { status: 'REJECTED', rejectionReason: parsed.data.reason, decidedAt: new Date() },
    })
    revalidateEnduroTeams(enduro.id, enduro.slug)
  }

  redirect(`/dashboard/enduros/${enduro.id}/demandes`)
}
