// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { computePrecisionRanking, type ThrowInput } from './precision'

const t = (id: string, name: string, a: number | null, b: number | null): ThrowInput => ({
  id,
  name,
  throw1Cm: a,
  throw2Cm: b,
})

describe('computePrecisionRanking', () => {
  it('classe par moyenne croissante (plus près de la cible = meilleur)', () => {
    const r = computePrecisionRanking([
      t('a', 'Alpha', 40, 60), // moy 50
      t('b', 'Bravo', 10, 30), // moy 20
      t('c', 'Charlie', 100, 100), // moy 100
    ])
    expect(r.map((x) => x.id)).toEqual(['b', 'a', 'c'])
    expect(r[0].rank).toBe(1)
    expect(r[0].averageCm).toBe(20)
  })

  it('départage une égalité de moyenne par le plus petit lancer individuel', () => {
    const r = computePrecisionRanking([
      t('a', 'Alpha', 30, 50), // moy 40, best 30
      t('b', 'Bravo', 10, 70), // moy 40, best 10 → gagne
    ])
    expect(r.map((x) => x.id)).toEqual(['b', 'a'])
    expect(r[0].bestCm).toBe(10)
  })

  it('exclut les équipes dont les 2 lancers ne sont pas renseignés', () => {
    const r = computePrecisionRanking([
      t('a', 'Alpha', 40, 60),
      t('b', 'Bravo', 20, null),
      t('c', 'Charlie', null, null),
    ])
    expect(r).toHaveLength(1)
    expect(r[0].id).toBe('a')
  })

  it('renvoie un tableau vide si aucune équipe complète', () => {
    expect(computePrecisionRanking([t('a', 'Alpha', null, 10)])).toEqual([])
  })
})
