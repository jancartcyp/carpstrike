import Link from 'next/link'

export function Header() {
  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: 'rgba(10,9,8,0.85)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--line)',
      }}
    >
      <nav
        style={{
          maxWidth: 1280,
          margin: '0 auto',
          padding: '16px 32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 32,
        }}
      >
        {/* Logo texte (fidèle maquette) */}
        <Link href="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
          <span
            style={{
              fontFamily: 'var(--font-barlow-condensed), sans-serif',
              fontWeight: 900,
              fontStyle: 'italic',
              fontSize: '1.6rem',
              color: 'var(--white)',
              letterSpacing: 1,
              lineHeight: 1,
            }}
          >
            CARP
          </span>
          <span
            style={{
              width: 3,
              height: 22,
              background: 'var(--red)',
              transform: 'skewX(-10deg)',
              margin: '0 8px',
              boxShadow: '0 0 10px var(--red-glow)',
              display: 'inline-block',
            }}
          />
          <span
            style={{
              fontFamily: 'var(--font-barlow-condensed), sans-serif',
              fontWeight: 900,
              fontStyle: 'italic',
              fontSize: '1.6rem',
              color: 'var(--red)',
              letterSpacing: 1,
              lineHeight: 1,
              textShadow: '0 0 20px var(--red-glow)',
            }}
          >
            STRIKE
          </span>
        </Link>

        {/* Navigation */}
        <ul
          style={{
            display: 'flex',
            gap: 4,
            listStyle: 'none',
            flex: 1,
            justifyContent: 'center',
          }}
        >
          {[
            { label: 'Enduros', href: '/enduros' },
            { label: 'Classements', href: '/classements' },
            { label: 'Organisateurs', href: '/organisateurs' },
            { label: 'Tarifs', href: '/tarifs' },
          ].map(({ label, href }) => (
            <li key={href}>
              <Link
                href={href}
                style={{
                  fontFamily: 'var(--font-rajdhani), sans-serif',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  letterSpacing: 2,
                  textTransform: 'uppercase',
                  color: 'var(--dim)',
                  padding: '8px 16px',
                  textDecoration: 'none',
                  display: 'block',
                  transition: 'color 0.2s',
                }}
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>

        {/* CTA */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Link href="/connexion" className="btn btn-ghost" style={{ fontSize: '0.85rem' }}>
            Connexion
          </Link>
          <Link href="/inscription" className="btn btn-primary" style={{ fontSize: '0.85rem' }}>
            Créer un enduro
          </Link>
        </div>
      </nav>
    </header>
  )
}
