import type { EmailOtpType } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Callback de confirmation d'email Supabase (flux SSR token_hash).
 * Le lien de l'email pointe ici ; on vérifie l'OTP (pose la session via cookies)
 * puis on redirige vers la page de succès. Lien invalide/expiré → page de connexion.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null

  if (tokenHash && type) {
    const supabase = await createClient()
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash })
    if (!error) {
      redirect('/auth/confirme')
    }
  }

  redirect('/connexion?erreur=lien')
}
