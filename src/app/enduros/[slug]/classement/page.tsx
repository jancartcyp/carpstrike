import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { temporalState } from '@/lib/enduro-status'
import { getEnduroRanking } from '@/lib/ranking'
import styles from './classement.module.css'
import { LiveRefresh } from './live-refresh'

const SECTOR_COLORS: Record<string, string> = {
  A: '#4a9eff',
  B: '#00c850',
  C: '#f0a500',
  D: '#b87de8',
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const data = await getEnduroRanking(slug)
  return { title: data ? `Classement live — ${data.enduro.name}` : 'Classement — CarpStrike' }
}

const PODIUM_CLASS = ['second', 'first', 'third'] as const // ordre visuel : 2 - 1 - 3

export default async function ClassementPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const data = await getEnduroRanking(slug)
  if (!data) notFound()

  const { enduro, general, sectors, stats } = data
  // Le direct dépend des dates réelles, pas du statut manuel.
  const state = temporalState(enduro.startAt, enduro.endAt)
  const isLive = state === 'live'
  // Podium réordonné visuellement : 2e, 1er, 3e.
  const podium = [stats.podium[1], stats.podium[0], stats.podium[2]]

  // Équipes groupées par secteur (pour le classement détaillé par secteur), triées par rang de secteur.
  const teamsBySector = new Map<string, typeof general>()
  for (const t of general) {
    const key = t.sectorName ?? 'Sans secteur'
    const arr = teamsBySector.get(key)
    if (arr) arr.push(t)
    else teamsBySector.set(key, [t])
  }
  for (const arr of teamsBySector.values()) arr.sort((a, b) => a.sectorRank - b.sectorRank)
  // On propose le détail par secteur seulement s'il existe au moins un vrai secteur nommé.
  const hasNamedSectors = sectors.some((s) => s.name !== 'Sans secteur')

  return (
    <div className={styles.wrap}>
      <LiveRefresh active={isLive} enduroId={enduro.id} />

      <div className={styles.head}>
        <div>
          <div className={styles.eyebrow}>
            {isLive && <span className={styles.liveDot} />}
            {isLive ? 'Classement en direct' : state === 'finished' ? 'Classement — terminé' : 'Classement — à venir'}
          </div>
          <h1 className={styles.title}>{enduro.name}</h1>
          <div className={styles.sub}>
            {enduro.locationName} · {stats.teams} équipes · {stats.totalCatches} prises
          </div>
        </div>
        {enduro.status === 'FINISHED' && (
          <Link href={`/enduros/${enduro.slug}/resultats`} className="btn btn-primary">
            🏆 Résultats finaux
          </Link>
        )}
      </div>

      {general.length === 0 ? (
        <div className={styles.empty}>
          Aucune prise validée pour le moment. Le classement s’affichera dès les premières prises.
        </div>
      ) : (
        <>
          {/* Podium */}
          <div className={styles.podium}>
            {podium.map((t, i) =>
              t ? (
                <Link
                  key={t.id}
                  href={`/enduros/${enduro.slug}/classement/${t.id}`}
                  className={`${styles.podiumCard} ${styles[PODIUM_CLASS[i]]}`}
                  style={{ textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}
                >
                  <div className={styles.podiumRank}>{t.rank}</div>
                  <div className={styles.podiumTeam}>{t.name}</div>
                  <div className={styles.podiumTotal}>
                    {t.total.toFixed(1)}
                    <span className="unit"> kg</span>
                  </div>
                  <div className={styles.podiumMeta}>
                    {t.catches} prise{t.catches > 1 ? 's' : ''}
                    {t.sectorName ? ` · Secteur ${t.sectorName}` : ''}
                  </div>
                </Link>
              ) : (
                <div key={i} />
              )
            )}
          </div>

          {/* Stats globales */}
          <div className={styles.statRow}>
            <div className={styles.statCard}>
              <div className={styles.statVal}>
                {stats.totalKg.toFixed(1)}
                <span className="unit"> kg</span>
              </div>
              <div className={styles.statLbl}>Poids total</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statVal}>{stats.totalCatches}</div>
              <div className={styles.statLbl}>Prises validées</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statVal}>{stats.teams}</div>
              <div className={styles.statLbl}>Équipes</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statVal}>
                {stats.biggestCatch ? stats.biggestCatch.weightKg.toFixed(1) : '—'}
                <span className="unit"> kg</span>
              </div>
              <div className={styles.statLbl}>
                {stats.biggestCatch ? `Record · ${stats.biggestCatch.team}` : 'Plus grosse prise'}
              </div>
            </div>
          </div>

          {/* Stats par secteur */}
          {sectors.length > 0 && (
            <>
              <h2 className={styles.sectionTitle}>
                <span className={styles.bar} />
                Par secteur
              </h2>
              <div className={styles.sectorGrid}>
                {sectors.map((s) => (
                  <div
                    key={s.name}
                    className={styles.sectorCard}
                    style={{ ['--accent' as string]: SECTOR_COLORS[s.name] ?? 'var(--red)' }}
                  >
                    <div className={styles.sectorLetter}>{s.name}</div>
                    <div className={styles.sectorTeams}>
                      {s.teams} équipe{s.teams > 1 ? 's' : ''}
                    </div>
                    <div className={styles.sectorTotal}>
                      {s.totalKg.toFixed(1)}
                      <span className="unit"> kg</span>
                    </div>
                    <div className={styles.sectorMeta}>
                      <span>{s.catches} prises</span>
                      <span className={styles.sectorLeader}>
                        {s.leader ? `👑 ${s.leader}` : '—'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Classement détaillé par secteur */}
              {hasNamedSectors && (
                <>
                  <h2 className={styles.sectionTitle}>
                    <span className={styles.bar} />
                    Classement par secteur
                  </h2>
                  {sectors.map((s) => {
                    const teams = teamsBySector.get(s.name) ?? []
                    if (teams.length === 0) return null
                    const color = SECTOR_COLORS[s.name] ?? 'var(--red)'
                    return (
                      <div key={s.name} style={{ marginBottom: 22 }}>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            margin: '0 0 10px',
                            fontFamily: 'var(--font-barlow-condensed), sans-serif',
                            fontWeight: 700,
                            fontSize: '1.05rem',
                            color: 'var(--white)',
                          }}
                        >
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: 28,
                              height: 28,
                              borderRadius: 8,
                              background: color,
                              color: '#06210f',
                              fontWeight: 800,
                            }}
                          >
                            {s.name === 'Sans secteur' ? '—' : s.name}
                          </span>
                          {s.name === 'Sans secteur' ? 'Sans secteur' : `Secteur ${s.name}`}
                          <span style={{ color: 'var(--dim)', fontWeight: 400, fontSize: '0.85rem' }}>
                            · {teams.length} équipe{teams.length > 1 ? 's' : ''}
                          </span>
                        </div>
                        <div className={styles.table}>
                          <div className={`${styles.row} ${styles.rowSix} ${styles.rowHead}`}>
                            <span>#</span>
                            <span>Équipe</span>
                            <span className={styles.hideSm} style={{ textAlign: 'center' }}>
                              Poste
                            </span>
                            <span className={styles.hideSm} style={{ textAlign: 'center' }}>
                              Prises
                            </span>
                            <span className={styles.hideSm} style={{ textAlign: 'center' }}>
                              + grosse
                            </span>
                            <span style={{ textAlign: 'right' }}>Total</span>
                          </div>
                          {teams.map((t) => (
                            <Link
                              key={t.id}
                              href={`/enduros/${enduro.slug}/classement/${t.id}`}
                              className={`${styles.row} ${styles.rowSix} ${t.sectorRank === 1 ? styles.top1 : ''}`}
                              style={{ textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}
                            >
                              <span className={styles.rankNum}>
                                {String(t.sectorRank).padStart(2, '0')}
                              </span>
                              <span>
                                <div className={styles.rowTeam}>{t.name}</div>
                                <div className={styles.rowSub}>{t.membersLabel || '—'}</div>
                              </span>
                              <span className={`${styles.cell} ${styles.hideSm}`}>
                                {t.pegNumber ?? '—'}
                              </span>
                              <span className={`${styles.cell} ${styles.hideSm}`}>{t.catches}</span>
                              <span className={`${styles.cell} ${styles.hideSm}`}>
                                {t.biggest.toFixed(1)} kg
                              </span>
                              <span className={styles.score}>
                                {t.total.toFixed(1)}
                                <span className="unit"> kg</span>
                              </span>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </>
              )}
            </>
          )}

          {/* Tableau général */}
          <h2 className={styles.sectionTitle}>
            <span className={styles.bar} />
            Classement général
          </h2>
          <div className={styles.table}>
            <div className={`${styles.row} ${styles.rowHead}`}>
              <span>#</span>
              <span>Équipe</span>
              <span className={styles.hideSm} style={{ textAlign: 'center' }}>
                Secteur
              </span>
              <span className={styles.hideSm} style={{ textAlign: 'center' }}>
                Poste
              </span>
              <span className={styles.hideSm} style={{ textAlign: 'center' }}>
                Prises
              </span>
              <span className={styles.hideSm} style={{ textAlign: 'center' }}>
                + grosse
              </span>
              <span style={{ textAlign: 'right' }}>Total</span>
            </div>
            {general.map((t) => (
              <Link
                key={t.id}
                href={`/enduros/${enduro.slug}/classement/${t.id}`}
                className={`${styles.row} ${t.rank === 1 ? styles.top1 : ''} ${t.rank <= 3 ? styles.top3 : ''}`}
                style={{ textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}
              >
                <span className={styles.rankNum}>{String(t.rank).padStart(2, '0')}</span>
                <span>
                  <div className={styles.rowTeam}>{t.name}</div>
                  <div className={styles.rowSub}>{t.membersLabel || '—'}</div>
                </span>
                <span className={`${styles.cell} ${styles.hideSm}`}>{t.sectorName ?? '—'}</span>
                <span className={`${styles.cell} ${styles.hideSm}`}>{t.pegNumber ?? '—'}</span>
                <span className={`${styles.cell} ${styles.hideSm}`}>{t.catches}</span>
                <span className={`${styles.cell} ${styles.hideSm}`}>{t.biggest.toFixed(1)} kg</span>
                <span className={styles.score}>
                  {t.total.toFixed(1)}
                  <span className="unit"> kg</span>
                </span>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
