import type { Metadata } from 'next'
import { AuthCard } from '../auth-card'
import { LoginForm } from './login-form'

export const metadata: Metadata = {
  title: 'Connexion — CarpStrike',
}

export default async function ConnexionPage({
  searchParams,
}: {
  searchParams: Promise<{ erreur?: string }>
}) {
  const { erreur } = await searchParams
  return (
    <AuthCard title="Connexion" subtitle="Accède à ton espace CarpStrike">
      {erreur === 'lien' && (
        <p
          style={{
            color: 'var(--white)',
            fontSize: '0.9rem',
            padding: '10px 14px',
            marginBottom: 16,
            background: 'var(--red-dim)',
            border: '1px solid var(--red)',
          }}
        >
          Le lien de confirmation est invalide ou expiré. Connecte-toi, ou renvoie un email de
          confirmation en recréant le compte.
        </p>
      )}
      <LoginForm />
    </AuthCard>
  )
}
