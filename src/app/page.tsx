import Link from 'next/link'
import { getLiveEnduros, getUpcomingEnduros } from '@/lib/enduros'

const dayMonth = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' })

function formatRange(start: Date, end: Date) {
  return `${dayMonth.format(start)} – ${dayMonth.format(end)}`
}

function hoursRemaining(end: Date) {
  const h = Math.max(0, Math.round((end.getTime() - Date.now()) / 3_600_000))
  return h
}

function formatMoney(cents: number) {
  const euros = Math.round(cents / 100)
  if (euros >= 1000) {
    const k = euros / 1000
    return `${Number.isInteger(k) ? k : k.toFixed(1)}K€`
  }
  return `${euros}€`
}

export default async function Home() {
  const [live, upcoming] = await Promise.all([getLiveEnduros(), getUpcomingEnduros()])

  return (
    <>
      {/* ═══════ HERO ═══════ */}
      <section className="hero">
        <div className="hero-bg-text">CARPSTRIKE</div>
        <div className="hero-content">
          <div>
            <div className="hero-eyebrow">
              <div className="live-dot" />
              {live.length > 0
                ? `${live.length} enduro${live.length > 1 ? 's' : ''} en direct maintenant`
                : 'La pêche à la carpe en compétition'}
            </div>
            <h1 className="hero-title">
              L&apos;enduro carpe
              <br />
              en <span className="accent">live</span>, sans temps mort.
            </h1>
            <p className="hero-desc">
              Suivez les classements minute par minute. Organisez vos compétitions, validez les
              prises sur le terrain, partagez les résultats avec votre communauté — tout au même
              endroit.
            </p>
            <div className="hero-actions">
              <Link href="/enduros" className="btn btn-primary btn-large">
                Voir les enduros live
              </Link>
              <Link href="/faq" className="btn btn-ghost btn-large">
                Comment ça marche
              </Link>
            </div>
          </div>

          {/* CARTE ORGANISATEUR */}
          <div className="organize-card">
            <div className="organize-badge">Organisateurs</div>
            <div className="organize-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <h3 className="organize-title">
              Organisez
              <br />
              votre <span className="accent">enduro</span>
            </h3>
            <p className="organize-desc">
              Créez votre compétition, gérez les équipes, attribuez les secteurs et suivez les
              prises en temps réel. Tout est centralisé.
            </p>
            <ul className="organize-features">
              <li>
                <span className="check">✓</span> Gestion complète des inscriptions
              </li>
              <li>
                <span className="check">✓</span> Validation des prises par commissaires
              </li>
              <li>
                <span className="check">✓</span> Classements live partagés en un clic
              </li>
              <li>
                <span className="check">✓</span> Statistiques et records automatiques
              </li>
            </ul>
            <Link href="/inscription" className="btn btn-primary btn-block organize-btn">
              Organiser un enduro
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════ ENDUROS EN DIRECT ═══════ */}
      <section className="section" id="live">
        <div className="section-head">
          <div className="section-titles">
            <div className="section-eyebrow">
              <div className="status-dot" style={{ background: 'var(--red)' }} />
              En ce moment
            </div>
            <h2 className="section-title">
              Enduros <span style={{ color: 'var(--red)' }}>en direct</span>
            </h2>
          </div>
        </div>

        <div className="enduros-grid">
          {live.length === 0 && (
            <div className="empty-state">Aucun enduro en direct pour le moment.</div>
          )}
          {live.map((e) => (
            <Link key={e.id} href={`/enduros/${e.slug}`} className="enduro">
              <div className="enduro-top">
                <div className="enduro-status status-live">
                  <div className="status-dot" />
                  Live · {hoursRemaining(e.endAt)}h restant
                </div>
                <div className="enduro-cat">{e.durationHours}h</div>
              </div>
              <div className="enduro-body">
                <div className="enduro-title">{e.name}</div>
                <div className="enduro-meta">
                  <span>📍 {e.locationName}</span>
                  <span>📅 {formatRange(e.startAt, e.endAt)}</span>
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
                <div className="enduro-cta">Suivre en direct</div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ═══════ ENDUROS À VENIR ═══════ */}
      <section className="section" id="upcoming">
        <div className="section-head">
          <div className="section-titles">
            <div className="section-eyebrow">Prochaines compétitions</div>
            <h2 className="section-title">
              Enduros <span style={{ color: 'var(--red)' }}>à venir</span>
            </h2>
          </div>
        </div>

        <div className="enduros-grid">
          {upcoming.length === 0 && (
            <div className="empty-state">Aucun enduro à venir publié pour le moment.</div>
          )}
          {upcoming.map((e) => (
            <Link key={e.id} href={`/enduros/${e.slug}`} className="enduro">
              <div className="enduro-top">
                <div className="enduro-status status-open">
                  <div className="status-dot" />
                  Inscriptions ouvertes
                </div>
                <div className="enduro-cat">{e.durationHours}h</div>
              </div>
              <div className="enduro-body">
                <div className="enduro-title">{e.name}</div>
                <div className="enduro-meta">
                  <span>📍 {e.locationName}</span>
                  <span>📅 {formatRange(e.startAt, e.endAt)}</span>
                </div>
                <div className="enduro-stats">
                  <div>
                    <div className="enduro-stat-val red">
                      {e.inscritsCount}
                      <span style={{ fontSize: '0.7rem', color: 'var(--dim)' }}>
                        /{e.maxTeams}
                      </span>
                    </div>
                    <div className="enduro-stat-lbl">Inscrits</div>
                  </div>
                  <div>
                    <div className="enduro-stat-val">{formatMoney(e.registrationFee)}</div>
                    <div className="enduro-stat-lbl">Inscription</div>
                  </div>
                  <div>
                    <div className="enduro-stat-val">
                      {e.prizePool ? formatMoney(e.prizePool) : '—'}
                    </div>
                    <div className="enduro-stat-lbl">Dotation</div>
                  </div>
                </div>
                <div className="enduro-cta">S&apos;inscrire</div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </>
  )
}
