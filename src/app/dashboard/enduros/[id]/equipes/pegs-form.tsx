'use client'

import { useActionState } from 'react'
import { assignTeamPegs } from '@/app/actions/teams'
import styles from '../../../dashboard.module.css'
import { DeleteTeamButton } from './delete-team-button'

const TEAM_STATUS: Record<string, { label: string; cls: string }> = {
  CONFIRMED: { label: 'Confirmée', cls: 'pillConfirmed' },
  WAITLIST: { label: 'Liste d’attente', cls: 'pillWaitlist' },
  PENDING: { label: 'En attente', cls: 'pillPending' },
  REJECTED: { label: 'Refusée', cls: 'pillRejected' },
}

export type PegTeamRow = {
  id: string
  name: string
  membersLabel: string
  sectorId: string | null
  pegNumber: number | null
  status: string
}

/**
 * Un seul formulaire pour toute la liste : l'organisateur renseigne les postes (et secteurs)
 * de plusieurs équipes puis les enregistre en une fois via le bouton en bas de page.
 */
export function PegsForm({
  enduroId,
  sectors,
  teams,
  locked,
}: {
  enduroId: string
  sectors: { id: string; name: string }[]
  teams: PegTeamRow[]
  locked: boolean
}) {
  const [state, action, pending] = useActionState(assignTeamPegs, undefined)

  return (
    <form action={action}>
      <input type="hidden" name="enduroId" value={enduroId} />

      <div className={styles.reqList}>
        {teams.map((t) => {
          const st = TEAM_STATUS[t.status] ?? TEAM_STATUS.PENDING
          return (
            <div key={t.id} className={styles.teamRow}>
              <div>
                <div className={styles.teamName}>{t.name}</div>
                <div className={styles.teamMembers}>{t.membersLabel}</div>
              </div>

              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <select
                  name={`sector_${t.id}`}
                  defaultValue={t.sectorId ?? ''}
                  className={styles.teamSector}
                  style={{
                    background: 'rgba(0,0,0,0.4)',
                    border: '1px solid var(--line)',
                    color: 'var(--white)',
                    padding: '6px 8px',
                  }}
                  aria-label={`Secteur de ${t.name}`}
                >
                  <option value="">Secteur —</option>
                  {sectors.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
                <input
                  name={`peg_${t.id}`}
                  type="number"
                  min={1}
                  defaultValue={t.pegNumber ?? ''}
                  placeholder="Poste"
                  aria-label={`Numéro de poste de ${t.name}`}
                  style={{
                    width: 70,
                    background: 'rgba(0,0,0,0.4)',
                    border: '1px solid var(--line)',
                    color: 'var(--white)',
                    padding: '6px 8px',
                  }}
                />
              </div>

              <span className={`${styles.miniPill} ${styles[st.cls]}`}>{st.label}</span>

              {!locked && (
                <DeleteTeamButton enduroId={enduroId} teamId={t.id} teamName={t.name} />
              )}
            </div>
          )
        })}
      </div>

      {state?.message && (
        <div
          className={`${styles.statusMsg} ${state.ok ? styles.statusSuccess : styles.statusError}`}
          style={{ marginTop: 12 }}
        >
          {state.ok ? '✓ ' : ''}
          {state.message}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending ? 'Enregistrement…' : 'Enregistrer les postes'}
        </button>
      </div>
    </form>
  )
}
