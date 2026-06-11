'use client'

import { useActionState, useState } from 'react'
import {
  type CommissaireCreateState,
  createCommissaire,
  regenerateCommissairePassword,
} from '@/app/actions/commissaires'
import styles from '../../../dashboard.module.css'

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      type="button"
      className="btn btn-ghost"
      style={{ fontSize: '0.68rem', padding: '4px 10px' }}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value)
          setCopied(true)
          setTimeout(() => setCopied(false), 1500)
        } catch {
          /* presse-papiers indisponible */
        }
      }}
    >
      {copied ? '✓ Copié' : 'Copier'}
    </button>
  )
}

function Credentials({ created }: { created: NonNullable<CommissaireCreateState>['created'] }) {
  if (!created) return null
  const loginUrl =
    typeof window !== 'undefined' ? `${window.location.origin}/commissaire` : '/commissaire'
  return (
    <div className={`${styles.statusMsg} ${styles.statusSuccess}`} style={{ marginBottom: 16 }}>
      <div style={{ fontWeight: 700, marginBottom: 8 }}>
        ✓ Accès créé pour {created.displayName} — notez le mot de passe (affiché une seule fois)
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <span style={{ minWidth: 90, color: 'var(--dim)', fontSize: '0.75rem' }}>Identifiant</span>
        <code style={{ flex: 1, color: 'var(--white)' }}>{created.username}</code>
        <CopyButton value={created.username} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <span style={{ minWidth: 90, color: 'var(--dim)', fontSize: '0.75rem' }}>Mot de passe</span>
        <code style={{ flex: 1, color: 'var(--white)' }}>{created.password}</code>
        <CopyButton value={created.password} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ minWidth: 90, color: 'var(--dim)', fontSize: '0.75rem' }}>Lien</span>
        <code style={{ flex: 1, color: 'var(--white)' }}>{loginUrl}</code>
        <CopyButton value={loginUrl} />
      </div>
    </div>
  )
}

export function CreateCommissaire({ enduroId }: { enduroId: string }) {
  const [state, action, pending] = useActionState(createCommissaire, undefined)
  const errorText = state?.errors
    ? Object.values(state.errors).flat().filter(Boolean).join(' · ')
    : null

  return (
    <div className={styles.addCard}>
      {state?.created && <Credentials created={state.created} />}
      <form action={action}>
        <input type="hidden" name="enduroId" value={enduroId} />
        <div className={styles.fieldRow}>
          <div className={styles.field}>
            <label htmlFor="c-firstName">
              Prénom <span className="req">*</span>
            </label>
            <input id="c-firstName" name="firstName" />
          </div>
          <div className={styles.field}>
            <label htmlFor="c-lastName">
              Nom <span className="req">*</span>
            </label>
            <input id="c-lastName" name="lastName" />
          </div>
        </div>
        {errorText && <div className={`${styles.statusMsg} ${styles.statusError}`}>{errorText}</div>}
        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending ? 'Génération…' : '+ Générer un accès commissaire'}
        </button>
      </form>
    </div>
  )
}

export function RegenButton({ commissaireId }: { commissaireId: string }) {
  const [state, action, pending] = useActionState(regenerateCommissairePassword, undefined)
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      <form action={action}>
        <input type="hidden" name="commissaireId" value={commissaireId} />
        <button type="submit" className="btn btn-ghost" style={{ fontSize: '0.7rem' }} disabled={pending}>
          🔄 Régénérer
        </button>
      </form>
      {state?.created && (
        <span style={{ fontSize: '0.78rem', color: 'var(--green)' }}>
          Nouveau MDP : <strong style={{ color: 'var(--white)' }}>{state.created.password}</strong>
        </span>
      )}
    </span>
  )
}
