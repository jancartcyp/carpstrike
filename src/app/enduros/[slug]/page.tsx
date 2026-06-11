import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { type EnduroDetail, getEnduroBySlug } from '@/lib/enduros'
import { Countdown } from './countdown'
import styles from './enduro.module.css'

const longDate = new Intl.DateTimeFormat('fr-FR', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
})
const shortMonth = new Intl.DateTimeFormat('fr-FR', { month: 'short' })

function formatEuros(cents: number | null | undefined) {
  if (!cents || cents <= 0) return null
  return Math.round(cents / 100).toLocaleString('fr-FR')
}

function shortRange(start: Date, end: Date) {
  const sameMonth = start.getMonth() === end.getMonth()
  return sameMonth
    ? `${start.getDate()}-${end.getDate()} ${shortMonth.format(end)}`
    : `${start.getDate()} ${shortMonth.format(start)} – ${end.getDate()} ${shortMonth.format(end)}`
}

const MODE_LABEL: Record<EnduroDetail['mode'], string> = {
  WITH_REGISTRATION: 'Inscription en ligne',
  MANAGED_ONLY: 'Sur invitation',
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const enduro = await getEnduroBySlug(slug)
  if (!enduro) return { title: 'Enduro introuvable — CarpStrike' }
  return {
    title: `${enduro.name} — CarpStrike`,
    description:
      enduro.description ??
      `Enduro de pêche à la carpe à ${enduro.locationName}. ${enduro.durationHours}h de compétition.`,
  }
}

