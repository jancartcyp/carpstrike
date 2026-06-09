import type { Metadata } from 'next'
import { AuthCard } from '../auth-card'
import { LoginForm } from './login-form'

export const metadata: Metadata = {
  title: 'Connexion — CarpStrike',
}

export default function ConnexionPage() {
  return (
    <AuthCard title="Connexion" subtitle="Accède à ton espace CarpStrike">
      <LoginForm />
    </AuthCard>
  )
}
