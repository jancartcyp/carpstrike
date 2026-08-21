import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth/dal'
import { getTeamCatchDetail } from '@/lib/ranking'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; teamId: string }>
}): Promise<Metadata> {
  const { slug, teamId } = await params
  const data = await getTeamCatchDetail(slug, teamId)
  return { title: data ? `${data.team.name} — Prises` : 'Équipe — CarpStrike' }
}

const STATUS: Record<string, { label: string; color: string }> = {
  VALID: { label: 'Validée', color: 'var(--green)' },
  CONTESTED: { label: 'Contestée', color: '#f0a500' },
  CANCELLED: { label: 'Annulée', color: 'var(--red)' },
}

const dateTime = new Intl.DateTimeFormat('fr-FR', {
  day: '2-digit',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
})

export default async function TeamCatchesPage({
  params,
}: {
  params: Promise<{ slug: string; teamId: string }>
}) {
  const { slug, teamId } = await params
  const data = await getTeamCatchDetail(slug, teamId)
  if (!data) notFound()

  const { enduro, team, rank, validCount, totalKg, biggestKg, catches } = data

  // Même règle que la page classement : masqué au public si l'organisateur l'a désactivé.
  const currentUser = await getCurrentUser()
  const isOwner = currentUser?.id === enduro.organizerId
  if (enduro.rankingHidden && !isOwner) {
    return (
      <main style={{ maxWidth: 480, margin: '0 auto', padding: '80px 20px', textAlign: 'center' }}>
        <div style={{ fontSize: '2.6rem', marginBottom: 14 }}>🤫</div>
        <h1
          style={{
            fontFamily: 'var(--font-barlow-condensed), sans-serif',
            fontWeight: 800,
            fontSize: '1.8rem',
            color: 'var(--white)',
            margin: '0 0 10px',
          }}
        >
          Classement désactivé
        </h1>
        <p style={{ color: 'var(--dim)', fontSize: '0.95rem', lineHeight: 1.6, margin: '0 0 26px' }}>
          L’organisateur a désactivé l’affichage du classement en direct pour{' '}
          <strong style={{ color: 'var(--white)' }}>plus de suspense</strong>. Revenez plus tard !
        </p>
        <Link href={`/enduros/${enduro.slug}`} className="btn btn-primary">
          ← Retour à l’enduro
        </Link>
      </main>
    )
  }

  return (
    <main style={{ maxWidth: 860, margin: '0 auto', padding: '32px 20px 80px' }}>
      <Link
        href={`/enduros/${enduro.slug}/classement`}
        style={{ color: 'var(--dim)', textDecoration: 'none', fontSize: '0.85rem' }}
      >
        ← Retour au classement
      </Link>

      {/* En-tête équipe */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, margin: '18px 0 8px' }}>
        {rank != null && (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: 48,
              height: 48,
              padding: '0 10px',
              borderRadius: 12,
              background: rank <= 3 ? 'var(--green)' : 'rgba(255,255,255,0.06)',
              color: rank <= 3 ? '#06210f' : 'var(--white)',
              fontFamily: 'var(--font-barlow-condensed), sans-serif',
              fontWeight: 800,
              fontSize: '1.5rem',
              border: '1px solid var(--line)',
            }}
          >
            {rank}
          </span>
        )}
        <div>
          <h1
            style={{
              fontFamily: 'var(--font-barlow-condensed), sans-serif',
              fontWeight: 800,
              fontSize: '1.9rem',
              color: 'var(--white)',
              margin: 0,
              lineHeight: 1.1,
            }}
          >
            {team.name}
          </h1>
          <div style={{ color: 'var(--dim)', fontSize: '0.9rem', marginTop: 2 }}>
            {team.sectorName ? `Secteur ${team.sectorName}` : 'Sans secteur'}
            {team.pegNumber ? ` · Poste ${team.pegNumber}` : ''}
          </div>
          {team.members.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
              {team.members.map((m, i) => {
                const label = `${m.firstName} ${m.lastName}`.trim() || 'Pêcheur'
                const content = (
                  <>
                    {m.isCaptain && <span title="Capitaine">👑 </span>}
                    {label}
                  </>
                )
                return m.userId ? (
                  <Link
                    key={i}
                    href={`/pecheurs/${m.userId}`}
                    style={{
                      fontSize: '0.82rem',
                      color: 'var(--green)',
                      textDecoration: 'none',
                      border: '1px solid var(--line)',
                      borderRadius: 20,
                      padding: '3px 12px',
                    }}
                  >
                    {content} ›
                  </Link>
                ) : (
                  <span
                    key={i}
                    style={{
                      fontSize: '0.82rem',
                      color: 'var(--dim)',
                      border: '1px solid var(--line)',
                      borderRadius: 20,
                      padding: '3px 12px',
                    }}
                  >
                    {content}
                  </span>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, margin: '18px 0 28px' }}>
        {[
          [`${totalKg.toFixed(1)} kg`, 'Poids total (validé)'],
          [String(validCount), validCount > 1 ? 'Prises validées' : 'Prise validée'],
          [`${biggestKg.toFixed(1)} kg`, 'Plus grosse'],
        ].map(([val, lbl]) => (
          <div
            key={lbl}
            style={{
              flex: '1 1 140px',
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
                fontSize: '1.5rem',
                color: 'var(--green)',
              }}
            >
              {val}
            </div>
            <div style={{ color: 'var(--dim)', fontSize: '0.78rem' }}>{lbl}</div>
          </div>
        ))}
      </div>

      {/* Prises */}
      <h2
        style={{
          fontFamily: 'var(--font-barlow-condensed), sans-serif',
          fontWeight: 700,
          fontSize: '1.15rem',
          color: 'var(--white)',
          margin: '0 0 12px',
        }}
      >
        Détail des prises ({catches.length})
      </h2>

      {catches.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            color: 'var(--dim)',
            padding: '50px 20px',
            border: '1px dashed var(--line)',
            borderRadius: 12,
          }}
        >
          🎣 Aucune prise enregistrée pour cette équipe.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {catches.map((c) => {
            const st = STATUS[c.status] ?? STATUS.VALID
            return (
              <div
                key={c.id}
                style={{
                  display: 'flex',
                  gap: 14,
                  padding: 12,
                  borderRadius: 12,
                  border: '1px solid var(--line)',
                  background: 'rgba(255,255,255,0.02)',
                  opacity: c.status === 'CANCELLED' ? 0.55 : 1,
                }}
              >
                {/* Photo */}
                {c.photoUrl ? (
                  <a
                    href={c.photoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ flexShrink: 0 }}
                    aria-label="Voir la photo en grand"
                  >
                    {/* Miniature en liste ; le lien ouvre la version pleine. */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={c.photoThumbUrl ?? c.photoUrl}
                      alt={`Prise de ${c.weightKg.toFixed(1)} kg`}
                      loading="lazy"
                      style={{ width: 96, height: 96, objectFit: 'cover', borderRadius: 10, display: 'block' }}
                    />
                  </a>
                ) : (
                  <div
                    style={{
                      width: 96,
                      height: 96,
                      flexShrink: 0,
                      borderRadius: 10,
                      background: 'rgba(255,255,255,0.04)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.6rem',
                    }}
                  >
                    📷
                  </div>
                )}

                {/* Infos */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
                    <span
                      style={{
                        fontFamily: 'var(--font-barlow-condensed), sans-serif',
                        fontWeight: 800,
                        fontSize: '1.5rem',
                        color: 'var(--white)',
                      }}
                    >
                      {c.weightKg.toFixed(1)} kg
                    </span>
                    <span style={{ color: 'var(--dim)' }}>{c.speciesLabel}</span>
                    <span
                      style={{
                        marginLeft: 'auto',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        color: st.color,
                        border: `1px solid ${st.color}`,
                        borderRadius: 20,
                        padding: '2px 10px',
                      }}
                    >
                      {st.label}
                    </span>
                  </div>
                  <div style={{ color: 'var(--dim)', fontSize: '0.8rem', marginTop: 4 }}>
                    {dateTime.format(c.caughtAt)}
                    {c.commissaire ? ` · par ${c.commissaire}` : ''}
                  </div>
                  {c.note && (
                    <div style={{ color: 'var(--dim)', fontSize: '0.82rem', marginTop: 6, fontStyle: 'italic' }}>
                      « {c.note} »
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </main>
  )
}
