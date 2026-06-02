import { Logo } from '@/components/logo'

export default function Home() {
  return (
    <div
      style={{
        minHeight: 'calc(100vh - 57px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 32,
        padding: '80px 32px',
        textAlign: 'center',
      }}
    >
      <Logo width={320} />

      <p
        style={{
          fontFamily: 'var(--font-barlow-condensed)',
          fontWeight: 700,
          fontStyle: 'italic',
          fontSize: '1.1rem',
          letterSpacing: 4,
          textTransform: 'uppercase',
          color: 'var(--off)',
        }}
      >
        En construction
      </p>

      <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
        <a href="/enduros" className="btn btn-primary">
          Découvrir les enduros
        </a>
        <a href="/organisateurs" className="btn btn-ghost">
          Organiser un enduro
        </a>
      </div>
    </div>
  )
}
