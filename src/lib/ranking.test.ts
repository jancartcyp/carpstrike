// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { buildGeneralRanking } from './ranking'

type T = { name: string; sectorName: string | null; total: number; biggest: number }

describe('buildGeneralRanking (rotation de secteurs, SPEC 4.2)', () => {
  it('place les 1ers de chaque secteur avant les 2es', () => {
    const teams: T[] = [
      // Secteur A
      { name: 'A1', sectorName: 'A', total: 40, biggest: 14 },
      { name: 'A2', sectorName: 'A', total: 10, biggest: 5 },
      // Secteur B
      { name: 'B1', sectorName: 'B', total: 38, biggest: 12 },
      { name: 'B2', sectorName: 'B', total: 30, biggest: 9 },
    ]
    const ranked = buildGeneralRanking(teams)
    const order = ranked.map((t) => t.name)

    // Tour 1 : A1 (40) puis B1 (38). Tour 2 : B2 (30) puis A2 (10).
    expect(order).toEqual(['A1', 'B1', 'B2', 'A2'])
    expect(ranked[0].rank).toBe(1)
    expect(ranked.find((t) => t.name === 'A1')?.sectorRank).toBe(1)
    expect(ranked.find((t) => t.name === 'A2')?.sectorRank).toBe(2)
  })

  it('départage les égalités de total par la plus grosse prise', () => {
    const teams: T[] = [
      { name: 'X', sectorName: 'A', total: 20, biggest: 8 },
      { name: 'Y', sectorName: 'B', total: 20, biggest: 12 },
    ]
    const ranked = buildGeneralRanking(teams)
    // Même total (1ers de leur secteur) → Y devant grâce à biggest plus élevé.
    expect(ranked.map((t) => t.name)).toEqual(['Y', 'X'])
  })

  it('gère les équipes sans secteur (groupe commun)', () => {
    const teams: T[] = [
      { name: 'S1', sectorName: null, total: 15, biggest: 7 },
      { name: 'S2', sectorName: null, total: 25, biggest: 9 },
    ]
    const ranked = buildGeneralRanking(teams)
    expect(ranked.map((t) => t.name)).toEqual(['S2', 'S1'])
    expect(ranked[0].rank).toBe(1)
    expect(ranked[1].rank).toBe(2)
  })

  it('renvoie un tableau vide pour aucune équipe', () => {
    expect(buildGeneralRanking([])).toEqual([])
  })
})
