import styles from './dashboard.module.css'

const STATUS_META: Record<string, { label: string; cls: string; dot?: boolean }> = {
  DRAFT: { label: 'Brouillon', cls: styles.statusDraft },
  PUBLISHED: { label: 'Publié', cls: styles.statusPublished, dot: true },
  LIVE: { label: 'En direct', cls: styles.statusLive, dot: true },
  FINISHED: { label: 'Terminé', cls: styles.statusFinished },
  CANCELLED: { label: 'Annulé', cls: styles.statusCancelled },
}

export function StatusPill({ status }: { status: string }) {
  const meta = STATUS_META[status] ?? STATUS_META.DRAFT
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
