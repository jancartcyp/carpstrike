import { Logo } from '@/components/logo'

/** Conteneur visuel partagé par les pages connexion / inscription. */
export function AuthCard({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
}) {
  return (
    <div
      style={{
        minHeight: 'calc(100vh - 57px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 24px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 420,
          background: 'var(--panel)',
          border: '1px solid var(--line-bright)',
          padding: '40px 32px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
          <Logo width={180} />
        </div>

        <h1
          style={{
            fontFamily: 'var(--font-barlow-condensed)',
            fontWeight: 900,
            fontStyle: 'italic',
            fontSize: '1.8rem',
            textTransform: 'uppercase',
            letterSpacing: 1,
            textAlign: 'center',
          }}
        >
          {title}
        </h1>
        {subtitle && (
          <p
            style={{
              color: 'var(--dim)',
              textAlign: 'center',
              marginBottom: 28,
              marginTop: 4,
              fontSize: '0.95rem',
            }}
          >
            {subtitle}
          </p>
        )}

        {children}
      </div>
    </div>
  )
}
