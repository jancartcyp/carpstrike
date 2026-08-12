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

/**
 * Tampon après la fin de l'enduro pendant lequel les commissaires peuvent encore saisir
 * les dernières pesées (SPEC 4.3).
 */
export const CATCH_GRACE_MS = 2 * 60 * 60 * 1000 // 2 h

/**
 * La saisie de prises est-elle ouverte ? Fermée avant le départ, après le tampon de fin,
 * et dès que l'organisateur a clôturé ou annulé l'enduro.
 */
export function catchWindow(
  enduro: { startAt: Date; endAt: Date; status: string },
  now: Date = new Date()
): { open: boolean; reason?: string } {
  if (enduro.status === 'CANCELLED') {
    return { open: false, reason: 'Cet enduro a été annulé — aucune saisie possible.' }
  }
  if (enduro.status === 'FINISHED') {
    return { open: false, reason: 'Cet enduro est clôturé — la saisie des prises est fermée.' }
  }
  if (now.getTime() < enduro.startAt.getTime()) {
    return { open: false, reason: 'L’enduro n’a pas encore commencé — saisie impossible.' }
  }
  if (now.getTime() > enduro.endAt.getTime() + CATCH_GRACE_MS) {
    return { open: false, reason: 'L’enduro est terminé — la saisie des prises est fermée.' }
  }
  return { open: true }
}
