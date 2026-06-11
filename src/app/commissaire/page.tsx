import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getCommissaire } from '@/lib/commissaire/dal'
import styles from './commissaire.module.css'
import { CommissaireLoginForm } from './login-form'

export const metadata: Metadata = {
  title: 'Espace commissaire — CarpStrike',
}

export default async function CommissaireLoginPage() {
  const commissaire = await getCommissaire()
  if (commissaire) redirect('/commissaire/app')

  return (
    <div className={styles.loginWrap}>
      <div className={styles.loginEyebrow}>Espace commissaire</div>
      <h1 className={styles.loginTitle}>
        Validation des <span className="accent">prises</span>
      </h1>
      <p className={styles.loginSub}>
        Connectez-vous avec les identifiants fournis par l’organisateur de l’enduro.
      </p>
      <CommissaireLoginForm />
    </div>
  )
}
