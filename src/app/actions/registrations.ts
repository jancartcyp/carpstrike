'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import type { Prisma } from '@/generated/prisma/client'
import { requireRole } from '@/lib/auth/dal'
import { requireOwnedEnduro } from '@/lib/auth/owner'
import { prisma } from '@/lib/prisma'
import { clientIp, rateLimit } from '@/lib/rate-limit'
import { findUserIdsByEmails } from '@/lib/team-linking'
import type { EnduroFormState } from '@/lib/validations/enduro'
import { type MemberInput, registrationSchema, rejectSchema } from '@/lib/validations/registration'

// ─────────────────────────────────────────────
// Public : envoi d'une demande d'inscription
// ─────────────────────────────────────────────

export async function submitRegistration(
  _prev: EnduroFormState,
  formData: FormData
): Promise<EnduroFormState> {
  // Anti-spam : limite par IP (action publique, sans authentification).
  if (!rateLimit(`reg:${await clientIp()}`, 5, 10 * 60 * 1000)) {
    return { message: 'Trop de demandes envoyées. Réessayez dans quelques minutes.' }
  }

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

  // L'enduro doit accepter les inscriptions en ligne ET ne pas avoir commencé.
  const enduro = await prisma.enduro.findFirst({
    where: {
      id: enduroId,
      status: 'PUBLISHED',
      mode: 'WITH_REGISTRATION',
      startAt: { gt: new Date() },
    },
    select: { id: true },
  })
  if (!enduro) {
    return { message: 'Les inscriptions en ligne ne sont pas ouvertes pour cet enduro.' }
  }

  // Anti-doublon : une seule demande en attente par nom d'équipe et par enduro.
  const duplicate = await prisma.registrationRequest.findFirst({
    where: {
      enduroId: enduro.id,
      status: 'PENDING',
      teamName: { equals: parsed.data.teamName, mode: 'insensitive' },
    },
    select: { id: true },
  })
  if (duplicate) {
    return { message: 'Une demande avec ce nom d’équipe est déjà en attente pour cet enduro.' }
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

    // Rapproche chaque membre d'un compte CarpStrike existant, par email (insensible à la casse).
    const userIdByEmail = await findUserIdsByEmails(members.map((m) => m.email))

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
              userId: m.email ? (userIdByEmail.get(m.email.toLowerCase()) ?? null) : null,
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
