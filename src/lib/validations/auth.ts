import { z } from 'zod'

export const signupSchema = z
  .object({
    firstName: z.string().min(2, { error: 'Prénom trop court' }).trim(),
    lastName: z.string().min(2, { error: 'Nom trop court' }).trim(),
    email: z.email({ error: 'Adresse email invalide' }).trim(),
    password: z.string().min(8, { error: 'Au moins 8 caractères' }),
    // Double saisie : évite qu'une faute de frappe rende le compte inaccessible.
    confirmPassword: z.string().min(1, { error: 'Confirme ton mot de passe' }),
  })
  .refine((d) => d.password === d.confirmPassword, {
    error: 'Les deux mots de passe ne sont pas identiques',
    path: ['confirmPassword'],
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
      /** true = succès (affiché en confirmation, pas en erreur). */
      ok?: boolean
      /** Adresse à laquelle l'email de confirmation a été envoyé (rappel anti-faute de frappe). */
      email?: string
    }
  | undefined
