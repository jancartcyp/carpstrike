import type { Metadata } from 'next'
import { AuthCard } from '../auth-card'
import { SignupForm } from './signup-form'

export const metadata: Metadata = {
  title: 'Inscription — CarpStrike',
}

export default function InscriptionPage() {
  return (
    <AuthCard title="Créer un compte" subtitle="Rejoins la communauté CarpStrike">
      <SignupForm />
    </AuthCard>
  )
}
