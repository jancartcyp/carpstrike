import type { Metadata } from 'next'
import Link from 'next/link'
import {
  type EnduroSortKey,
  type SearchEnduro,
  type SearchEnduroFilters,
  searchEnduros,
} from '@/lib/enduros'
import styles from './enduros.module.css'

export const metadata: Metadata = {
  title: 'Rechercher un enduro — CarpStrike',
  description:
    'Trouvez votre prochain enduro de pêche à la carpe : filtrez par lieu, dates, durée et tarif.',
}

const DURATIONS = [24, 48, 72, 96] as const

const SORT_OPTIONS: { value: EnduroSortKey; label: string }[] = [
  { value: 'date', label: '📅 Date (plus proches)' },
  { value: 'price-asc', label: '💰 Prix croissant' },
  { value: 'price-desc', label: '💰 Prix décroissant' },
  { value: 'prize-desc', label: '🏆 Dotation décroissante' },
]

const monthShort = new Intl.DateTimeFormat('fr-FR', { month: 'short' })

function toArray(v: string | string[] | undefined): string[] {
  if (v === undefined) return []
  return Array.isArray(v) ? v : [v]
}

function formatMoney(cents: number) {
  if (cents <= 0) return 'Gratuit'
  return `${Math.round(cents / 100)}`
}

function dayRange(start: Date, end: Date) {
  const s = start.getDate()
  const e = end.getDate()
  return s === e ? `${s}` : `${s}-${e}`
}

function hoursRemaining(end: Date) {
  return Math.max(0, Math.round((end.getTime() - Date.now()) / 3_600_000))
}

function EnduroCard({ e }: { e: SearchEnduro }) {
  const isLive = e.status === 'LIVE'
  const spotsLeft = Math.max(0, e.maxTeams - e.inscritsCount)
  const warn = !isLive && spotsLeft > 0 && spotsLeft <= 3

  return (
    <Link
      href={`/enduros/${e.slug}`}
      className={`${styles.enduroCard} ${isLive ? styles.live : ''}`}
    >
      <div className={styles.dateBlock}>
        <div className={styles.dateMonth}>{monthShort.format(e.startAt)}</div>
        <div className={styles.dateRange}>{dayRange(e.startAt, e.endAt)}</div>
        <div className={styles.dateYear}>{e.startAt.getFullYear()}</div>
      </div>

      <div className={styles.cardContent}>
        <div className={styles.cardHead}>
          {isLive ? (
            <span className={`${styles.statusTag} ${styles.live}`}>
              <span className={styles.dot} />
              En cours
            </span>
          ) : (
            <span className={`${styles.statusTag} ${styles.open}`}>
              <span className={styles.dot} />
              Inscriptions ouvertes
            </span>
          )}
          {e.postalCode && <span className={styles.cardRegion}>{e.postalCode}</span>}
        </div>
        <h3 className={styles.cardName}>{e.name}</h3>
        <div className={styles.cardLoc}>
          <span className={styles.icon}>📍</span>
          {e.locationName}
        </div>
        <div className={styles.cardFeatures}>
          <span className={styles.cardFeature}>
            <span className={styles.icon}>👥</span>
            {e.maxTeams} équipes
          </span>
          <span className={styles.cardFeature}>
            <span className={styles.icon}>⏱</span>
            {e.durationHours}h
          </span>
          {e.prizePool ? (
            <span className={styles.cardFeature}>
              <span className={styles.icon}>🏆</span>
              {Math.round(e.prizePool / 100)} € de dotation
            </span>
          ) : null}
        </div>
      </div>

      <div className={styles.cardSidebar}>
        {isLive ? (
          <div className={styles.cardPlaces}>{hoursRemaining(e.endAt)}h restantes</div>
        ) : spotsLeft > 0 ? (
          <div className={`${styles.cardPlaces} ${warn ? styles.warn : ''}`}>
            {warn ? (
              <>
                Plus que <strong>{spotsLeft}</strong> places
              </>
            ) : (
              <>
                <strong>{spotsLeft}</strong> places restantes
              </>
            )}
          </div>
        ) : (
          <div className={styles.cardPlaces}>Complet</div>
        )}
        <div>
          <div className={styles.cardPrice}>
            {formatMoney(e.registrationFee)}
            {e.registrationFee > 0 && <span className={styles.unit}> €</span>}
          </div>
          <div className={styles.cardPriceSub}>par équipe</div>
        </div>
        <span className={styles.cardCta}>{isLive ? 'Voir le live →' : 'Voir l’enduro →'}</span>
      </div>
    </Link>
  )
}

