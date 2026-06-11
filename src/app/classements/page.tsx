import type { Metadata } from 'next'
import Link from 'next/link'
import { getLiveEnduros } from '@/lib/enduros'

export const metadata: Metadata = {
  title: 'Classements en direct — CarpStrike',
  description: 'Suivez les classements live des enduros de pêche à la carpe en cours.',
}

const dayMonth = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' })

export default async function ClassementsPage() {
  const live = await getLiveEnduros()

  return (
    <section className="section">
      <div className="section-head">
        <div className="section-titles">
          <div className="section-eyebrow">
            <div className="status-dot" style={{ background: 'var(--red)' }} />
            En direct
          </div>
          <h1 className="section-title">
            Classements <span style={{ color: 'var(--red)' }}>live</span>
          </h1>
        </div>
      </div>

      <div className="enduros-grid">
        {live.length === 0 && (
          <div className="empty-state">
            Aucun enduro en direct pour le moment.{' '}
            <Link href="/enduros" style={{ color: 'var(--red-bright)' }}>
              Voir les enduros à venir
            </Link>
          </div>
        )}
        {live.map((e) => (
          <Link key={e.id} href={`/enduros/${e.slug}/classement`} className="enduro">
            <div className="enduro-top">
              <div className="enduro-status status-live">
                <div className="status-dot" />
                Classement live
              </div>
              <div className="enduro-cat">{e.durationHours}h</div>
            </div>
            <div className="enduro-body">
              <div className="enduro-title">{e.name}</div>
              <div className="enduro-meta">
                <span>📍 {e.locationName}</span>
                <span>
                  📅 {dayMonth.format(e.startAt)} – {dayMonth.format(e.endAt)}
                </span>
              </div>
              <div className="enduro-stats">
                <div>
                  <div className="enduro-stat-val red">{e.teamsCount}</div>
                  <div className="enduro-stat-lbl">Équipes</div>
                </div>
                <div>
                  <div className="enduro-stat-val">{e.catchesCount}</div>
                  <div className="enduro-stat-lbl">Prises</div>
                </div>
                <div>
                  <div className="enduro-stat-val">
                    {e.leaderKg.toFixed(1)}
                    <span style={{ fontSize: '0.7rem', color: 'var(--dim)' }}>kg</span>
                  </div>
                  <div className="enduro-stat-lbl">Leader</div>
                </div>
              </div>
              <div className="enduro-cta">Voir le classement</div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
