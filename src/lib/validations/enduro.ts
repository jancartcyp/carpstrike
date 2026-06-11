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

export const reglesSchema = z.object({
  minWeightKg: z.coerce
    .number({ error: 'Poids invalide' })
    .min(0, { error: 'Poids invalide' })
    .max(100, { error: 'Maille trop élevée' }),
  requirePhoto: checkbox,
})

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
    ...reglesSchema.shape,
    ...inscriptionsSchema.shape,
    ...presentationSchema.shape,
    sectorsCount: z.coerce
      .number({ error: 'Nombre de secteurs invalide' })
      .int()
      .min(0, { error: 'Valeur invalide' })
      .max(12, { error: '12 secteurs max' }),
  })
  .refine(endAfterStart, endAfterStartError)

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
  lieu: ['locationName', 'address', 'postalCode'],
  equipes: ['maxTeams', 'maxFishersPerTeam'],
  regles: ['minWeightKg', 'requirePhoto'],
  inscriptions: ['registrationFee', 'prizePool'],
  presentation: ['theme', 'rulesText'],
}

/** Sections verrouillées (non éditables) quand l'enduro est LIVE ou FINISHED. */
export const LOCKED_SECTIONS: SectionKey[] = ['dates', 'equipes', 'inscriptions']

export function isStructurallyLocked(status: string): boolean {
  return status === 'LIVE' || status === 'FINISHED'
}
