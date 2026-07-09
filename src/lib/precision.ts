// Lancer de précision (SPEC 4.6)
// Chaque équipe fait 2 lancers (distance à la cible, en cm). Classement par moyenne
// croissante (le plus près de la cible gagne). Égalité départagée par le plus petit
// lancer individuel. Le classement fixe l'ordre de choix des postes.

export type ThrowInput = {
  id: string
  name: string
  sectorName?: string | null
  throw1Cm: number | null
  throw2Cm: number | null
}

export type PrecisionRow<T extends ThrowInput = ThrowInput> = T & {
  rank: number
  averageCm: number
  bestCm: number
}

/**
 * Renvoie les équipes ayant leurs 2 lancers renseignés, classées (rang 1 = meilleur).
 * Les équipes sans les 2 lancers sont exclues du classement.
 */
export function computePrecisionRanking<T extends ThrowInput>(teams: T[]): PrecisionRow<T>[] {
  const scored = teams
    .filter((t) => t.throw1Cm != null && t.throw2Cm != null)
    .map((t) => {
      const a = t.throw1Cm as number
      const b = t.throw2Cm as number
      return { ...t, averageCm: (a + b) / 2, bestCm: Math.min(a, b) }
    })

  scored.sort((x, y) => {
    if (x.averageCm !== y.averageCm) return x.averageCm - y.averageCm
    if (x.bestCm !== y.bestCm) return x.bestCm - y.bestCm
    return x.name.localeCompare(y.name, 'fr')
  })

  return scored.map((t, i) => ({ ...t, rank: i + 1 }))
}
