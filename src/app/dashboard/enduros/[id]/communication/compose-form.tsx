'use client'

import { useActionState, useState } from 'react'
import { sendCommunication } from '@/app/actions/communications'
import styles from '../../../dashboard.module.css'

const RECIPIENTS = [
  { value: 'ALL', label: 'Toutes les équipes', desc: 'Diffusé publiquement sur la page de l’enduro' },
  { value: 'CONFIRMED', label: 'Équipes confirmées', desc: 'Les équipes validées' },
  { value: 'WAITLIST', label: 'Liste d’attente', desc: 'Équipes en attente de place' },
  { value: 'PENDING', label: 'En attente', desc: 'Demandes non encore traitées' },
] as const

const PRIORITIES = [
  { value: 'LOW', label: '📋 Info' },
  { value: 'NORMAL', label: '⚠ Important' },
  { value: 'HIGH', label: '🚨 Urgent' },
] as const

const CHANNELS = [
  { value: 'NOTIF', label: '🔔 In-app' },
  { value: 'EMAIL', label: '📧 Email' },
] as const

export function ComposeForm({ enduroId }: { enduroId: string }) {
  const [state, action, pending] = useActionState(sendCommunication, undefined)
  const [recipients, setRecipients] = useState<string>('ALL')
  const [priority, setPriority] = useState<string>('LOW')
  // Incrémenté à chaque succès pour remonter le <form> (vide les champs non contrôlés).
  const [formKey, setFormKey] = useState(0)

  // Réinitialisation après succès (ajustement pendant le rendu, sans ref ni effet).
  const [seen, setSeen] = useState(state)
  if (state !== seen) {
    setSeen(state)
    if (state?.ok) {
      setRecipients('ALL')
      setPriority('LOW')
      setFormKey((k) => k + 1)
    }
  }

  const errorText = state?.errors
    ? Object.values(state.errors).flat().filter(Boolean).join(' · ')
    : null

  return (
    <form key={formKey} action={action} className={styles.addCard}>
      <input type="hidden" name="enduroId" value={enduroId} />
      <input type="hidden" name="recipients" value={recipients} />
      <input type="hidden" name="priority" value={priority} />

      <div className={styles.field}>
        <label>Destinataires</label>
        <div className={styles.choiceGrid}>
          {RECIPIENTS.map((r) => (
            <button
              key={r.value}
              type="button"
              onClick={() => setRecipients(r.value)}
              className={`${styles.choiceCard} ${recipients === r.value ? styles.active : ''}`}
            >
              <span className={styles.choiceCardTitle}>{r.label}</span>
              <span className={styles.choiceCardDesc}>{r.desc}</span>
            </button>
          ))}
        </div>
      </div>

      <div className={styles.field}>
        <label htmlFor="subject">
          Objet <span className="req">*</span>
        </label>
        <input id="subject" name="subject" placeholder="Ex. Vent fort cette nuit" />
      </div>

      <div className={styles.field}>
        <label htmlFor="body">
          Message <span className="req">*</span>
        </label>
        <textarea id="body" name="body" style={{ minHeight: 120 }} />
      </div>

      <div className={styles.field}>
        <label>Priorité</label>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {PRIORITIES.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => setPriority(p.value)}
              className={`${styles.filterChip} ${priority === p.value ? styles.filterChipActive : ''}`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.field}>
        <label>Canaux</label>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
          {CHANNELS.map((c) => (
            <label key={c.value} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <input
                type="checkbox"
                name="channels"
                value={c.value}
                defaultChecked={c.value === 'NOTIF'}
                style={{ width: 18, height: 18, accentColor: 'var(--red)' }}
              />
              <span style={{ fontSize: '0.88rem' }}>{c.label}</span>
            </label>
          ))}
        </div>
        <p className={styles.fieldHelper}>
          L’envoi email réel arrive bientôt — pour l’instant les annonces « à tous » s’affichent sur
          la page publique de l’enduro.
        </p>
      </div>

      {errorText && <div className={`${styles.statusMsg} ${styles.statusError}`}>{errorText}</div>}
      {state?.ok && (
        <div className={`${styles.statusMsg} ${styles.statusSuccess}`}>✓ Annonce envoyée.</div>
      )}

      <button type="submit" className="btn btn-primary" disabled={pending}>
        {pending ? 'Envoi…' : '📨 Envoyer l’annonce'}
      </button>
    </form>
  )
}