export default async function EndurosPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const sp = await searchParams

  const q = typeof sp.q === 'string' ? sp.q : ''
  const selectedStatuses = toArray(sp.status).filter(
    (s): s is 'LIVE' | 'PUBLISHED' => s === 'LIVE' || s === 'PUBLISHED'
  )
  const selectedDurations = toArray(sp.duration)
    .map(Number)
    .filter((n) => DURATIONS.includes(n as (typeof DURATIONS)[number]))
  const maxPriceRaw = typeof sp.maxPrice === 'string' ? Number(sp.maxPrice) : NaN
  const maxPriceEuros = Number.isFinite(maxPriceRaw) && maxPriceRaw > 0 ? maxPriceRaw : undefined
  const sort: EnduroSortKey = SORT_OPTIONS.some((o) => o.value === sp.sort)
    ? (sp.sort as EnduroSortKey)
    : 'date'

  const filters: SearchEnduroFilters = {
    q,
    statuses: selectedStatuses,
    durations: selectedDurations,
    maxPriceEuros,
    sort,
  }

  const enduros = await searchEnduros(filters)

  const hasActiveFilters =
    q.trim() !== '' ||
    selectedStatuses.length > 0 ||
    selectedDurations.length > 0 ||
    maxPriceEuros !== undefined

  return (
    <form method="get" action="/enduros">
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.heroEyebrow}>
            {enduros.length} enduro{enduros.length > 1 ? 's' : ''} référencé
            {enduros.length > 1 ? 's' : ''}
          </div>
          <h1 className={styles.heroTitle}>
            Trouvez votre prochain <span className="accent">enduro</span>
          </h1>
          <p className={styles.heroSub}>
            Filtrez par lieu, durée et tarif. Inscrivez-vous en quelques clics et rejoignez la
            communauté CarpStrike.
          </p>

          <div className={styles.searchBar}>
            <label className={styles.searchField}>
              <span className={styles.searchFieldLabel}>📍 Lieu, ville ou code postal</span>
              <input type="text" name="q" defaultValue={q} placeholder="Toute la France" />
            </label>
            <button type="submit" className={styles.searchBtn}>
              ⌕ Rechercher
            </button>
          </div>
        </div>
      </section>

      <main className={styles.main}>
        <aside className={styles.filtersSidebar}>
          <div className={styles.filtersHead}>
            <div className={styles.filtersTitle}>Filtres</div>
            <Link href="/enduros" className={styles.resetBtn}>
              Réinitialiser
            </Link>
          </div>

          <div className={styles.filterSection}>
            <div className={styles.filterSectionTitle}>Statut</div>
            <label className={styles.filterCheck}>
              <input
                type="checkbox"
                name="status"
                value="PUBLISHED"
                defaultChecked={selectedStatuses.includes('PUBLISHED')}
              />
              <span className={styles.filterCheckBox}>✓</span>
              Inscriptions ouvertes
            </label>
            <label className={styles.filterCheck}>
              <input
                type="checkbox"
                name="status"
                value="LIVE"
                defaultChecked={selectedStatuses.includes('LIVE')}
              />
              <span className={styles.filterCheckBox}>✓</span>
              En cours (live)
            </label>
          </div>

          <div className={styles.filterSection}>
            <div className={styles.filterSectionTitle}>Durée</div>
            {DURATIONS.map((d) => (
              <label key={d} className={styles.filterCheck}>
                <input
                  type="checkbox"
                  name="duration"
                  value={d}
                  defaultChecked={selectedDurations.includes(d)}
                />
                <span className={styles.filterCheckBox}>✓</span>
                {d}h
              </label>
            ))}
          </div>

          <div className={styles.filterSection}>
            <div className={styles.filterSectionTitle}>Prix maximum par équipe</div>
            <div className={styles.priceField}>
              <input
                type="number"
                name="maxPrice"
                min={0}
                step={10}
                defaultValue={maxPriceEuros ?? ''}
                placeholder="Ex. 300 €"
              />
            </div>
          </div>

          <div className={styles.filterSection}>
            <button type="submit" className={`btn btn-primary ${styles.sidebarApply}`}>
              Appliquer les filtres
            </button>
          </div>
        </aside>

        <div className={styles.resultsArea}>
          {hasActiveFilters && (
            <div className={styles.activeFilters}>
              {q.trim() && (
                <span className={styles.activeFilter}>
                  « {q.trim()} » <span className={styles.remove}>×</span>
                </span>
              )}
              {selectedStatuses.map((s) => (
                <span key={s} className={styles.activeFilter}>
                  {s === 'LIVE' ? 'En cours' : 'Inscriptions ouvertes'}{' '}
                  <span className={styles.remove}>×</span>
                </span>
              ))}
              {selectedDurations.map((d) => (
                <span key={d} className={styles.activeFilter}>
                  {d}h <span className={styles.remove}>×</span>
                </span>
              ))}
              {maxPriceEuros !== undefined && (
                <span className={styles.activeFilter}>
                  ≤ {maxPriceEuros} € <span className={styles.remove}>×</span>
                </span>
              )}
              <Link
                href="/enduros"
                className={styles.activeFilter}
                style={{ background: 'transparent' }}
              >
                Tout effacer
              </Link>
            </div>
          )}

          <div className={styles.resultsBar}>
            <div className={styles.resultsCount}>
              <span className="num">{enduros.length}</span> enduro
              {enduros.length > 1 ? 's' : ''} trouvé{enduros.length > 1 ? 's' : ''}
            </div>
            <div className={styles.sortForm}>
              {/* Tri inclus dans le formulaire principal : conserve les filtres courants. */}
              <select name="sort" defaultValue={sort} className={styles.sortSelect}>
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <button type="submit" className="btn btn-ghost" style={{ fontSize: '0.78rem' }}>
                Trier
              </button>
            </div>
          </div>

          {enduros.length === 0 ? (
            <div className={styles.empty}>
              Aucun enduro ne correspond à votre recherche. Essayez d’élargir les filtres.
            </div>
          ) : (
            <div className={styles.endurosList}>
              {enduros.map((e) => (
                <EnduroCard key={e.id} e={e} />
              ))}
            </div>
          )}
        </div>
      </main>
    </form>
  )
}
