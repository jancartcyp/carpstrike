import { createHash } from 'node:crypto'

/**
 * Vérifie si un mot de passe figure dans une fuite de données connue, via l'API publique
 * « Pwned Passwords » de HaveIBeenPwned — l'équivalent gratuit de la protection Supabase Pro.
 *
 * Confidentialité (k-anonymity) : on n'envoie JAMAIS le mot de passe ni son hash complet.
 * On calcule le SHA-1, et on ne transmet que les 5 premiers caractères du hash. L'API renvoie
 * tous les suffixes correspondants ; on cherche le nôtre localement.
 *
 * Robustesse : en cas d'erreur réseau / timeout, on renvoie `false` (fail-open) — une panne
 * de HIBP ne doit jamais empêcher les inscriptions.
 */
export async function isPasswordPwned(password: string): Promise<boolean> {
  try {
    const hash = createHash('sha1').update(password).digest('hex').toUpperCase()
    const prefix = hash.slice(0, 5)
    const suffix = hash.slice(5)

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 2500)

    const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      // Renforce l'anonymat (réponses de taille homogène) et évite tout cache.
      headers: { 'Add-Padding': 'true' },
      cache: 'no-store',
      signal: controller.signal,
    }).finally(() => clearTimeout(timeout))

    if (!res.ok) return false

    const body = await res.text()
    for (const line of body.split('\n')) {
      const [lineSuffix, countStr] = line.trim().split(':')
      // Les entrées de « padding » ont un compte de 0 — on les ignore.
      if (lineSuffix === suffix && Number(countStr) > 0) return true
    }
    return false
  } catch {
    return false
  }
}
