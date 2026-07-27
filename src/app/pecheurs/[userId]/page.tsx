import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getFishermanProfile } from '@/lib/fisherman'
import { prisma } from '@/lib/prisma'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ userId: string }>
}): Promise<Metadata> {
  const { userId } = await params
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { firstName: true, lastName: true },
  })
  return {
    title: user ? `${user.firstName} ${user.lastName} — Pêcheur` : 'Pêcheur — CarpStrike',
  }
}

const STATUS_LABEL: Record<string, string> = {
  DRAFT: 'Brouillon',
  PUBLISHED: 'À venir',
  LIVE: 'En direct',
  FINISHED: 'Terminé',
  CANCELLED: 'Annulé',
}

const longDate = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })

export default async function PecheurPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { firstName: true, lastName: true, createdAt: true },
  })
  if (!user) notFound()

  const { participations, stats } = await getFishermanProfile(userId)
  const fullName = `${user.firstName} ${user.lastName}`.trim() || 'Pêcheur'

  const statCards: [string, string][] = [
    [String(stats.enduros), stats.enduros > 1 ? 'Enduros' : 'Enduro'],
    [String(stats.totalCatches), 'Prises validées'],
    [`${stats.biggest.toFixed(1)} kg`, 'Plus grosse'],
    [String(stats.trophies), stats.trophies > 1 ? 'Trophées' : 'Trophée'],
  ]

  return (
    <main style={{ maxWidth: 820, margin: '0 auto', padding: '40px 20px 80px' }}>
      {/* En-tête */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: 'rgba(46,160,90,0.15)',
            border: '1px solid var(--line)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'var(--font-barlow-condensed), sans-serif',
            fontWeight: 800,
            fontSize: '1.6rem',
            color: 'var(--green)',
          }}
        >
          {(user.firstName[0] ?? '').toUpperCase()}
          {(user.lastName[0] ?? '').toUpperCase()}
        </div>
        <div>
          <h1
            style={{
              fontFamily: 'var(--font-barlow-condensed), sans-serif',
              fontWeight: 800,
              fontSize: '2rem',
              color: 'var(--white)',
              margin: 0,
              lineHeight: 1.1,
            }}
          >
            {fullName}
          </h1>
          <div style={{ color: 'var(--dim)', fontSize: '0.85rem', marginTop: 2 }}>
            Pêcheur CarpStrike depuis {longDate.format(user.createdAt)}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 30 }}>
        {statCards.map(([val, lbl]) => (
          <div
            key={lbl}
            style={{
              flex: '1 1 120px',
              padding: '14px 16px',
              borderRadius: 12,
              border: '1px solid var(--line)',
              background: 'rgba(255,255,255,0.02)',
            }}
          >
            <div
              style={{
                fontFamily: 'var(--font-barlow-condensed), sans-serif',
                fontWeight: 800,
                fontSize: '1.6rem',
                color: 'var(--green)',
              }}
            >
              {val}
            </div>
            <div style={{ color: 'var(--dim)', fontSize: '0.78rem' }}>{lbl}</div>
          </div>
        ))}
      </div>

      {/* Historique */}
      <h2
        style={{
          fontFamily: 'var(--font-barlow-condensed), sans-serif',
          fontWeight: 700,
          fontSize: '1.15rem',
          color: 'var(--white)',
          margin: '0 0 12px',
        }}
      >
        Participations ({participations.length})
      </h2>

      {participations.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            color: 'var(--dim)',
            padding: '50px 20px',
            border: '1px dashed var(--line)',
            borderRadius: 12,
          }}
        >
          🎣 Aucune participation enregistrée pour le moment.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {participations.map((p) => {
            const href =
              p.status === 'FINISHED'
                ? `/enduros/${p.enduroSlug}/resultats`
                : `/enduros/${p.enduroSlug}/classement`
            return (
              <Link
                key={`${p.teamId}`}
                href={href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '14px 16px',
                  borderRadius: 12,
                  border: '1px solid var(--line)',
                  background: 'rgba(255,255,255,0.02)',
                  textDecoration: 'none',
                  color: 'inherit',
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: 'var(--white)', fontWeight: 600 }}>
                    {p.enduroName}
                    {p.isPodium && ' 🏆'}
                  </div>
                  <div style={{ color: 'var(--dim)', fontSize: '0.8rem', marginTop: 2 }}>
                    {p.teamName} · {STATUS_LABEL[p.status] ?? p.status} · {longDate.format(p.startAt)}
                  </div>
                </div>
                <div style={{ textAlign: 'right', fontSize: '0.82rem' }}>
                  <div style={{ color: 'var(--white)' }}>
                    {p.rank != null ? `${p.rank}ᵉ` : '—'}
                  </div>
                  <div style={{ color: 'var(--dim)' }}>
                    {p.total.toFixed(1)} kg · {p.catches} prise{p.catches > 1 ? 's' : ''}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </main>
  )
}
