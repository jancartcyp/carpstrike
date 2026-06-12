import Link from 'next/link'
import { notFound } from 'next/navigation'
import { publishEnduro, setEnduroLive } from '@/app/actions/enduros'
import { requireRole } from '@/lib/auth/dal'
import { getOrganizerEnduro } from '@/lib/organizer'
import styles from '../../dashboard.module.css'

function formatEuros(cents: number | null) {
  if (!cents || cents <= 0) return 'Gratuit'
  return `${Math.round(cents / 100)} €`
}

export default async function EnduroOverviewPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const user = await requireRole('ORGANIZER')
  const enduro = await getOrganizerEnduro(id, user.id)
  if (!enduro) notFound()

  const isPublic = ['PUBLISHED', 'LIVE', 'FINISHED'].includes(enduro.status)
  const modeLabel =
    enduro.mode === 'WITH_REGISTRATION' ? 'Inscriptions en ligne' : 'Gestion seule'

  return (
    <>
      <div className={styles.kpiGrid}>
        <div className={styles.kpi}>
          <div className={styles.kpiValue}>
            {enduro._count.teams}
            <span className="unit">/{enduro.maxTeams}</span>
          </div>
          <div className={styles.kpiLabel}>Équipes</div>
        </div>
        <div className={styles.kpi}>
          <div className={styles.kpiValue}>{enduro.sectors.length}</div>
          <div className={styles.kpiLabel}>Secteurs</div>
        </div>
        <div className={styles.kpi}>
          <div className={styles.kpiValue}>
            {enduro.minWeightKg}
            <span className="unit"> kg</span>
          </div>
          <div className={styles.kpiLabel}>Maille mini</div>
        </div>
        <div className={styles.kpi}>
          <div className={styles.kpiValue} style={{ fontSize: '1.4rem' }}>
            {formatEuros(enduro.prizePool)}
          </div>
          <div className={styles.kpiLabel}>Dotation</div>
        </div>
      </div>

      {/* Actions de cycle de vie */}
      <div className={styles.sectionCard}>
        <div className={styles.sectionHead}>
          <div className={styles.sectionNum}>▸</div>
          <div>
            <div className={styles.sectionName}>État & publication</div>
            <div className={styles.sectionSub}>
              Mode : {modeLabel} · Inscription : {formatEuros(enduro.registrationFee)}
            </div>
          </div>
        </div>
        <div className={styles.sectionBody}>
          {enduro.status === 'DRAFT' && (
            <div className={styles.infoBox}>
              💡 Cet enduro est en <strong>brouillon</strong> : il n’est pas encore visible du
              public. Publiez-le pour qu’il apparaisse dans la recherche et sur sa page publique.
            </div>
          )}
          {enduro.status === 'CANCELLED' && (
            <div className={`${styles.infoBox} ${styles.danger}`}>
              Cet enduro est <strong>annulé</strong>.
            </div>
          )}
          {enduro.status === 'FINISHED' && (
            <div className={styles.infoBox}>
              Cet enduro est <strong>terminé</strong>. Le classement est figé.
            </div>
          )}

          <div className={styles.headerActions} style={{ marginTop: 0 }}>
            {enduro.status === 'DRAFT' && (
              <form action={publishEnduro}>
                <input type="hidden" name="enduroId" value={enduro.id} />
                <button type="submit" className="btn btn-primary">
                  Publier l’enduro
                </button>
              </form>
            )}
            {enduro.status === 'PUBLISHED' && (
              <form action={setEnduroLive}>
                <input type="hidden" name="enduroId" value={enduro.id} />
                <button type="submit" className="btn btn-primary">
                  Passer en direct (LIVE)
                </button>
              </form>
            )}
            {isPublic && (
              <Link href={`/enduros/${enduro.slug}`} className="btn btn-ghost">
                Voir la page publique →
              </Link>
            )}
            {(enduro.status === 'LIVE' || enduro.status === 'FINISHED') && (
              <Link href={`/enduros/${enduro.slug}/classement`} className="btn btn-ghost">
                Classement
              </Link>
            )}
            {enduro.status === 'FINISHED' && (
              <Link href={`/enduros/${enduro.slug}/resultats`} className="btn btn-ghost">
                🏆 Résultats
              </Link>
            )}
            <Link href={`/dashboard/enduros/${enduro.id}/parametres`} className="btn btn-ghost">
              Paramètres
            </Link>
            <Link href={`/dashboard/enduros/${enduro.id}/secteurs`} className="btn btn-ghost">
              Gérer les secteurs
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
