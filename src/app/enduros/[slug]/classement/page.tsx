import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
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
  const isLive = enduro.status === 'LIVE'
  // Podium réordonné visuellement : 2e, 1er, 3e.
  const podium = [stats.podium[1], stats.podium[0], stats.podium[2]]

  return (
    <div className={styles.wrap}>
      <LiveRefresh active={isLive} />

      <div className={styles.head}>
        <div>
          <div className={styles.eyebrow}>
            {isLive && <span className={styles.liveDot} />}
            {isLive ? 'Classement en direct' : 'Classement'}
          </div>
          <h1 className={styles.title}>{enduro.name}</h1>
          <div className={styles.sub}>
            {enduro.locationName} · {stats.teams} équipes · {stats.totalCatches} prises
          </div>
        </div>
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
                <div key={t.id} className={`${styles.podiumCard} ${styles[PODIUM_CLASS[i]]}`}>
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
                </div>
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
                Prises
              </span>
              <span className={styles.hideSm} style={{ textAlign: 'center' }}>
                + grosse
              </span>
              <span style={{ textAlign: 'right' }}>Total</span>
            </div>
            {general.map((t) => (
              <div
                key={t.id}
                className={`${styles.row} ${t.rank === 1 ? styles.top1 : ''} ${t.rank <= 3 ? styles.top3 : ''}`}
              >
                <span className={styles.rankNum}>{String(t.rank).padStart(2, '0')}</span>
                <span>
                  <div className={styles.rowTeam}>{t.name}</div>
                  <div className={styles.rowSub}>
                    {t.sectorName ? `Secteur ${t.sectorName}` : 'Sans secteur'}
                    {t.pegNumber ? ` · Poste ${t.pegNumber}` : ''}
                  </div>
                </span>
                <span className={`${styles.cell} ${styles.hideSm}`}>{t.sectorName ?? '—'}</span>
                <span className={`${styles.cell} ${styles.hideSm}`}>{t.catches}</span>
                <span className={`${styles.cell} ${styles.hideSm}`}>{t.biggest.toFixed(1)} kg</span>
                <span className={styles.score}>
                  {t.total.toFixed(1)}
                  <span className="unit"> kg</span>
                </span>
              </div>
            ))}
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
            </>
          )}
        </>
      )}
    </div>
  )
}
