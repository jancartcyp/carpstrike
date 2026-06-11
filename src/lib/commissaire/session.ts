import { createHmac, timingSafeEqual } from 'node:crypto'
import { cookies } from 'next/headers'

const COOKIE = 'cs_comm'
// Clé de signature : la service role key reste strictement serveur (jamais exposée).
const SECRET = process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'carpstrike-dev-secret'

function sign(value: string): string {
  return createHmac('sha256', SECRET).update(value).digest('hex')
}

/** Pose le cookie de session commissaire (httpOnly, signé). */
export async function setCommissaireSession(commissaireId: string): Promise<void> {
  const store = await cookies()
  store.set(COOKIE, `${commissaireId}.${sign(commissaireId)}`, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7,
  })
}

export async function clearCommissaireSession(): Promise<void> {
  const store = await cookies()
  store.delete(COOKIE)
}

/** Renvoie l'id du commissaire si le cookie est présent et la signature valide. */
export async function getCommissaireIdFromCookie(): Promise<string | null> {
  const store = await cookies()
  const raw = store.get(COOKIE)?.value
  if (!raw) return null
  const idx = raw.lastIndexOf('.')
  if (idx <= 0) return null
  const id = raw.slice(0, idx)
  const sig = raw.slice(idx + 1)
  const expected = sign(id)
  const a = Buffer.from(sig)
  const b = Buffer.from(expected)
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null
  return id
}
