'use server'

import { Resend } from 'resend'
import { z } from 'zod'
import { clientIp, rateLimit } from '@/lib/rate-limit'

const CONTACT_TO = 'carp.strike.contact@gmail.com'
const FROM = 'CarpStrike <no-reply@carp-strike.com>'

const contactSchema = z.object({
  firstName: z.string().trim().min(1, { error: 'Prénom requis' }).max(80),
  lastName: z.string().trim().min(1, { error: 'Nom requis' }).max(80),
  email: z.email({ error: 'Adresse email invalide' }).trim(),
  profile: z.string().trim().max(80).optional(),
  subject: z.string().trim().max(120).optional(),
  message: z.string().trim().min(5, { error: 'Message trop court' }).max(5000),
})

export type ContactState =
  | { ok?: boolean; message?: string; errors?: Record<string, string[]> }
  | undefined

export async function sendContactMessage(
  _prev: ContactState,
  formData: FormData
): Promise<ContactState> {
  const parsed = contactSchema.safeParse({
    firstName: formData.get('firstName'),
    lastName: formData.get('lastName'),
    email: formData.get('email'),
    profile: formData.get('profile'),
    subject: formData.get('subject'),
    message: formData.get('message'),
  })
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors }
  }

  // Anti-spam : 3 messages / 10 min / IP.
  const ip = await clientIp()
  if (!rateLimit(`contact:${ip}`, 3, 10 * 60_000)) {
    return { message: 'Trop de messages envoyés. Patiente quelques minutes avant de réessayer.' }
  }

  if (!process.env.RESEND_API_KEY) {
    return {
      message:
        "L'envoi d'email n'est pas encore activé côté serveur. Écris-nous directement à carp.strike.contact@gmail.com.",
    }
  }

  const d = parsed.data
  // Neutralise tout retour à la ligne dans les champs repris en en-tête (sujet).
  const oneLine = (s: string) => s.replace(/[\r\n]+/g, ' ').slice(0, 120)
  const resend = new Resend(process.env.RESEND_API_KEY)
  const { error } = await resend.emails.send({
    from: FROM,
    to: CONTACT_TO,
    replyTo: d.email,
    subject: oneLine(`[Contact CarpStrike] ${d.subject ?? 'Message'} — ${d.firstName} ${d.lastName}`),
    text: [
      `De : ${d.firstName} ${d.lastName} <${d.email}>`,
      `Profil : ${d.profile ?? '—'}`,
      `Sujet : ${d.subject ?? '—'}`,
      '',
      d.message,
    ].join('\n'),
  })

  if (error) {
    return {
      message:
        "L'envoi a échoué. Réessaie, ou écris-nous directement à carp.strike.contact@gmail.com.",
    }
  }

  return { ok: true }
}
