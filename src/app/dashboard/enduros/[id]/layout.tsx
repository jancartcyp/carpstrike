import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireRole } from '@/lib/auth/dal'
import { getOrganizerEnduro } from '@/lib/organizer'
import styles from '../../dashboard.module.css'
import { StatusPill } from '../../status-pill'
import { SubNav } from './subnav'

const dateFmt = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })

export default async function EnduroLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const user = await requireRole('ORGANIZER')
  const enduro = await getOrganizerEnduro(id, user.id)

  if (!enduro) notFound()

  return (
    <div className={styles.wrap}>
      <div className={styles.breadcrumb}>
        <Link href="/dashboard">Mes enduros</Link>
        <span className={styles.sep}>/</span>
        <span className={styles.current}>{enduro.name}</span>
      </div>

      <div className={styles.enduroHeader}>
        <div className={styles.enduroHeaderTop}>
          <StatusPill status={enduro.status} startAt={enduro.startAt} endAt={enduro.endAt} />
          <span className={styles.lockedTag}>{enduro.durationHours}h</span>
        </div>
        <h1 className={styles.enduroHeaderName}>{enduro.name}</h1>
        <div className={styles.enduroInfoRow}>
          <span>📍 {enduro.locationName}</span>
          <span>
            📅 {dateFmt.format(enduro.startAt)} → {dateFmt.format(enduro.endAt)}
          </span>
          <span>👥 {enduro.maxTeams} équipes</span>
          <span>◫ {enduro.sectors.length} secteurs</span>
        </div>
      </div>

      <SubNav enduroId={enduro.id} mode={enduro.mode} />

      {children}
    </div>
  )
}
