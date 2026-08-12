import { temporalState } from '@/lib/enduro-status'
import styles from './dashboard.module.css'

const STATUS_META: Record<string, { label: string; cls: string; dot?: boolean }> = {
  DRAFT: { label: 'Brouillon', cls: styles.statusDraft },
  PUBLISHED: { label: 'Publié', cls: styles.statusPublished, dot: true },
  LIVE: { label: 'En direct', cls: styles.statusLive, dot: true },
  FINISHED: { label: 'Terminé', cls: styles.statusFinished },
  CANCELLED: { label: 'Annulé', cls: styles.statusCancelled },
}

/**
 * Pastille de statut. Si les dates sont fournies et que le statut manuel est `LIVE`,
 * le libellé est corrigé d'après les dates réelles (un LIVE non clôturé ne doit pas
 * s'afficher « En direct » une fois la date de fin passée).
 */
export function StatusPill({
  status,
  startAt,
  endAt,
}: {
  status: string
  startAt?: Date
  endAt?: Date
}) {
  let meta = STATUS_META[status] ?? STATUS_META.DRAFT

  if (status === 'LIVE' && startAt && endAt) {
    const state = temporalState(startAt, endAt)
    if (state === 'upcoming') meta = { label: 'À venir', cls: styles.statusPublished, dot: true }
    else if (state === 'finished') meta = { label: 'À clôturer', cls: styles.statusFinished }
  }

  return (
    <span className={`${styles.statusPill} ${meta.cls}`}>
      {meta.dot && <span className={styles.pillDot} />}
      {meta.label}
    </span>
  )
}

export function statusLabel(status: string) {
  return (STATUS_META[status] ?? STATUS_META.DRAFT).label
}
