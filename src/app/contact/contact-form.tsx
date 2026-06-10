'use client'

import { useState } from 'react'
import styles from '../marketing.module.css'

/**
 * Formulaire de contact (placeholder).
 * TODO Phase 9 : brancher l'envoi réel (server action + Resend).
 * Pour l'instant, affiche une confirmation locale sans persistance.
 */
export function ContactForm() {
  const [sent, setSent] = useState(false)

  if (sent) {
    return (
      <div className={styles.card}>
        <div className={styles.cardTitle}>Message envoyé ✓</div>
        <div className={styles.cardSub}>
          Merci ! Nous avons bien reçu votre message et vous répondrons sous 24h ouvrées.
        </div>
        <button type="button" className="btn btn-ghost" onClick={() => setSent(false)}>
          Envoyer un autre message
        </button>
      </div>
    )
  }

  return (
    <form
      className={styles.card}
      onSubmit={(e) => {
        e.preventDefault()
        setSent(true)
      }}
    >
      <div className={styles.cardTitle}>Envoyez-nous un message</div>
      <div className={styles.cardSub}>
        Remplissez le formulaire, nous revenons vers vous très vite.
      </div>

      <div className={styles.fieldRow}>
        <div className={styles.field}>
          <label htmlFor="firstName">Prénom</label>
          <input id="firstName" name="firstName" type="text" placeholder="Jean" required />
        </div>
        <div className={styles.field}>
          <label htmlFor="lastName">Nom</label>
          <input id="lastName" name="lastName" type="text" placeholder="Dupont" required />
        </div>
      </div>
      <div className={styles.field}>
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" placeholder="jean.dupont@email.fr" required />
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
      </div>
      <button type="submit" className={`btn btn-primary ${styles.btnFull}`}>
        Envoyer le message
      </button>
    </form>
  )
}
