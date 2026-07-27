// État "temporel" d'un enduro, calculé d'après ses dates (indépendant du statut manuel
// DRAFT/PUBLISHED/LIVE/FINISHED, qui pilote la logique métier). Sert aux libellés affichés.

export type TemporalState = 'upcoming' | 'live' | 'finished'

export function temporalState(startAt: Date, endAt: Date, now: Date = new Date()): TemporalState {
  if (now.getTime() < startAt.getTime()) return 'upcoming'
  if (now.getTime() > endAt.getTime()) return 'finished'
  return 'live'
}

export const TEMPORAL_LABEL: Record<TemporalState, string> = {
  upcoming: 'À venir',
  live: 'En cours',
  finished: 'Terminé',
}
