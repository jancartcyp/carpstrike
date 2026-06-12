import { headers } from 'next/headers'

// Limiteur en mémoire (fenêtre glissante). Suffisant pour un lancement de test :
// note — l'état est par instance serveur (réinitialisé au redéploiement / par lambda).
// Pour une montée en charge, remplacer par un store partagé (Upstash/Redis).
const buckets = new Map<string, number[]>()

/** Renvoie true si l'action est autorisée pour `key`, false si la limite est atteinte. */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  const hits = (buckets.get(key) ?? []).filter((t) => now - t < windowMs)
  if (hits.length >= limit) {
    buckets.set(key, hits)
    return false
  }
  hits.push(now)
  buckets.set(key, hits)
  // Garde-fou mémoire : purge occasionnelle des clés vides.
  if (buckets.size > 5000) {
    for (const [k, v] of buckets) if (v.every((t) => now - t >= windowMs)) buckets.delete(k)
  }
  return true
}

/** Adresse IP du client (best-effort, derrière proxy Vercel). */
export async function clientIp(): Promise<string> {
  const h = await headers()
  const fwd = h.get('x-forwarded-for')
  return fwd?.split(',')[0]?.trim() || h.get('x-real-ip') || 'unknown'
}
