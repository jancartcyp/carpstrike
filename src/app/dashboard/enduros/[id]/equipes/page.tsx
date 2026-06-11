import { notFound } from 'next/navigation'
import { assignTeamSector, deleteTeam } from '@/app/actions/teams'
import { requireRole } from '@/lib/auth/dal'
import { type EnduroTeam, getEnduroTeams, getOrganizerEnduro } from '@/lib/organizer'
import styles from '../../../dashboard.module.css'
import { AddTeamForm } from './add-team-form'

const TEAM_STATUS: Record<string, { label: string; cls: string }> = {
  CONFIRMED: { label: 'Confirmée', cls: 'pillConfirmed' },
  WAITLIST: { label: 'Liste d’attente', cls: 'pillWaitlist' },
  PENDING: { label: 'En attente', cls: 'pillPending' },
  REJECTED: { label: 'Refusée', cls: 'pillRejected' },
}

function membersLabel(team: EnduroTeam) {
  if (team.members.length === 0) return '—'
  return team.members.map((m) => `${m.firstName} ${m.lastName}`).join(' & ')
}

export default async function EquipesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await requireRole('ORGANIZER')
  const enduro = await getOrganizerEnduro(id, user.id)
  if (!enduro) notFound()

  const teams = await getEnduroTeams(enduro.id)
  const confirmed = teams.filter((t) => t.status === 'CONFIRMED').length
  const pct = enduro.maxTeams > 0 ? Math.min(100, Math.round((confirmed / enduro.maxTeams) * 100)) : 0
  const locked = enduro.status === 'LIVE'

  return (
    <>
      <div className={styles.progressCard}>
        <div className={styles.progressHead}>
          <span className={styles.progressLabel}>Équipes confirmées</span>
          <span className={styles.progressCount}>
            {confirmed}
            <span className="total">/{enduro.maxTeams}</span>
          </span>
        </div>
        <div className={styles.progressBar}>
          <div className={styles.progressFill} style={{ width: `${pct}%` }} />
        </div>
      </div>

      {enduro.mode === 'WITH_REGISTRATION' && (
        <div className={styles.infoBox}>
          💡 Cet enduro accepte les inscriptions en ligne : les équipes acceptées depuis l’onglet
          « Demandes » apparaissent ici. Vous pouvez aussi en ajouter manuellement.
        </div>
      )}

      {!locked && <AddTeamForm enduroId={enduro.id} sectors={enduro.sectors} />}

      {teams.length === 0 ? (
        <div className={styles.empty}>Aucune équipe pour le moment.</div>
      ) : (
        <div className={styles.reqList}>
          {teams.map((t) => {
            const st = TEAM_STATUS[t.status] ?? TEAM_STATUS.PENDING
            return (
              <div key={t.id} className={styles.teamRow}>
                <div>
                  <div className={styles.teamName}>{t.name}</div>
                  <div className={styles.teamMembers}>{membersLabel(t)}</div>
                </div>

                <form
                  action={assignTeamSector}
                  style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}
                >
                  <input type="hidden" name="enduroId" value={enduro.id} />
                  <input type="hidden" name="teamId" value={t.id} />
                  <select
                    name="sectorId"
                    defaultValue={t.sectorId ?? ''}
                    className={styles.teamSector}
                    style={{
                      background: 'rgba(0,0,0,0.4)',
                      border: '1px solid var(--line)',
                      color: 'var(--white)',
                      padding: '6px 8px',
                    }}
                    aria-label="Secteur"
                  >
                    <option value="">Secteur —</option>
                    {enduro.sectors.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                  <input
                    name="pegNumber"
                    type="number"
                    min={1}
                    defaultValue={t.pegNumber ?? ''}
                    placeholder="Poste"
                    aria-label="Numéro de poste"
                    style={{
                      width: 70,
                      background: 'rgba(0,0,0,0.4)',
                      border: '1px solid var(--line)',
                      color: 'var(--white)',
                      padding: '6px 8px',
                    }}
                  />
                  <button type="submit" className="btn btn-ghost" style={{ fontSize: '0.7rem' }}>
                    OK
                  </button>
                </form>

                <span className={`${styles.miniPill} ${styles[st.cls]}`}>{st.label}</span>

                {!locked && (
                  <form action={deleteTeam}>
                    <input type="hidden" name="enduroId" value={enduro.id} />
                    <input type="hidden" name="teamId" value={t.id} />
                    <button type="submit" className={styles.btnDanger} style={{ padding: '6px 12px' }}>
                      Suppr.
                    </button>
                  </form>
                )}
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}
