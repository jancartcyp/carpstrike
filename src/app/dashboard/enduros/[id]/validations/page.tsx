import Link from 'next/link'
import { notFound } from 'next/navigation'
import { cancelCatch, contestCatch, restoreCatch } from '@/app/actions/catches'
import { requireRole } from '@/lib/auth/dal'
import { getEnduroCatches, getOrganizerEnduro } from '@/lib/organizer'
import styles from '../../../dashboard.module.css'

const SPECIES: Record<string, string> = {
  COMMUNE: 'Commune',
  MIROIR: 'Miroir',
  CUIR: 'Cuir',
  KOI: 'Koï',
  AMOUR_BLANC: 'Amour blanc',
}

const CATCH_STATUS: Record<string, { label: string; pill: string }> = {
  VALID: { label: 'Validée', pill: 'pillConfirmed' },
  CONTESTED: { label: 'Contestée', pill: 'pillPending' },
  CANCELLED: { label: 'Annulée', pill: 'pillRejected' },
}

const timeFmt = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

const FILTERS = [
  { key: 'all', label: 'Toutes' },
  { key: 'VALID', label: 'Validées' },
  { key: 'CONTESTED', label: 'Contestées' },
  { key: 'CANCELLED', label: 'Annulées' },
]

export default async function ValidationsPage({
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

  const catches = await getEnduroCatches(enduro.id)
  const valid = catches.filter((c) => c.status === 'VALID')
  const totalKg = valid.reduce((s, c) => s + c.weightKg, 0)
  const shown = filter === 'all' ? catches : catches.filter((c) => c.status === filter)

  return (
    <>
      <div className={styles.statGrid}>
        <div className={`${styles.statCard} ${styles.statGreen}`}>
          <div className={styles.statVal}>{valid.length}</div>
          <div className={styles.statLbl}>Prises validées</div>
        </div>
        <div className={`${styles.statCard} ${styles.statBlue}`}>
          <div className={styles.statVal}>
            {totalKg.toFixed(1)}
            <span className="unit"> kg</span>
          </div>
          <div className={styles.statLbl}>Poids total</div>
        </div>
        <div className={`${styles.statCard} ${styles.statRed}`}>
          <div className={styles.statVal}>
            {catches.filter((c) => c.status === 'CONTESTED').length}
          </div>
          <div className={styles.statLbl}>Contestées</div>
        </div>
        <div className={`${styles.statCard} ${styles.statGold}`}>
          <div className={styles.statVal}>
            {valid.length > 0 ? Math.max(...valid.map((c) => c.weightKg)).toFixed(1) : '—'}
            <span className="unit"> kg</span>
          </div>
          <div className={styles.statLbl}>Plus grosse prise</div>
        </div>
      </div>

      <div className={styles.filters}>
        {FILTERS.map((f) => {
          const active = filter === f.key
          const href =
            f.key === 'all'
              ? `/dashboard/enduros/${enduro.id}/validations`
              : `/dashboard/enduros/${enduro.id}/validations?status=${f.key}`
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
        <div className={styles.empty}>Aucune prise dans cette catégorie.</div>
      ) : (
        <div className={styles.reqList}>
          {shown.map((c) => {
            const st = CATCH_STATUS[c.status] ?? CATCH_STATUS.VALID
            const sector = c.team.sector?.name ? `Secteur ${c.team.sector.name}` : 'Sans secteur'
            const peg = c.team.pegNumber ? ` · Poste ${c.team.pegNumber}` : ''
            return (
              <div key={c.id} className={styles.teamRow}>
                <div>
                  <div className={styles.teamName}>{c.team.name}</div>
                  <div className={styles.teamMembers}>
                    {SPECIES[c.species] ?? c.species} · {sector}
                    {peg} · {timeFmt.format(c.caughtAt)} · {c.commissaire.displayName}
                  </div>
                </div>

                <div style={{ fontFamily: 'var(--font-barlow-condensed)', fontWeight: 900, fontStyle: 'italic', fontSize: '1.3rem' }}>
                  {c.weightKg.toFixed(1)}
                  <span style={{ fontSize: '0.7rem', color: 'var(--dim)' }}> kg</span>
                </div>

                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
                  {c.photoUrl && (
                    <a
                      href={c.photoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-ghost"
                      style={{ fontSize: '0.7rem' }}
                    >
                      📷 Photo
                    </a>
                  )}
                  <span className={`${styles.miniPill} ${styles[st.pill]}`}>{st.label}</span>
                </span>

                <span style={{ display: 'inline-flex', gap: 6 }}>
                  {c.status === 'VALID' && (
                    <form action={contestCatch}>
                      <input type="hidden" name="catchId" value={c.id} />
                      <button type="submit" className="btn btn-ghost" style={{ fontSize: '0.7rem' }}>
                        Contester
                      </button>
                    </form>
                  )}
                  {c.status !== 'CANCELLED' && (
                    <form action={cancelCatch}>
                      <input type="hidden" name="catchId" value={c.id} />
                      <button type="submit" className={styles.btnDanger} style={{ padding: '6px 12px' }}>
                        Annuler
                      </button>
                    </form>
                  )}
                  {c.status !== 'VALID' && (
                    <form action={restoreCatch}>
                      <input type="hidden" name="catchId" value={c.id} />
                      <button type="submit" className={styles.btnSuccess} style={{ padding: '6px 12px' }}>
                        Rétablir
                      </button>
                    </form>
                  )}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}
