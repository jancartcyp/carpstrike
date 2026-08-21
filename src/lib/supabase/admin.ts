import { createClient } from '@supabase/supabase-js'

/**
 * Client Supabase **service role** — accès complet, contourne la RLS.
 * STRICTEMENT côté serveur (jamais exposer la clé). Utilisé pour l'upload
 * des photos de prises (le commissaire n'est pas un utilisateur Supabase).
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )
}

export const CATCHES_BUCKET = 'catches'
export const AVATARS_BUCKET = 'avatars'
