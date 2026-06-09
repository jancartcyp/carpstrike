import { z } from 'zod'

export const signupSchema = z.object({
  firstName: z.string().min(2, { error: 'Prénom trop court' }).trim(),
  lastName: z.string().min(2, { error: 'Nom trop court' }).trim(),
  email: z.email({ error: 'Adresse email invalide' }).trim(),
  password: z.string().min(8, { error: 'Au moins 8 caractères' }),
  role: z.enum(['ORGANIZER', 'FISHERMAN'], { error: 'Rôle invalide' }),
})

export const loginSchema = z.object({
  email: z.email({ error: 'Adresse email invalide' }).trim(),
  password: z.string().min(1, { error: 'Mot de passe requis' }),
})

export type SignupInput = z.infer<typeof signupSchema>
export type LoginInput = z.infer<typeof loginSchema>

export type AuthFormState =
  | {
      errors?: Record<string, string[]>
      message?: string
    }
  | undefined
