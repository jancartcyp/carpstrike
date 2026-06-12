import Link from 'next/link'

export default function NotFound() {
  return (
    <div
      style={{
        maxWidth: 560,
        margin: '0 auto',
        padding: '100px 24px',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          fontFamily: 'var(--font-barlow-condensed)',
          fontWeight: 900,
          fontStyle: 'italic',
          fontSize: 'clamp(5rem, 18vw, 9rem)',
          lineHeight: 1,
          color: 'var(--red)',
          textShadow: '0 0 40px var(--red-glow)',
        }}
      >
        404
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
        Page introuvable
      </h1>
      <p style={{ color: 'var(--dim)', margin: '12px 0 28px', lineHeight: 1.6 }}>
        Cette page n’existe pas ou l’enduro recherché n’est plus disponible.
      </p>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
        <Link href="/" className="btn btn-primary">
          Accueil
        </Link>
        <Link href="/enduros" className="btn btn-ghost">
          Voir les enduros
        </Link>
      </div>
    </div>
  )
}
