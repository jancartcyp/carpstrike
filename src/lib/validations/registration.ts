import { z } from 'zod'

const optionalText = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v && v.length > 0 ? v : undefined))

const optionalEmail = z
  .union([z.literal(''), z.email({ error: 'Email invalide' })])
  .optional()
  .transform((v) => (v && v.length > 0 ? v : undefined))

// ── Membre d'équipe ──
export const memberSchema = z.object({
  firstName: z.string().trim().min(1, { error: 'Prénom requis' }).max(60),
  lastName: z.string().trim().min(1, { error: 'Nom requis' }).max(60),
  email: optionalEmail,
  phone: optionalText,
})
export type MemberInput = z.infer<typeof memberSchema>

// ── Demande d'inscription publique ──
export const registrationSchema = z.object({
  teamName: z.string().trim().min(2, { error: 'Nom d’équipe trop court' }).max(80),
  comment: optionalText,
  // Checkbox HTML : vaut 'on' si cochée, absente sinon.
  acceptRules: z.literal('on', { error: 'Vous devez accepter le règlement' }),
  members: z
    .array(memberSchema)
    .min(1, { error: 'Au moins un pêcheur' })
    .max(2, { error: '2 pêcheurs maximum' }),
})
export type RegistrationInput = z.infer<typeof registrationSchema>

// ── Ajout manuel d'équipe (organisateur) ──
// Pas de numéro de poste à la création : les postes sont attribués ensuite (lancer de
// précision ou saisie manuelle groupée dans l'onglet Équipes), jamais pré-assignés.
export const addTeamSchema = z.object({
  name: z.string().trim().min(2, { error: 'Nom d’équipe trop court' }).max(80),
  captainFirstName: z.string().trim().min(1, { error: 'Prénom du capitaine requis' }).max(60),
  captainLastName: z.string().trim().min(1, { error: 'Nom du capitaine requis' }).max(60),
  // Facultatifs : servent uniquement à rattacher automatiquement un compte CarpStrike existant
  // (ou futur) du pêcheur — jamais requis pour créer l'équipe.
  captainEmail: optionalEmail,
  partnerFirstName: optionalText,
  partnerLastName: optionalText,
  partnerEmail: optionalEmail,
  sectorId: optionalText,
})
export type AddTeamInput = z.infer<typeof addTeamSchema>

// ── Refus d'une demande ──
export const rejectSchema = z.object({
  reason: z.string().trim().min(3, { error: 'Motif trop court' }).max(300),
})
