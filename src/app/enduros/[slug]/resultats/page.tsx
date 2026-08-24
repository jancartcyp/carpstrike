import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ImageLightbox } from '@/components/image-lightbox'
import { getEnduroResults } from '@/lib/ranking'
import styles from './resultats.module.css'

const dateFmt = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const data = await getEnduroResults(slug)
  return { title: data ? `Résultats — ${data.enduro.name}` : 'Résultats — CarpStrike' }
}

export default async function ResultatsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const data = await getEnduroResults(slug)
  if (!data) notFound()

  const { enduro, general, podium, species, gallery, stats } = data
  const champion = podium[0]
  const maxSpecies = Math.max(1, ...species.map((s) => s.count))

  return (
    <div className={styles.wrap}>
      <div className={styles.hero}>
        <div className={styles.eyebrow}>🏆 Résultats officiels</div>
        <h1 className={styles.title}>{enduro.name}</h1>
        <div className={styles.sub}>
          {enduro.locationName} · {dateFmt.format(enduro.endAt)} · enduro clôturé
        </div>
      </div>

      {general.length === 0 ? (
        <div className={styles.certBlock}>Aucune prise validée — pas de classement final.</div>
      ) : (
        <>
          {/* Champion */}
          {champion && (
            <div className={styles.champion}>
              <div className={styles.championCrown}>👑</div>
              <div className={styles.championLabel}>Vainqueur</div>
              <div className={styles.championName}>{champion.name}</div>
              <div className={styles.championStats}>
                <span>
                  <strong>{champion.total.toFixed(1)}</strong>kg
                </span>
                <span>
                  <strong>{champion.catches}</strong>prises
                </span>
                <span>
                  <strong>{champion.biggest.toFixed(1)}</strong>kg (+ grosse)
                </span>
                {champion.sectorName && (
                  <span>
                    Secteur <strong>{champion.sectorName}</strong>
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Podium 2-3 */}
          {(podium[1] || podium[2]) && (
            <div className={styles.podium}>
              {[podium[1], podium[2]].map((t, i) =>
                t ? (
                  <div
                    key={t.id}
                    className={styles.podiumCard}
                    style={{ ['--accent' as string]: i === 0 ? 'var(--silver)' : 'var(--bronze)' }}
                  >
                    <span className={styles.podiumRank}>{t.rank}</span>
                    <span>
                      <div className={styles.podiumName}>{t.name}</div>
                      <div className={styles.podiumMeta}>
                        {t.catches} prises{t.sectorName ? ` · Secteur ${t.sectorName}` : ''}
                      </div>
                    </span>
                    <span className={styles.podiumTotal}>{t.total.toFixed(1)} kg</span>
                  </div>
                ) : (
                  <div key={i} />
                )
              )}
            </div>
          )}

          {/* Stats */}
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
                {stats.biggestCatch ? `Record · ${stats.biggestCatch.team}` : 'Record'}
              </div>
            </div>
          </div>

          {/* Classement final */}
          <h2 className={styles.sectionTitle}>
            <span className={styles.bar} />
            Classement final
          </h2>
          <div className={styles.table}>
            <div className={`${styles.row} ${styles.rowHead}`}>
              <span>#</span>
              <span>Équipe</span>
              <span className={styles.hideSm} style={{ textAlign: 'center' }}>
                Prises
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
                  </div>
                </span>
                <span className={`${styles.cell} ${styles.hideSm}`}>{t.catches}</span>
                <span className={styles.score}>
                  {t.total.toFixed(1)}
                  <span className="unit"> kg</span>
                </span>
              </div>
            ))}
          </div>

          {/* Espèces */}
          {species.length > 0 && (
            <>
              <h2 className={styles.sectionTitle}>
                <span className={styles.bar} />
                Répartition par espèce
              </h2>
              <div className={styles.species}>
                {species.map((s) => (
                  <div key={s.key} className={styles.speciesRow}>
                    <span className={styles.speciesName}>{s.label}</span>
                    <span className={styles.speciesBar}>
                      <span
                        className={styles.speciesFill}
                        style={{ width: `${Math.round((s.count / maxSpecies) * 100)}%` }}
                      />
                    </span>
                    <span className={styles.speciesCount}>{s.count}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Galerie */}
          {gallery.length > 0 && (
            <>
              <h2 className={styles.sectionTitle}>
                <span className={styles.bar} />
                Galerie des prises
              </h2>
              <div className={styles.gallery}>
                {gallery.map((g, i) => (
                  <ImageLightbox key={i} src={g.url} alt={`Prise de ${g.weightKg.toFixed(1)} kg — ${g.team}`}>
                    <span className={styles.galleryItem} style={{ display: 'block' }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={g.thumbUrl} alt={`Prise ${g.team}`} loading="lazy" />
                      <span className={styles.galleryCap}>{g.weightKg.toFixed(1)} kg</span>
                    </span>
                  </ImageLightbox>
                ))}
              </div>
            </>
          )}

          {/* Certificats PDF */}
          {general.length > 0 && (
            <>
              <h2 className={styles.sectionTitle}>
                <span className={styles.bar} />
                Certificats
              </h2>
              <div className={styles.certBlock} style={{ marginBottom: 14 }}>
                <span style={{ fontSize: '1.4rem' }}>📜</span>
                <span>
                  <strong>Téléchargez votre certificat.</strong> Chaque équipe dispose d’un certificat
                  de participation (ou de podium pour le top 3), généré en PDF.
                </span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {general.map((t) => (
                  <a
                    key={t.id}
                    href={`/enduros/${enduro.slug}/certificat/${t.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-ghost"
                    style={{ fontSize: '0.82rem' }}
                  >
                    {t.rank <= 3 ? '🏆 ' : '📄 '}
                    {t.rank}. {t.name}
                  </a>
                ))}
              </div>
            </>
          )}

          <div style={{ marginTop: 22 }}>
            <Link href={`/enduros/${enduro.slug}`} className="btn btn-ghost">
              ← Retour à l’enduro
            </Link>
          </div>
        </>
      )}
    </div>
  )
}
