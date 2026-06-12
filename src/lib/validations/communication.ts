import { z } from 'zod'

export const communicationSchema = z.object({
  subject: z.string().trim().min(3, { error: 'Objet trop court' }).max(140),
  body: z.string().trim().min(3, { error: 'Message trop court' }).max(4000),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH'], { error: 'Priorité invalide' }),
  recipients: z.enum(['ALL', 'CONFIRMED', 'WAITLIST', 'PENDING'], { error: 'Destinataires invalides' }),
  channels: z
    .array(z.enum(['EMAIL', 'NOTIF', 'SMS']))
    .min(1, { error: 'Choisissez au moins un canal' }),
})

export type CommunicationInput = z.infer<typeof communicationSchema>

export const RECIPIENT_LABELS: Record<string, string> = {
  ALL: 'Toutes les équipes',
  CONFIRMED: 'Équipes confirmées',
  WAITLIST: 'Liste d’attente',
  PENDING: 'En attente',
}

export const PRIORITY_LABELS: Record<string, string> = {
  LOW: 'Info',
  NORMAL: 'Important',
  HIGH: 'Urgent',
}
