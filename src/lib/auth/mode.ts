import { cookies } from 'next/headers'
import { DEFAULT_SPACE, parseSpace, SPACE_COOKIE, type SpaceMode } from '@/lib/auth/space'

/**
 * Lecture/écriture de l'espace actif via cookie — module **serveur uniquement**
 * (importe next/headers). Le proxy doit importer `@/lib/auth/space` (helpers purs).
 */

/** Mode de la session courante (Server Components / actions). */
export async function getSpace(): Promise<SpaceMode> {
  const store = await cookies()
  return parseSpace(store.get(SPACE_COOKIE)?.value) ?? DEFAULT_SPACE
}

/** Écrit le mode dans un cookie (30 jours). */
export async function setSpace(mode: SpaceMode): Promise<void> {
  const store = await cookies()
  store.set(SPACE_COOKIE, mode, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  })
}

/** Efface le mode (déconnexion). */
export async function clearSpace(): Promise<void> {
  const store = await cookies()
  store.delete(SPACE_COOKIE)
}
