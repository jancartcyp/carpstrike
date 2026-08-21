import { prisma } from '@/lib/prisma'

/**
 * Cherche un compte CarpStrike existant pour chaque email fourni (comparaison insensible
 * à la casse). Renvoie une map "email en minuscules" → userId, pour les emails trouvés.
 * Sert à rattacher automatiquement un `TeamMember` à son compte pêcheur.
 */
export async function findUserIdsByEmails(emails: (string | undefined)[]): Promise<Map<string, string>> {
  const clean = [...new Set(emails.filter((e): e is string => !!e))]
  if (clean.length === 0) return new Map()

  const users = await prisma.user.findMany({
    where: { OR: clean.map((e) => ({ email: { equals: e, mode: 'insensitive' } })) },
    select: { id: true, email: true },
  })
  return new Map(users.map((u) => [u.email.toLowerCase(), u.id]))
}
