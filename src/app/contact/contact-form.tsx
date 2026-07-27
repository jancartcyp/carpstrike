'use client'

import { useActionState } from 'react'
import { sendContactMessage } from '@/app/actions/contact'
import styles from '../marketing.module.css'

export function ContactForm() {
  const [state, action, pending] = useActionState(sendContactMessage, undefined)

  if (state?.ok) {
    return (
      <div className={styles.card}>
        <div className={styles.cardTitle}>Message envoyé ✓</div>
        <div className={styles.cardSub}>
          Merci ! Nous avons bien reçu votre message et vous répondrons sous 24h ouvrées.
        </div>
      </div>
    )
  }

  const err = (k: string) => state?.errors?.[k]?.[0]

  return (
    <form action={action} className={styles.card}>
      <div className={styles.cardTitle}>Envoyez-nous un message</div>
      <div className={styles.cardSub}>
        Remplissez le formulaire, nous revenons vers vous très vite.
      </div>

      {state?.message && (
        <div
          style={{
            margin: '10px 0',
            padding: '10px 12px',
            borderRadius: 8,
            border: '1px solid var(--red)',
            color: 'var(--red)',
            fontSize: '0.85rem',
          }}
        >
          {state.message}
        </div>
      )}

      <div className={styles.fieldRow}>
        <div className={styles.field}>
          <label htmlFor="firstName">Prénom</label>
          <input id="firstName" name="firstName" type="text" placeholder="Jean" required />
          {err('firstName') && <small style={{ color: 'var(--red)' }}>{err('firstName')}</small>}
        </div>
        <div className={styles.field}>
          <label htmlFor="lastName">Nom</label>
          <input id="lastName" name="lastName" type="text" placeholder="Dupont" required />
          {err('lastName') && <small style={{ color: 'var(--red)' }}>{err('lastName')}</small>}
        </div>
      </div>
      <div className={styles.field}>
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" placeholder="jean.dupont@email.fr" required />
        {err('email') && <small style={{ color: 'var(--red)' }}>{err('email')}</small>}
      </div>
      <div className={styles.field}>
        <label htmlFor="profile">Je suis</label>
        <select id="profile" name="profile" defaultValue="Un pêcheur">
          <option>Un pêcheur</option>
          <option>Un organisateur d’enduro</option>
          <option>Un commissaire</option>
          <option>Une fédération / un club</option>
          <option>Autre</option>
        </select>
      </div>
      <div className={styles.field}>
        <label htmlFor="subject">Sujet</label>
        <select id="subject" name="subject" defaultValue="Question générale">
          <option>Question générale</option>
          <option>Aide à l’inscription</option>
          <option>Demande de démo organisateur</option>
          <option>Problème technique</option>
          <option>Partenariat / sponsoring</option>
          <option>Presse</option>
        </select>
      </div>
      <div className={styles.field}>
        <label htmlFor="message">Votre message</label>
        <textarea id="message" name="message" placeholder="Décrivez votre demande..." required />
        {err('message') && <small style={{ color: 'var(--red)' }}>{err('message')}</small>}
      </div>
      <button type="submit" className={`btn btn-primary ${styles.btnFull}`} disabled={pending}>
        {pending ? 'Envoi…' : 'Envoyer le message'}
      </button>
    </form>
  )
}
