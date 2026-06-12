'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Journalisation côté client (remplaçable par un service de monitoring plus tard).
    console.error(error)
  }, [error])

  return (
    <div style={{ maxWidth: 560, margin: '0 auto', padding: '100px 24px', textAlign: 'center' }}>
      <div
        style={{
          fontFamily: 'var(--font-barlow-condensed)',
          fontWeight: 900,
          fontStyle: 'italic',
          fontSize: 'clamp(4rem, 14vw, 7rem)',
          lineHeight: 1,
          color: 'var(--red)',
          textShadow: '0 0 40px var(--red-glow)',
        }}
      >
        Oups
      </div>
      <h1
        style={{
          fontFamily: 'var(--font-barlow-condensed)',
          fontWeight: 900,
          fontStyle: 'italic',
          fontSize: '1.8rem',
          textTransform: 'uppercase',
          marginTop: 8,
        }}
      >
        Une erreur est survenue
      </h1>
      <p style={{ color: 'var(--dim)', margin: '12px 0 28px', lineHeight: 1.6 }}>
        Quelque chose s’est mal passé. Vous pouvez réessayer.
      </p>
      <button type="button" onClick={reset} className="btn btn-primary">
        Réessayer
      </button>
    </div>
  )
}