export default async function EnduroPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const enduro = await getEnduroBySlug(slug)

  if (!enduro) notFound()

  const isLive = enduro.status === 'LIVE'
  const priceEuros = formatEuros(enduro.registrationFee)
  const prizeEuros = formatEuros(enduro.prizePool)
  const fillPct = enduro.maxTeams > 0 ? Math.round((enduro.confirmedTeams / enduro.maxTeams) * 100) : 0
  const organizerName = `${enduro.organizer.firstName} ${enduro.organizer.lastName}`
  const mapsHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${enduro.locationName} ${enduro.postalCode ?? ''}`.trim()
  )}`

  return (
    <div className={styles.page}>
      {/* ═══════ HERO ═══════ */}
      <section className={styles.hero}>
        <div className={styles.heroBg} />
        <div className={styles.heroGlow} />
        <div className={styles.heroWatermark}>{enduro.locationName}</div>

        <div className={styles.heroContent}>
          <div>
            <div className={styles.heroMeta}>
              {isLive ? (
                <span className={styles.metaPill}>
                  <span className={styles.dot} />
                  En direct
                </span>
              ) : (
                <span className={styles.metaPill}>
                  <span className={styles.dot} />
                  Inscriptions ouvertes
                </span>
              )}
              <span className={styles.metaTag}>{enduro.durationHours}h</span>
              <span className={styles.metaTag}>Édition {enduro.startAt.getFullYear()}</span>
            </div>

            <div className={styles.heroEyebrow}>Organisé par {organizerName}</div>

            <h1 className={styles.heroTitle}>
              {enduro.name.split(' ').slice(0, -1).join(' ')}{' '}
              <span className="accent">{enduro.name.split(' ').slice(-1)}</span>
            </h1>

            {enduro.description && <p className={styles.heroSubtitle}>{enduro.description}</p>}

            <div className={styles.heroActions}>
              {!isLive && enduro.mode === 'WITH_REGISTRATION' && (
                <Link href={`/enduros/${enduro.slug}/inscription`} className="btn btn-primary btn-large">
                  S’inscrire{priceEuros ? ` — ${priceEuros} €` : ''}
                </Link>
              )}
              {isLive && (
                <Link href={`/classements`} className="btn btn-primary btn-large">
                  Suivre le classement →
                </Link>
              )}
              <a href="#reglement" className="btn btn-ghost btn-large">
                Voir le règlement
              </a>
            </div>
          </div>

          {/* Info card */}
          <aside className={styles.infoCard}>
            {isLive ? (
              <div className={styles.countdownStarted}>Enduro en cours</div>
            ) : (
              <>
                <div className={styles.countdownLabel}>Début de l’enduro dans</div>
                <Countdown targetIso={enduro.startAt.toISOString()} />
              </>
            )}

            <div className={styles.infoDivider} />

            <div className={styles.infoStats}>
              <div className={styles.infoStat}>
                <div className={styles.infoStatIcon}>📅</div>
                <div>
                  <div className={styles.infoStatVal}>
                    {shortRange(enduro.startAt, enduro.endAt)}
                  </div>
                  <div className={styles.infoStatLbl}>Dates</div>
                </div>
              </div>
              <div className={styles.infoStat}>
                <div className={styles.infoStatIcon}>⏱</div>
                <div>
                  <div className={styles.infoStatVal}>{enduro.durationHours}h</div>
                  <div className={styles.infoStatLbl}>Durée</div>
                </div>
              </div>
              <div className={styles.infoStat}>
                <div className={styles.infoStatIcon}>👥</div>
                <div>
                  <div className={styles.infoStatVal}>{enduro.maxTeams} équipes</div>
                  <div className={styles.infoStatLbl}>
                    Binômes · {enduro.maxFishersPerTeam} pêcheurs
                  </div>
                </div>
              </div>
              <div className={styles.infoStat}>
                <div className={styles.infoStatIcon}>🏆</div>
                <div>
                  <div className={styles.infoStatVal}>{prizeEuros ? `${prizeEuros} €` : '—'}</div>
                  <div className={styles.infoStatLbl}>Dotation</div>
                </div>
              </div>
            </div>

            <div className={styles.infoProgress}>
              <div className={styles.progressHead}>
                <div className={styles.progressLabel}>Inscriptions</div>
                <div className={styles.progressVal}>
                  {enduro.confirmedTeams} / {enduro.maxTeams} équipes
                </div>
              </div>
              <div className={styles.progressBar}>
                <div className={styles.progressFill} style={{ width: `${fillPct}%` }} />
              </div>
            </div>

            {!isLive && enduro.mode === 'WITH_REGISTRATION' ? (
              <Link href={`/enduros/${enduro.slug}/inscription`} className={`btn btn-primary ${styles.infoCta}`}>
                Réserver mon binôme →
              </Link>
            ) : (
              <Link href={`/classements`} className={`btn btn-primary ${styles.infoCta}`}>
                {isLive ? 'Voir le classement live →' : 'Voir l’enduro →'}
              </Link>
            )}
          </aside>
        </div>
      </section>

      {/* ═══════ DÉTAILS ═══════ */}
      <section className={styles.section} id="details">
        <div className={styles.sectionEyebrow}>Toutes les infos pratiques</div>
        <h2 className={styles.sectionTitle}>
          Détails de <span className="accent">l’enduro</span>
        </h2>

        <div className={styles.details}>
          <div className={styles.detailsCol}>
            <h3>
              <span className={styles.bar} />
              Format &amp; règles
            </h3>
            <ul className={styles.detailList}>
              <li className={styles.detailRow}>
                <div className={styles.detailLabel}>Durée</div>
                <div className={styles.detailValue}>
                  <strong>{enduro.durationHours}h</strong> en continu
                </div>
              </li>
              <li className={styles.detailRow}>
                <div className={styles.detailLabel}>Équipes</div>
                <div className={styles.detailValue}>
                  <strong>{enduro.maxTeams}</strong> max ·{' '}
                  {enduro.maxFishersPerTeam} pêcheurs / équipe
                </div>
              </li>
              <li className={styles.detailRow}>
                <div className={styles.detailLabel}>Secteurs</div>
                <div className={styles.detailValue}>
                  {enduro.sectors.length > 0 ? (
                    <>
                      <strong>{enduro.sectors.length}</strong> (
                      {enduro.sectors.map((s) => s.name).join(', ')})
                    </>
                  ) : (
                    'À définir'
                  )}
                </div>
              </li>
              <li className={styles.detailRow}>
                <div className={styles.detailLabel}>Maille mini</div>
                <div className={styles.detailValue}>
                  <strong>{enduro.minWeightKg} kg</strong> minimum
                </div>
              </li>
              <li className={styles.detailRow}>
                <div className={styles.detailLabel}>Inscription</div>
                <div className={styles.detailValue}>{MODE_LABEL[enduro.mode]}</div>
              </li>
              {enduro.theme && (
                <li className={styles.detailRow}>
                  <div className={styles.detailLabel}>Thème</div>
                  <div className={styles.detailValue}>{enduro.theme}</div>
                </li>
              )}
            </ul>
          </div>

          <div>
            <div className={styles.priceBlock}>
              <div className={styles.priceEyebrow}>Inscription par équipe</div>
              <div className={styles.priceAmount}>
                {priceEuros ?? 'Gratuit'}
                {priceEuros && <span className={styles.currency}>€</span>}
              </div>
              <div className={styles.priceDetail}>
                Tarif par binôme · Paiement sécurisé en ligne
              </div>
              <ul className={styles.priceIncludes}>
                <li>
                  <span className={styles.check}>✓</span> Pêche {enduro.durationHours}h sur le plan
                  d’eau
                </li>
                <li>
                  <span className={styles.check}>✓</span> Suivi live des classements
                </li>
                <li>
                  <span className={styles.check}>✓</span> Validation des prises par commissaires
                </li>
                <li>
                  <span className={styles.check}>✓</span> Trophée pour les podiums
                </li>
              </ul>
              {!isLive && enduro.mode === 'WITH_REGISTRATION' ? (
                <Link href={`/enduros/${enduro.slug}/inscription`} className={`btn btn-primary ${styles.priceCta}`}>
                  Réserver maintenant →
                </Link>
              ) : (
                <Link href="/enduros" className={`btn btn-ghost ${styles.priceCta}`}>
                  Voir les autres enduros
                </Link>
              )}
            </div>
          </div>
        </div>

        {prizeEuros && (
          <div className={styles.prizeCard}>
            <div>
              <div className={styles.prizeAmount}>{prizeEuros} €</div>
              <div className={styles.prizeLabel}>de dotation</div>
            </div>
            <p className={styles.prizeNote}>
              Répartition des prix (podium, grosse prise, meilleur secteur…) définie par
              l’organisateur. Détails communiqués aux équipes confirmées.
            </p>
          </div>
        )}
      </section>

      {/* ═══════ RÈGLEMENT ═══════ */}
      {enduro.rulesText && (
        <section className={styles.section} id="reglement">
          <div className={styles.sectionEyebrow}>À lire avant inscription</div>
          <h2 className={styles.sectionTitle}>
            Règlement <span className="accent">officiel</span>
          </h2>
          <div className={styles.reglementBox}>
            <div className={styles.reglementContent}>{enduro.rulesText}</div>
          </div>
        </section>
      )}

      {/* ═══════ LIEU ═══════ */}
      <section className={styles.section} id="location">
        <div className={styles.sectionEyebrow}>Comment nous trouver</div>
        <h2 className={styles.sectionTitle}>
          Le <span className="accent">spot</span>
        </h2>

        <div className={styles.locationGrid}>
          <div className={styles.mapPlaceholder}>
            <div className={styles.mapMarker} />
            {enduro.lat != null && enduro.lng != null && (
              <div className={styles.mapCoords}>
                {enduro.lat.toFixed(4)}° N · {enduro.lng.toFixed(4)}° E
              </div>
            )}
          </div>
          <div>
            <h3 className={styles.locationName}>{enduro.locationName}</h3>
            <div className={styles.locationAddress}>
              {[enduro.address, enduro.postalCode].filter(Boolean).join(' · ') ||
                'Adresse communiquée aux inscrits'}
            </div>
            <ul className={styles.detailList}>
              <li className={styles.detailRow}>
                <div className={styles.detailLabel}>Dates</div>
                <div className={styles.detailValue}>
                  Du {longDate.format(enduro.startAt)} au {longDate.format(enduro.endAt)}
                </div>
              </li>
              <li className={styles.detailRow}>
                <div className={styles.detailLabel}>Code postal</div>
                <div className={styles.detailValue}>{enduro.postalCode ?? '—'}</div>
              </li>
            </ul>
            <div className={styles.locationActions}>
              <a href={mapsHref} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                Voir l’itinéraire
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ CTA FINAL ═══════ */}
      <section className={styles.finalCta}>
        <div className={styles.finalCtaContent}>
          <div className={styles.sectionEyebrow} style={{ justifyContent: 'center' }}>
            {isLive
              ? 'Compétition en cours'
              : enduro.spotsLeft > 0
                ? `Plus que ${enduro.spotsLeft} place${enduro.spotsLeft > 1 ? 's' : ''} disponible${enduro.spotsLeft > 1 ? 's' : ''}`
                : 'Complet'}
          </div>
          <h2>
            Rejoignez l’enduro <span className="accent">{enduro.startAt.getFullYear()}</span>
          </h2>
          <p>
            {enduro.confirmedTeams} équipe{enduro.confirmedTeams > 1 ? 's' : ''} déjà confirmée
            {enduro.confirmedTeams > 1 ? 's' : ''} sur {enduro.maxTeams}.
          </p>
          <div className={styles.finalCtaActions}>
            {!isLive && enduro.mode === 'WITH_REGISTRATION' && enduro.spotsLeft > 0 ? (
              <Link href={`/enduros/${enduro.slug}/inscription`} className="btn btn-primary btn-large">
                S’inscrire{priceEuros ? ` — ${priceEuros} €` : ''}
              </Link>
            ) : (
              <Link href="/enduros" className="btn btn-primary btn-large">
                Découvrir d’autres enduros
              </Link>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
