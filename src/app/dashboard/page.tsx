import type { Metadata } from 'next'
import { requireRole } from '@/lib/auth/dal'

export const metadata: Metadata = {
  title: 'Tableau de bord — CarpStrike',
}

export default async function DashboardPage() {
  const user = await requireRole('ORGANIZER')

  return (
    <div className="container" style={{ padding: '60px 32px' }}>
      <h1
        style={{
          fontFamily: 'var(--font-barlow-condensed)',
          fontWeight: 900,
          fontStyle: 'italic',
          fontSize: '2.4rem',
          textTransform: 'uppercase',
        }}
      >
        Tableau de bord
      </h1>
      <p style={{ color: 'var(--off)', marginTop: 8 }}>
        Bienvenue {user.firstName} {user.lastName} — espace organisateur.
      </p>
      <p style={{ color: 'var(--dim)', marginTop: 24, fontSize: '0.9rem' }}>
        (Gestion des enduros à venir — Phase 4)
      </p>
    </div>
  )
}
