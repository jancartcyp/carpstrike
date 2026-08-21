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
      <div className={styles.field}>
        <label htmlFor="captainEmail">
          Capitaine — email <span className="optional">facultatif</span>
        </label>
        <input id="captainEmail" name="captainEmail" type="email" placeholder="jean.dupont@email.fr" />
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
      <div className={styles.field}>
        <label htmlFor="partnerEmail">
          Co-équipier — email <span className="optional">facultatif</span>
        </label>
        <input id="partnerEmail" name="partnerEmail" type="email" placeholder="jean.dupont@email.fr" />
      </div>
      <p style={{ fontSize: '0.78rem', color: 'var(--dim)', margin: '-6px 0 4px' }}>
        📧 Les emails sont facultatifs — inutile de les chercher si vous ne les avez pas sous la
        main. Renseignés, ils permettent au pêcheur de retrouver son équipe et ses notifications
        s’il a (ou crée un jour) un compte CarpStrike avec cette adresse.
      </p>

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
      <p style={{ fontSize: '0.78rem', color: 'var(--dim)', margin: '-6px 0 4px' }}>
        Le numéro de poste s’attribue ensuite, dans la liste ci-dessous (ou via le lancer de
        précision).
      </p>

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
