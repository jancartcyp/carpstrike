'use client'

import { useRef } from 'react'
import { approveRegistration, rejectRegistration } from '@/app/actions/registrations'
import styles from '../../../dashboard.module.css'

export function RequestActions({
  requestId,
  teamName,
}: {
  requestId: string
  teamName: string
}) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  return (
    <div className={styles.reqActions}>
      <form action={approveRegistration}>
        <input type="hidden" name="requestId" value={requestId} />
        <button type="submit" className={styles.btnSuccess}>
          ✓ Accepter
        </button>
      </form>

      <button
        type="button"
        className={styles.btnDanger}
        style={{ padding: '7px 14px' }}
        onClick={() => dialogRef.current?.showModal()}
      >
        ✕ Refuser
      </button>

      <dialog ref={dialogRef} className={styles.modal}>
        <div className={styles.modalTitle}>
          Refuser la <span className="accent">demande</span>
        </div>
        <div className={styles.modalSub}>
          Équipe « {teamName} » — indiquez le motif (conservé pour information).
        </div>
        <form action={rejectRegistration}>
          <input type="hidden" name="requestId" value={requestId} />
          <div className={styles.field}>
            <label htmlFor={`reason-${requestId}`}>Motif du refus</label>
            <textarea
              id={`reason-${requestId}`}
              name="reason"
              required
              minLength={3}
              placeholder="Ex. enduro complet, dossier incomplet…"
            />
          </div>
          <div className={styles.modalActions}>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => dialogRef.current?.close()}
            >
              Annuler
            </button>
            <button type="submit" className={styles.btnDanger}>
              Confirmer le refus
            </button>
          </div>
        </form>
      </dialog>
    </div>
  )
}
