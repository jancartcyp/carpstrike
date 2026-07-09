'use client'

import { useActionState } from 'react'
import { saveTeamThrows } from '@/app/actions/precision'
import styles from '../../../dashboard.module.css'

type TeamRow = {
  id: string
  name: string
  sectorName: string | null
  throw1Cm: number | null
  throw2Cm: number | null
}

const inputStyle: React.CSSProperties = {
  width: 84,
  background: 'rgba(0,0,0,0.4)',
  border: '1px solid var(--line)',
  color: 'var(--white)',
  padding: '6px 8px',
}

function TeamThrowRow({ enduroId, team, locked }: { enduroId: string; team: TeamRow; locked: boolean }) {
  const [state, action, pending] = useActionState(saveTeamThrows, undefined)

  return (
    <form action={action} className={styles.teamRow}>
      <input type="hidden" name="enduroId" value={enduroId} />
      <input type="hidden" name="teamId" value={team.id} />
      <div>
        <div className={styles.teamName}>{team.name}</div>
        <div className={styles.teamMembers}>{team.sectorName ? `Secteur ${team.sectorName}` : 'Sans secteur'}</div>
      </div>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.72rem', color: 'var(--dim)' }}>
          1er
          <input
            name="throw1Cm"
            type="number"
            min={0}
            inputMode="numeric"
            defaultValue={team.throw1Cm ?? ''}
            placeholder="cm"
            aria-label={`Premier lancer de ${team.name} en cm`}
            disabled={locked}
            style={inputStyle}
          />
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.72rem', color: 'var(--dim)' }}>
          2e
          <input
            name="throw2Cm"
            type="number"
            min={0}
            inputMode="numeric"
            defaultValue={team.throw2Cm ?? ''}
            placeholder="cm"
            aria-label={`Deuxième lancer de ${team.name} en cm`}
            disabled={locked}
            style={inputStyle}
          />
        </label>
        {!locked && (
          <button type="submit" className="btn btn-ghost" style={{ fontSize: '0.7rem' }} disabled={pending}>
            {pending ? '…' : 'OK'}
          </button>
        )}
      </div>

      {state?.message && <span className={`${styles.miniPill} ${styles.pillRejected}`}>{state.message}</span>}
      {state?.ok && <span className={`${styles.miniPill} ${styles.pillConfirmed}`}>Enregistré</span>}
    </form>
  )
}

export function PrecisionForms({
  enduroId,
  teams,
  locked,
}: {
  enduroId: string
  teams: TeamRow[]
  locked: boolean
}) {
  return (
    <div className={styles.reqList}>
      {teams.map((team) => (
        <TeamThrowRow key={team.id} enduroId={enduroId} team={team} locked={locked} />
      ))}
    </div>
  )
}
