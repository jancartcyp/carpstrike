import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Adresse confirmée — CarpStrike',
}

export default function ConfirmePage() {
  return (
    <div style={{ maxWidth: 520, margin: '0 auto', padding: '90px 24px', textAlign: 'center' }}>
      <div
        style={{
          width: 84,
          height: 84,
          margin: '0 auto 20px',
          background: 'var(--green)',
          color: '#04240f',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '2.6rem',
          boxShadow: '0 0 40px rgba(0,200,80,0.5)',
          clipPath: 'polygon(16px 0%, 100% 0%, 100% calc(100% - 16px), calc(100% - 16px) 100%, 0% 100%, 0% 16px)',
        }}
      >
        ✓
      </div>
      <h1
        style={{
          fontFamily: 'var(--font-barlow-condensed)',
          fontWeight: 900,
          fontStyle: 'italic',
          fontSize: '2.2rem',
          lineHeight: 1,
          marginBottom: 10,
        }}
      >
        Adresse <span className="accent">confirmée</span> !
      </h1>
      <p style={{ color: 'var(--dim)', lineHeight: 1.6, marginBottom: 28 }}>
        Ton compte est activé. Tu peux dès maintenant participer à un enduro ou organiser le tien.
      </p>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
        <Link href="/dashboard" className="btn btn-primary">
          Accéder à mon espace
        </Link>
        <Link href="/enduros" className="btn btn-ghost">
          Voir les enduros
        </Link>
      </div>
    </div>
  )
}
