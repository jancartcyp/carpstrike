import { z } from 'zod'

/** État renvoyé par les server actions d'enduro (formulaires). */
export type EnduroFormState =
  | {
      errors?: Record<string, string[]>
      message?: string
      ok?: boolean
    }
  | undefined

const optionalText = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v && v.length > 0 ? v : undefined))

// Montants saisis en euros (number), convertis en centimes par l'action.
const euros = z.coerce
  .number({ error: 'Montant invalide' })
  .min(0, { error: 'Le montant ne peut pas être négatif' })
  .max(1_000_000, { error: 'Montant trop élevé' })

// ── Schémas par section (réutilisés en création et en édition) ──

// Édition (Paramètres) : nom + description seulement (le mode est figé à la création).
export const infosUpdateSchema = z.object({
  name: z.string().trim().min(3, { error: 'Nom trop court (3 caractères min)' }).max(120),
  description: optionalText,
})

// Création : ajoute le choix du mode.
export const infosSchema = infosUpdateSchema.extend({
  mode: z.enum(['MANAGED_ONLY', 'WITH_REGISTRATION'], { error: 'Mode invalide' }),
})

const datesObjectSchema = z.object({
  startAt: z.coerce.date({ error: 'Date de début invalide' }),
  endAt: z.coerce.date({ error: 'Date de fin invalide' }),
  durationHours: z.coerce
    .number({ error: 'Durée invalide' })
    .int({ error: 'Durée en heures entières' })
    .min(1, { error: 'Au moins 1 heure' })
    .max(240, { error: 'Durée trop longue (240h max)' }),
})

const endAfterStart = (d: { startAt: Date; endAt: Date }) => d.endAt > d.startAt
const endAfterStartError = {
  error: 'La date de fin doit être après la date de début',
  path: ['endAt'] as PropertyKey[],
}

export const datesSchema = datesObjectSchema.refine(endAfterStart, endAfterStartError)

export const lieuSchema = z.object({
  locationName: z.string().trim().min(2, { error: 'Nom du lieu trop court' }).max(120),
  address: optionalText,
  postalCode: optionalText,
})

export const equipesSchema = z.object({
  maxTeams: z.coerce
    .number({ error: 'Nombre invalide' })
    .int()
    .min(1, { error: 'Au moins 1 équipe' })
    .max(1000, { error: 'Trop d’équipes' }),
  maxFishersPerTeam: z.coerce
    .number({ error: 'Nombre invalide' })
    .int()
    .min(1, { error: 'Au moins 1 pêcheur' })
    .max(10, { error: '10 pêcheurs max par équipe' }),
})

// Case à cocher HTML : 'on' si cochée, absente sinon.
const checkbox = z.preprocess(
  (v) => v === 'on' || v === 'true' || v === true || v === '1',
  z.boolean()
)

/** Méthodes d'attribution des postes proposées à l'organisateur. */
export const PEG_ASSIGNMENTS = [
  {
    value: 'PRECISION_THROW',
    label: 'Lancer de précision',
    hint: '2 lancers par équipe, la moyenne la plus faible choisit en premier.',
  },
  {
    value: 'SINGLE_DRAW',
    label: 'Tirage au sort simple',
    hint: 'Chaque équipe tire un poste, attribué directement.',
  },
  {
    value: 'DOUBLE_DRAW',
    label: 'Tirage au sort double',
    hint: 'Chaque équipe tire deux postes et choisit celui qu’elle préfère.',
  },
  {
    value: 'OTHER',
    label: 'Autre méthode',
    hint: 'À préciser ci-dessous (elle sera affichée aux participants).',
  },
] as const

export type PegAssignmentValue = (typeof PEG_ASSIGNMENTS)[number]['value']

/** Objet de base (sans refine) : nécessaire pour le spread dans createEnduroSchema. */
export const reglesObjectSchema = z.object({
  minWeightKg: z.coerce
    .number({ error: 'Poids invalide' })
    .min(0, { error: 'Poids invalide' })
    .max(100, { error: 'Maille trop élevée' }),
  requirePhoto: checkbox,
  pegAssignment: z.enum(['PRECISION_THROW', 'SINGLE_DRAW', 'DOUBLE_DRAW', 'OTHER'], {
    error: 'Méthode d’attribution invalide',
  }),
  pegAssignmentNote: optionalText,
})

/** Si « Autre méthode » est choisie, la précision devient obligatoire. */
const pegNoteRequired = (d: { pegAssignment: string; pegAssignmentNote?: string }) =>
  d.pegAssignment !== 'OTHER' || !!d.pegAssignmentNote
const pegNoteError = {
  error: 'Précisez la méthode d’attribution des postes',
  path: ['pegAssignmentNote'] as PropertyKey[],
}

export const reglesSchema = reglesObjectSchema.refine(pegNoteRequired, pegNoteError)

export const inscriptionsSchema = z.object({
  registrationFee: euros,
  prizePool: z
    .union([z.literal(''), euros])
    .optional()
    .transform((v) => (v === '' || v === undefined ? undefined : v)),
})

export const presentationSchema = z.object({
  theme: optionalText,
  rulesText: optionalText,
})

// ── Création : agrège les sections + nombre de secteurs ──

export const createEnduroSchema = z
  .object({
    ...infosSchema.shape,
    ...datesObjectSchema.shape,
    ...lieuSchema.shape,
    ...equipesSchema.shape,
    ...reglesObjectSchema.shape,
    ...inscriptionsSchema.shape,
    ...presentationSchema.shape,
    sectorsCount: z.coerce
      .number({ error: 'Nombre de secteurs invalide' })
      .int()
      .min(0, { error: 'Valeur invalide' })
      .max(12, { error: '12 secteurs max' }),
  })
  .refine(endAfterStart, endAfterStartError)
  .refine(pegNoteRequired, pegNoteError)

export type CreateEnduroInput = z.infer<typeof createEnduroSchema>

/** Sections éditables individuellement depuis la page Paramètres. */
export const SECTION_SCHEMAS = {
  infos: infosUpdateSchema,
  dates: datesSchema,
  lieu: lieuSchema,
  equipes: equipesSchema,
  regles: reglesSchema,
  inscriptions: inscriptionsSchema,
  presentation: presentationSchema,
} as const

export type SectionKey = keyof typeof SECTION_SCHEMAS

/** Champs attendus dans le FormData pour chaque section (le schéma `dates` est raffiné → pas de `.shape`). */
export const SECTION_FIELDS: Record<SectionKey, string[]> = {
  infos: ['name', 'description'],
  dates: ['startAt', 'endAt', 'durationHours'],
  // `pegMapUrl` est lu directement depuis le FormData (image déjà envoyée au Storage),
  // il n'est donc pas dans `lieuSchema` mais doit être listé pour être transmis.
  lieu: ['locationName', 'address', 'postalCode'],
  equipes: ['maxTeams', 'maxFishersPerTeam'],
  regles: ['minWeightKg', 'requirePhoto', 'pegAssignment', 'pegAssignmentNote'],
  inscriptions: ['registrationFee', 'prizePool'],
  presentation: ['theme', 'rulesText'],
}

/** Sections verrouillées (non éditables) quand l'enduro est LIVE ou FINISHED. */
export const LOCKED_SECTIONS: SectionKey[] = ['dates', 'equipes', 'inscriptions']

export function isStructurallyLocked(status: string): boolean {
  return status === 'LIVE' || status === 'FINISHED'
}
