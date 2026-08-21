import { AVATARS_BUCKET, CATCHES_BUCKET, createAdminClient } from '@/lib/supabase/admin'

/**
 * Extrait le chemin interne d'un fichier depuis son URL publique Supabase.
 * Renvoie `null` si l'URL ne correspond pas au bucket attendu (sécurité : on ne supprime
 * jamais un fichier à partir d'une URL arbitraire).
 */
export function storagePathFromPublicUrl(url: string | null | undefined, bucket: string): string | null {
  if (!url) return null
  const prefix = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucket}/`
  if (!url.startsWith(prefix)) return null
  const path = url.slice(prefix.length).split('?')[0]
  return path.length > 0 ? path : null
}

/**
 * Supprime des fichiers du Storage. Best-effort : une erreur ici ne doit jamais faire échouer
 * l'opération métier qui l'a déclenchée (la ligne en base est déjà supprimée / mise à jour).
 */
export async function removeStorageFiles(bucket: string, paths: (string | null)[]): Promise<void> {
  const valid = paths.filter((p): p is string => !!p)
  if (valid.length === 0) return
  try {
    await createAdminClient().storage.from(bucket).remove(valid)
  } catch {
    // Ignoré volontairement : le nettoyage du Storage est secondaire.
  }
}

/** Supprime les photos de prises correspondant aux URLs publiques données. */
export async function removeCatchPhotos(photoUrls: (string | null)[]): Promise<void> {
  await removeStorageFiles(
    CATCHES_BUCKET,
    photoUrls.map((u) => storagePathFromPublicUrl(u, CATCHES_BUCKET))
  )
}

/** Supprime une photo de profil à partir de son URL publique. */
export async function removeAvatar(avatarUrl: string | null): Promise<void> {
  await removeStorageFiles(AVATARS_BUCKET, [storagePathFromPublicUrl(avatarUrl, AVATARS_BUCKET)])
}
