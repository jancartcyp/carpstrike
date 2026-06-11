import { z } from 'zod'

const optionalText = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v && v.length > 0 ? v : undefined))

/** Création d'un commissaire (organisateur). Le schéma `Commissaire` ne stocke qu'un displayName. */
export const createCommissaireSchema = z.object({
  firstName: z.string().trim().min(1, { error: 'Prénom requis' }).max(60),
  lastName: z.string().trim().min(1, { error: 'Nom requis' }).max(60),
})

/** Connexion commissaire. */
export const commissaireLoginSchema = z.object({
  username: z.string().trim().min(3, { error: 'Identifiant requis' }),
  password: z.string().min(1, { error: 'Mot de passe requis' }),
})

/** Saisie d'une prise (la photo est gérée à part comme File). */
export const catchSchema = z.object({
  teamId: z.string().min(1, { error: 'Sélectionnez une équipe' }),
  weightKg: z.coerce
    .number({ error: 'Poids invalide' })
    .gt(0, { error: 'Poids invalide' })
    .max(200, { error: 'Poids invalide' }),
  species: z.enum(['COMMUNE', 'MIROIR', 'CUIR', 'KOI', 'AMOUR_BLANC'], { error: 'Espèce invalide' }),
  note: optionalText,
})
