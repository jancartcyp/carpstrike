'use client'

import { useActionState, useEffect, useRef } from 'react'
import { addTeam } from '@/app/actions/teams'
import styles from '../../../dashboard.module.css'

export function AddTeamForm({
  enduroId,
  sectors,
}: {
  enduroId: string
  sectors: { id: string; name: string }[]
}) {
  const [state, action, pending] = useActionState(addTeam, undefined)
  const ref = useRef<HTMLFormElement>(null)

  // Réinitialise le formulaire après un ajout réussi (reset DOM, pas de setState).
  useEffect(() => {
    if (state?.ok) ref.current?.reset()
  }, [state])

  const errorText = state?.errors
    ? Object.values(state.errors).flat().filter(Boolean).join(' · ')
    : null

  return (
    <form ref={ref} action={action} className={styles.addCard}>
      <input type="hidden" name="enduroId" value={enduroId} />

      <div className={styles.field}>
        <label htmlFor="name">
          Nom de l’équipe <span className="req">*</span>
        </label>
        <input id="name" name="name" placeholder="Ex. Les Traqueurs" />
      </div>

      <div className={styles.fieldRow}>
        <div className={styles.field}>
          <label htmlFor="captainFirstName">
            Capitaine — prénom <span className="req">*</span>
          </label>
          <input id="captainFirstName" name="captainFirstName" />
        </div>
        <div className={styles.field}>
          <label htmlFor="captainLastName">
            Capitaine — nom <span className="req">*</span>
          </label>
          <input id="captainLastName" name="captainLastName" />
        </div>
      </div>

      <div className={styles.fieldRow}>
        <div className={styles.field}>
          <label htmlFor="partnerFirstName">
            Co-équipier — prénom <span className="optional">facultatif</span>
          </label>
          <input id="partnerFirstName" name="partnerFirstName" />
        </div>
        <div className={styles.field}>
          <label htmlFor="partnerLastName">
            Co-équipier — nom <span className="optional">facultatif</span>
          </label>
          <input id="partnerLastName" name="partnerLastName" />
        </div>
      </div>

      <div className={styles.fieldRow}>
        <div className={styles.field}>
          <label htmlFor="sectorId">
            Secteur <span className="optional">facultatif</span>
          </label>
          <select id="sectorId" name="sectorId" defaultValue="">
            <option value="">— Non attribué —</option>
            {sectors.map((s) => (
              <option key={s.id} value={s.id}>
                Secteur {s.name}
              </option>
            ))}
          </select>
        </div>
        <div className={styles.field}>
          <label htmlFor="pegNumber">
            N° de poste <span className="optional">facultatif</span>
          </label>
          <input id="pegNumber" name="pegNumber" type="number" min={1} />
        </div>
      </div>

      {errorText && (
        <div className={`${styles.statusMsg} ${styles.statusError}`}>{errorText}</div>
      )}
      {state?.ok && (
        <div className={`${styles.statusMsg} ${styles.statusSuccess}`}>✓ {state.message}</div>
      )}

      <button type="submit" className="btn btn-primary" disabled={pending}>
        {pending ? 'Ajout…' : '+ Ajouter l’équipe'}
      </button>
    </form>
  )
}
