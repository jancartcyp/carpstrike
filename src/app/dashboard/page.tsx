import type { Metadata } from 'next'
import Link from 'next/link'
import { SpaceNotice } from '@/components/space-notice'
import { requireRole } from '@/lib/auth/dal'
import { getOrganizerEnduros } from '@/lib/organizer'
import styles from './dashboard.module.css'
import { StatusPill } from './status-pill'

export const metadata: Metadata = {
  title: 'Mes enduros — CarpStrike',
}

const dayMonth = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' })

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ espace?: string }>
}) {
  const user = await requireRole('ORGANIZER')
  const enduros = await getOrganizerEnduros(user.id)
  const { espace } = await searchParams

  return (
    <div className={styles.wrap}>
      {espace === 'organizer' && <SpaceNotice space="organizer" />}
      <div className={styles.pageHead}>
        <div>
          <div className={styles.pageEyebrow}>Espace organisateur</div>
          <h1 className={styles.pageTitle}>
            Mes <span className="accent">enduros</span>
          </h1>
        </div>
        <Link href="/dashboard/nouveau" className="btn btn-primary">
          + Créer un enduro
        </Link>
      </div>

      {enduros.length === 0 ? (
        <div className={styles.empty}>
          Vous n’avez pas encore d’enduro. Créez-en un — c’est gratuit pendant le lancement.
        </div>
      ) : (
        <div className={styles.enduroGrid}>
          {enduros.map((e) => (
            <Link key={e.id} href={`/dashboard/enduros/${e.id}`} className={styles.enduroCard}>
              <div className={styles.enduroCardTop}>
                <StatusPill status={e.status} />
                <span style={{ fontSize: '0.7rem', color: 'var(--dim)' }}>{e.durationHours}h</span>
              </div>
              <div className={styles.enduroCardName}>{e.name}</div>
              <div className={styles.enduroCardMeta}>
                <span>📍 {e.locationName}</span>
                <span>
                  📅 {dayMonth.format(e.startAt)} – {dayMonth.format(e.endAt)}
                </span>
              </div>
              <div className={styles.enduroCardStats}>
                <span className={styles.enduroCardStat}>
                  <strong>
                    {e.teamsCount}/{e.maxTeams}
                  </strong>
                  <span>Équipes</span>
                </span>
                <span className={styles.enduroCardStat}>
                  <strong>{e.sectorsCount}</strong>
                  <span>Secteurs</span>
                </span>
              </div>
            </Link>
          ))}

          <Link href="/dashboard/nouveau" className={styles.createCard}>
            <span className={styles.createCardPlus}>＋</span>
            <span className={styles.createCardText}>Créer un enduro</span>
          </Link>
        </div>
      )}
    </div>
  )
}
