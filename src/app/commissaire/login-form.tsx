'use client'

import { useActionState } from 'react'
import { loginCommissaire } from '@/app/actions/commissaire-auth'
import styles from './commissaire.module.css'

export function CommissaireLoginForm() {
  const [state, action, pending] = useActionState(loginCommissaire, undefined)

  return (
    <form action={action} className={styles.loginCard}>
      {state?.message && <div className={styles.loginError}>⚠ {state.message}</div>}

      <div className={styles.field}>
        <label htmlFor="username">Identifiant</label>
        <input id="username" name="username" autoComplete="username" placeholder="pmartin.mon-enduro" />
      </div>
      <div className={styles.field}>
        <label htmlFor="password">Mot de passe</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="••••-••••-••••"
        />
      </div>

      <button type="submit" className={`btn btn-primary ${styles.btnBlock}`} disabled={pending}>
        {pending ? 'Connexion…' : 'Se connecter →'}
      </button>
    </form>
  )
}
