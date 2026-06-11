'use client'

import { useActionState } from 'react'
import { updateEnduroSection } from '@/app/actions/enduros'
import styles from '../../../dashboard.module.css'

export function SectionForm({
  enduroId,
  section,
  num,
  title,
  subtitle,
  locked = false,
  lockedNote,
  children,
}: {
  enduroId: string
  section: string
  num: number
  title: string
  subtitle: string
  locked?: boolean
  lockedNote?: string
  children: React.ReactNode
}) {
  const [state, action, pending] = useActionState(updateEnduroSection, undefined)
  const errorText = state?.errors
    ? Object.values(state.errors).flat().filter(Boolean).join(' · ')
    : null

  return (
    <form action={action} className={`${styles.sectionCard} ${locked ? styles.locked : ''}`}>
      <div className={styles.sectionHead}>
        <div className={styles.sectionNum}>{num}</div>
        <div>
          <div className={styles.sectionName}>{title}</div>
          <div className={styles.sectionSub}>{subtitle}</div>
        </div>
      </div>

      <div className={styles.sectionBody}>
        {locked && (
          <div className={`${styles.infoBox} ${styles.warn}`}>
            🔒 {lockedNote ?? 'Section verrouillée tant que l’enduro est en cours.'}
          </div>
        )}

        <input type="hidden" name="enduroId" value={enduroId} />
        <input type="hidden" name="section" value={section} />

        {children}

        {state?.ok && (
          <div className={`${styles.statusMsg} ${styles.statusSuccess}`} style={{ marginTop: 16, marginBottom: 0 }}>
            ✓ {state.message}
          </div>
        )}
        {errorText && (
          <div className={`${styles.statusMsg} ${styles.statusError}`} style={{ marginTop: 16, marginBottom: 0 }}>
            {errorText}
          </div>
        )}
      </div>

      {!locked && (
        <div className={styles.sectionActions}>
          <span className={styles.sectionActionsInfo} style={{ color: 'var(--dim)' }}>
            {pending ? 'Enregistrement…' : ''}
          </span>
          <button type="submit" className="btn btn-primary" disabled={pending}>
            Enregistrer
          </button>
        </div>
      )}
    </form>
  )
}
