import { notFound } from 'next/navigation'
import { deleteCommissaire, toggleCommissaire } from '@/app/actions/commissaires'
import { requireRole } from '@/lib/auth/dal'
import { getEnduroCommissaires, getOrganizerEnduro } from '@/lib/organizer'
import styles from '../../../dashboard.module.css'
import { CreateCommissaire, RegenButton } from './commissaire-manager'

export default async function CommissairesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await requireRole('ORGANIZER')
  const enduro = await getOrganizerEnduro(id, user.id)
  if (!enduro) notFound()

  const commissaires = await getEnduroCommissaires(enduro.id)
  const activeCount = commissaires.filter((c) => c.active).length

  return (
    <>
      <div className={styles.infoBox}>
        ★ Les commissaires se connectent sur <strong>/commissaire</strong> avec les identifiants
        générés ici (sans compte CarpStrike). Ils peuvent saisir des prises tant que l’enduro n’est
        pas clôturé.
      </div>

      <div className={styles.statGrid}>
        <div className={`${styles.statCard} ${styles.statGreen}`}>
          <div className={styles.statVal}>{activeCount}</div>
          <div className={styles.statLbl}>Commissaires actifs</div>
        </div>
        <div className={`${styles.statCard} ${styles.statBlue}`}>
          <div className={styles.statVal}>
            {commissaires.reduce((s, c) => s + c._count.catches, 0)}
          </div>
          <div className={styles.statLbl}>Prises saisies</div>
        </div>
      </div>

      <CreateCommissaire enduroId={enduro.id} />

      {commissaires.length === 0 ? (
        <div className={styles.empty}>Aucun commissaire. Générez un premier accès ci-dessus.</div>
      ) : (
        <div className={styles.reqList}>
          {commissaires.map((c) => (
            <div key={c.id} className={styles.teamRow}>
              <div>
                <div className={styles.teamName}>{c.displayName}</div>
                <div className={styles.teamMembers}>
                  <code>{c.username}</code> · {c._count.catches} prise
                  {c._count.catches > 1 ? 's' : ''}
                </div>
              </div>

              <span
                className={`${styles.miniPill} ${c.active ? styles.pillConfirmed : styles.pillRejected}`}
              >
                {c.active ? 'Actif' : 'Désactivé'}
              </span>

              <RegenButton commissaireId={c.id} />

              <span style={{ display: 'inline-flex', gap: 6 }}>
                <form action={toggleCommissaire}>
                  <input type="hidden" name="commissaireId" value={c.id} />
                  <button type="submit" className="btn btn-ghost" style={{ fontSize: '0.7rem' }}>
                    {c.active ? 'Désactiver' : 'Réactiver'}
                  </button>
                </form>
                {c._count.catches === 0 && (
                  <form action={deleteCommissaire}>
                    <input type="hidden" name="commissaireId" value={c.id} />
                    <button type="submit" className={styles.btnDanger} style={{ padding: '6px 12px' }}>
                      Suppr.
                    </button>
                  </form>
                )}
              </span>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
