import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'

/** Hash un mot de passe commissaire (scrypt, format `salt:hash` en hex). */
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(password, salt, 64).toString('hex')
  return `${salt}:${hash}`
}

/** Vérifie un mot de passe contre un hash stocké. */
export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(':')
  if (!salt || !hash) return false
  const expected = Buffer.from(hash, 'hex')
  const actual = scryptSync(password, salt, 64)
  return expected.length === actual.length && timingSafeEqual(expected, actual)
}

const PW_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'

/** Génère un mot de passe lisible : 3 segments de 4 caractères (XXXX-XXXX-XXXX). */
export function generateReadablePassword(): string {
  const seg = () =>
    Array.from(randomBytes(4))
      .map((b) => PW_CHARS[b % PW_CHARS.length])
      .join('')
  return `${seg()}-${seg()}-${seg()}`
}
