import type { Metadata } from 'next'
import { requireRole } from '@/lib/auth/dal'

export const metadata: Metadata = {
  title: 'Mon profil — CarpStrike',
}

export default async function ProfilPage() {
  const user = await requireRole('FISHERMAN')

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
        Mon profil
      </h1>
      <p style={{ color: 'var(--off)', marginTop: 8 }}>
        Salut {user.firstName} — espace pêcheur.
      </p>
      <p style={{ color: 'var(--dim)', marginTop: 24, fontSize: '0.9rem' }}>
        (Stats, historique et trophées à venir — Phase 8)
      </p>
    </div>
  )
}
