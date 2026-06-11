import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireRole } from '@/lib/auth/dal'
import { type EnduroRequest, getEnduroRequests, getOrganizerEnduro } from '@/lib/organizer'
import styles from '../../../dashboard.module.css'
import { RequestActions } from './request-actions'

const dateFmt = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
})

const REQ_STATUS: Record<string, { label: string; pill: string; card: string }> = {
  PENDING: { label: 'En attente', pill: 'pillPending', card: 'pending' },
  APPROVED: { label: 'Validée', pill: 'pillApproved', card: 'approved' },
  REJECTED: { label: 'Refusée', pill: 'pillRejected', card: 'rejected' },
}

function membersLabel(req: EnduroRequest) {
  const members = Array.isArray(req.members)
    ? (req.members as Array<{ firstName?: string; lastName?: string }>)
    : []
  if (members.length === 0) return '—'
  return members.map((m) => `${m.firstName ?? ''} ${m.lastName ?? ''}`.trim()).join(' & ')
}

const FILTERS = [
  { key: 'all', label: 'Toutes' },
  { key: 'PENDING', label: 'En attente' },
  { key: 'APPROVED', label: 'Validées' },
  { key: 'REJECTED', label: 'Refusées' },
]

export default async function DemandesPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ status?: string }>
}) {
  const { id } = await params
  const { status: filter = 'all' } = await searchParams
  const user = await requireRole('ORGANIZER')
  const enduro = await getOrganizerEnduro(id, user.id)
  if (!enduro) notFound()

  if (enduro.mode !== 'WITH_REGISTRATION') {
    return (
      <div className={styles.infoBox}>
        Cet enduro est en <strong>gestion seule</strong> : il n’y a pas d’inscriptions en ligne.
        Ajoutez les équipes manuellement depuis l’onglet « Équipes ».
      </div>
    )
  }

  const requests = await getEnduroRequests(enduro.id)
  const counts = {
    PENDING: requests.filter((r) => r.status === 'PENDING').length,
    APPROVED: requests.filter((r) => r.status === 'APPROVED').length,
    REJECTED: requests.filter((r) => r.status === 'REJECTED').length,
  }
  const shown = filter === 'all' ? requests : requests.filter((r) => r.status === filter)

  return (
    <>
      <div className={styles.statGrid}>
        <div className={`${styles.statCard} ${styles.statGold}`}>
          <div className={styles.statVal}>{counts.PENDING}</div>
          <div className={styles.statLbl}>En attente</div>
        </div>
        <div className={`${styles.statCard} ${styles.statGreen}`}>
          <div className={styles.statVal}>{counts.APPROVED}</div>
          <div className={styles.statLbl}>Validées</div>
        </div>
        <div className={`${styles.statCard} ${styles.statRed}`}>
          <div className={styles.statVal}>{counts.REJECTED}</div>
          <div className={styles.statLbl}>Refusées</div>
        </div>
        <div className={`${styles.statCard} ${styles.statBlue}`}>
          <div className={styles.statVal}>
            {enduro._count.teams}
            <span className="unit">/{enduro.maxTeams}</span>
          </div>
          <div className={styles.statLbl}>Équipes</div>
        </div>
      </div>

      <div className={styles.filters}>
        {FILTERS.map((f) => {
          const active = filter === f.key
          const href =
            f.key === 'all'
              ? `/dashboard/enduros/${enduro.id}/demandes`
              : `/dashboard/enduros/${enduro.id}/demandes?status=${f.key}`
          return (
            <Link
              key={f.key}
              href={href}
              className={`${styles.filterChip} ${active ? styles.filterChipActive : ''}`}
            >
              {f.label}
            </Link>
          )
        })}
      </div>

      {shown.length === 0 ? (
        <div className={styles.empty}>Aucune demande dans cette catégorie.</div>
      ) : (
        <div className={styles.reqList}>
          {shown.map((req) => {
            const st = REQ_STATUS[req.status] ?? REQ_STATUS.PENDING
            return (
              <div key={req.id} className={`${styles.reqCard} ${st.card}`}>
                <div>
                  <div className={styles.reqTeam}>{req.teamName}</div>
                  <div className={styles.reqMembers}>{membersLabel(req)}</div>
                </div>
                <div className={styles.reqMeta}>
                  <div className={styles.label}>Reçue le</div>
                  <div>{dateFmt.format(req.requestedAt)}</div>
                  {req.status === 'REJECTED' && req.rejectionReason && (
                    <div style={{ marginTop: 4, color: 'var(--red)' }}>Motif : {req.rejectionReason}</div>
                  )}
                </div>

                {req.status === 'PENDING' ? (
                  <RequestActions requestId={req.id} teamName={req.teamName} />
                ) : (
                  <span className={`${styles.miniPill} ${styles[st.pill]}`}>{st.label}</span>
                )}
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}
