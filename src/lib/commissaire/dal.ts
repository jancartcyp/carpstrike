import { cache } from 'react'
import { prisma } from '@/lib/prisma'
import { getCommissaireIdFromCookie } from './session'

/**
 * Commissaire courant (depuis le cookie signé) + son enduro.
 * Renvoie null si non connecté, désactivé, ou enduro clos/annulé.
 */
export const getCommissaire = cache(async () => {
  const id = await getCommissaireIdFromCookie()
  if (!id) return null

  return prisma.commissaire.findFirst({
    where: {
      id,
      active: true,
      enduro: { status: { in: ['LIVE', 'PUBLISHED'] } },
    },
    include: {
      enduro: {
        select: {
          id: true,
          name: true,
          slug: true,
          status: true,
          minWeightKg: true,
          requirePhoto: true,
          durationHours: true,
        },
      },
    },
  })
})

/** Contexte complet pour l'app commissaire : équipes confirmées + dernières prises du commissaire. */
export async function getCommissaireContext() {
  const commissaire = await getCommissaire()
  if (!commissaire) return null

  const [teams, recentCatches, validCount] = await Promise.all([
    prisma.team.findMany({
      where: { enduroId: commissaire.enduroId, status: 'CONFIRMED' },
      orderBy: [{ sector: { name: 'asc' } }, { pegNumber: 'asc' }],
      select: {
        id: true,
        name: true,
        pegNumber: true,
        sector: { select: { name: true } },
        _count: { select: { catches: true } },
      },
    }),
    prisma.catch.findMany({
      where: { commissaireId: commissaire.id },
      orderBy: { caughtAt: 'desc' },
      take: 20,
      include: { team: { select: { name: true } } },
    }),
    prisma.catch.count({ where: { commissaireId: commissaire.id, status: 'VALID' } }),
  ])

  return { commissaire, teams, recentCatches, validCount }
}

export type CommissaireContext = NonNullable<Awaited<ReturnType<typeof getCommissaireContext>>>
