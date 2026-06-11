import { prisma } from '@/lib/prisma'

/** Transforme un texte libre en slug URL (sans accents, minuscules, tirets). */
export function slugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // retire les diacritiques (combining marks)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-') // tout ce qui n'est pas alphanum → tiret
    .replace(/^-+|-+$/g, '') // retire les tirets en début/fin
    .slice(0, 60)
}

/**
 * Génère un slug unique pour un enduro à partir d'un nom.
 * Ajoute un suffixe -2, -3… en cas de collision.
 */
export async function uniqueEnduroSlug(name: string): Promise<string> {
  const base = slugify(name) || 'enduro'
  let candidate = base
  let n = 1

  // Boucle bornée : on s'arrête dès qu'aucun enduro n'utilise le slug.
  while (await prisma.enduro.findUnique({ where: { slug: candidate }, select: { id: true } })) {
    n += 1
    candidate = `${base}-${n}`
  }

  return candidate
}
