import { notFound } from 'next/navigation'
import { requireRole } from '@/lib/auth/dal'
import { getEnduroTeams, getOrganizerEnduro } from '@/lib/organizer'
import { computePrecisionRanking } from '@/lib/precision'
import styles from '../../../dashboard.module.css'
import { PrecisionForms } from './precision-forms'

export default async function LancerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await requireRole('ORGANIZER')
  const enduro = await getOrganizerEnduro(id, user.id)
  if (!enduro) notFound()

  // Seules les équipes confirmées participent au lancer de précision.
  const confirmed = (await getEnduroTeams(enduro.id))
    .filter((t) => t.status === 'CONFIRMED')
    .map((t) => ({
      id: t.id,
      name: t.name,
      sectorName: t.sector?.name ?? null,
      throw1Cm: t.throw1Cm,
      throw2Cm: t.throw2Cm,
    }))

  const ranking = computePrecisionRanking(confirmed)
  // L'enduro clôturé/annulé verrouille la saisie.
  const locked = enduro.status === 'FINISHED' || enduro.status === 'CANCELLED'

  return (
    <>
      <div className={styles.infoBox}>
        🎯 <strong>Lancer de précision</strong> — chaque équipe effectue 2 lancers (distance à la cible,
        en centimètres). Le classement se fait par <strong>moyenne la plus faible</strong> ; en cas
        d’égalité, le plus petit lancer départage. Il détermine l’<strong>ordre de choix des postes</strong>.
      </div>

      {confirmed.length === 0 ? (
        <div className={styles.empty}>
          Aucune équipe confirmée pour le moment. Confirmez des équipes pour saisir leurs lancers.
        </div>
      ) : (
        <>
          <h2 className={styles.blockTitle} style={{ marginTop: 8 }}>
            Ordre de choix des postes
          </h2>
          {ranking.length === 0 ? (
            <div className={styles.empty}>
              Saisissez les 2 lancers d’au moins une équipe pour afficher le classement.
            </div>
          ) : (
            <div className={styles.reqList} style={{ marginBottom: 8 }}>
              {ranking.map((r) => (
                <div key={r.id} className={styles.teamRow}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span className={styles.rankBadge}>{r.rank}</span>
                    <div>
                      <div className={styles.teamName}>{r.name}</div>
                      <div className={styles.teamMembers}>
                        {r.sectorName ? `Secteur ${r.sectorName}` : 'Sans secteur'}
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', fontSize: '0.8rem' }}>
                    <div>
                      Moyenne <strong>{r.averageCm} cm</strong>
                    </div>
                    <div style={{ color: 'var(--dim)' }}>meilleur {r.bestCm} cm</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <h2 className={styles.blockTitle} style={{ marginTop: 16 }}>
            Saisie des lancers (cm)
          </h2>
          <PrecisionForms enduroId={enduro.id} teams={confirmed} locked={locked} />
        </>
      )}
    </>
  )
}
