'use client'

import { useState } from 'react'
import { cancelEnduro, closeEnduro, deleteEnduro } from '@/app/actions/enduros'
import styles from '../../../dashboard.module.css'

export function DangerZone({
  enduroId,
  enduroName,
  status,
}: {
  enduroId: string
  enduroName: string
  status: string
}) {
  const [confirmName, setConfirmName] = useState('')

  const canClose = status === 'LIVE' || status === 'PUBLISHED'
  const canCancel = status !== 'FINISHED' && status !== 'CANCELLED'

  return (
    <div className={styles.dangerZone}>
      <div className={styles.dangerTitle}>⚠ Zone de danger</div>
      <div className={styles.dangerSub}>
        Actions irréversibles. Réfléchissez bien avant d’agir.
      </div>

      {canClose && (
        <div className={styles.dangerRow}>
          <div>
            <div className={styles.dangerRowTitle}>Clôturer l’enduro</div>
            <div className={styles.dangerRowSub}>
              Termine l’enduro et fige le classement. Les commissaires ne pourront plus saisir de
              prises.
            </div>
          </div>
          <form
            action={closeEnduro}
            onSubmit={(e) => {
              if (!confirm('Clôturer définitivement l’enduro ? Le classement sera figé.')) {
                e.preventDefault()
              }
            }}
          >
            <input type="hidden" name="enduroId" value={enduroId} />
            <button type="submit" className={styles.btnDanger}>
              Clôturer
            </button>
          </form>
        </div>
      )}

      {canCancel && (
        <div className={styles.dangerRow}>
          <div>
            <div className={styles.dangerRowTitle}>Annuler l’enduro</div>
            <div className={styles.dangerRowSub}>
              Marque l’enduro comme annulé. Il n’apparaîtra plus dans la recherche publique.
            </div>
          </div>
          <form
            action={cancelEnduro}
            onSubmit={(e) => {
              if (!confirm('Annuler l’enduro ?')) e.preventDefault()
            }}
          >
            <input type="hidden" name="enduroId" value={enduroId} />
            <button type="submit" className={styles.btnDanger}>
              Annuler l’enduro
            </button>
          </form>
        </div>
      )}

      <div className={styles.dangerRow}>
        <div>
          <div className={styles.dangerRowTitle}>Supprimer définitivement</div>
          <div className={styles.dangerRowSub}>
            Supprime cet enduro et toutes ses données (secteurs, équipes, prises). Cette action est{' '}
            <strong style={{ color: 'var(--red)' }}>irréversible</strong>. Tapez le nom exact pour
            confirmer : <strong>{enduroName}</strong>
          </div>
        </div>
        <form
          action={deleteEnduro}
          style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}
        >
          <input type="hidden" name="enduroId" value={enduroId} />
          <input
            name="confirmName"
            value={confirmName}
            onChange={(e) => setConfirmName(e.target.value)}
            placeholder="Nom de l’enduro"
            aria-label="Confirmer le nom de l’enduro"
            style={{
              background: 'rgba(0,0,0,0.4)',
              border: '1px solid var(--line)',
              color: 'var(--white)',
              padding: '9px 12px',
              fontFamily: 'var(--font-barlow)',
              fontSize: '0.9rem',
              outline: 'none',
            }}
          />
          <button type="submit" className={styles.btnDanger} disabled={confirmName !== enduroName}>
            Supprimer
          </button>
        </form>
      </div>
    </div>
  )
}
