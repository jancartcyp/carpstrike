import { createHmac, timingSafeEqual } from 'node:crypto'
import { cookies } from 'next/headers'

const COOKIE = 'cs_comm'
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000 // 7 jours

/**
 * Clé de signature du cookie commissaire.
 * Priorité à un secret dédié ; repli sur la service role key.
 * En production, l'absence des deux est une **erreur fatale** (jamais de secret en dur).
 */
function getSecret(): string {
  const secret = process.env.COMMISSAIRE_SESSION_SECRET ?? process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'Secret de session commissaire manquant (COMMISSAIRE_SESSION_SECRET ou SUPABASE_SERVICE_ROLE_KEY).'
      )
    }
    return 'carpstrike-dev-only-secret'
  }
  return secret
}

function sign(value: string): string {
  return createHmac('sha256', getSecret()).update(value).digest('hex')
}

function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a)
  const bb = Buffer.from(b)
  return ba.length === bb.length && timingSafeEqual(ba, bb)
}

/** Pose le cookie de session commissaire (httpOnly, signé, horodaté). */
export async function setCommissaireSession(commissaireId: string): Promise<void> {
  const store = await cookies()
  const payload = `${commissaireId}.${Date.now()}`
  store.set(COOKIE, `${payload}.${sign(payload)}`, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    maxAge: MAX_AGE_MS / 1000,
  })
}

export async function clearCommissaireSession(): Promise<void> {
  const store = await cookies()
  store.delete(COOKIE)
}

/**
 * Renvoie l'id du commissaire si le cookie est présent, la signature valide
 * ET la session non expirée (horodatage signé). Sinon null.
 */
export async function getCommissaireIdFromCookie(): Promise<string | null> {
  const store = await cookies()
  const raw = store.get(COOKIE)?.value
  if (!raw) return null

  // Format : `<id>.<issuedAtMs>.<hmac>` (l'id cuid et le timestamp ne contiennent pas de point).
  const parts = raw.split('.')
  if (parts.length !== 3) return null
  const [id, ts, sig] = parts

  if (!safeEqual(sig, sign(`${id}.${ts}`))) return null

  const issuedAt = Number(ts)
  if (!Number.isFinite(issuedAt) || Date.now() - issuedAt > MAX_AGE_MS) return null

  return id
}
