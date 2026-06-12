'use server'

import { revalidatePath } from 'next/cache'
import { requireRole } from '@/lib/auth/dal'
import { requireOwnedEnduro } from '@/lib/auth/owner'
import { prisma } from '@/lib/prisma'
import { communicationSchema } from '@/lib/validations/communication'

export type CommunicationFormState =
  | { errors?: Record<string, string[]>; message?: string; ok?: boolean }
  | undefined

export async function sendCommunication(
  _prev: CommunicationFormState,
  formData: FormData
): Promise<CommunicationFormState> {
  const user = await requireRole('ORGANIZER')
  const enduro = await requireOwnedEnduro(String(formData.get('enduroId') ?? ''), user.id)

  const parsed = communicationSchema.safeParse({
    subject: formData.get('subject'),
    body: formData.get('body'),
    priority: formData.get('priority'),
    recipients: formData.get('recipients'),
    channels: formData.getAll('channels'),
  })
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors }
  }

  const d = parsed.data
  // NB : envoi email/SMS réel différé (Resend non configuré). On persiste + diffusion in-app.
  await prisma.communication.create({
    data: {
      enduroId: enduro.id,
      subject: d.subject,
      body: d.body,
      priority: d.priority,
      recipients: d.recipients,
      channels: d.channels,
      sentById: user.id,
      sentAt: new Date(),
    },
  })

  revalidatePath(`/dashboard/enduros/${enduro.id}/communication`)
  revalidatePath(`/enduros/${enduro.slug}`)
  return { ok: true }
}
