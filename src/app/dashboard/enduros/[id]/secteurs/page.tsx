import { notFound } from 'next/navigation'
import { addSector, deleteSector, renameSector } from '@/app/actions/enduros'
import { requireRole } from '@/lib/auth/dal'
import { getOrganizerEnduro } from '@/lib/organizer'
import { isStructurallyLocked } from '@/lib/validations/enduro'
import styles from '../../../dashboard.module.css'

export default async function SecteursPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await requireRole('ORGANIZER')
  const enduro = await getOrganizerEnduro(id, user.id)
  if (!enduro) notFound()

  const locked = isStructurallyLocked(enduro.status)

  return (
    <div className={styles.sectionCard}>
      <div className={styles.sectionHead}>
        <div className={styles.sectionNum}>◫</div>
        <div>
          <div className={styles.sectionName}>Secteurs</div>
          <div className={styles.sectionSub}>
            {enduro.sectors.length} secteur{enduro.sectors.length > 1 ? 's' : ''} · répartition des
            équipes
          </div>
        </div>
      </div>

      <div className={styles.sectionBody}>
        {locked && (
          <div className={`${styles.infoBox} ${styles.warn}`}>
            🔒 L’enduro est en cours ou terminé : les secteurs ne sont plus modifiables.
          </div>
        )}

        {enduro.sectors.length === 0 ? (
          <p className={styles.fieldHelper}>Aucun secteur pour le moment.</p>
        ) : (
          <div className={styles.sectorList}>
            {enduro.sectors.map((s) => {
              const teamCount = s._count.teams
              const canDelete = !locked && teamCount === 0
              return (
                <div key={s.id} className={styles.sectorRow}>
                  <span
                    className={styles.sectorSwatch}
                    style={{ background: s.color ?? 'var(--red)' }}
                  />
                  {locked ? (
                    <span className={styles.sectorName}>{s.name}</span>
                  ) : (
                    <form
                      action={renameSector}
                      style={{ display: 'flex', gap: 8, alignItems: 'center', flex: 1 }}
                    >
                      <input type="hidden" name="enduroId" value={enduro.id} />
                      <input type="hidden" name="sectorId" value={s.id} />
                      <input
                        name="name"
                        defaultValue={s.name}
                        className={styles.sectorName}
                        style={{
                          background: 'transparent',
                          border: '1px solid var(--line)',
                          color: 'var(--white)',
                          padding: '4px 8px',
                          maxWidth: 160,
                        }}
                        aria-label={`Nom du secteur ${s.name}`}
                      />
                      <button type="submit" className="btn btn-ghost" style={{ fontSize: '0.7rem' }}>
                        Renommer
                      </button>
                    </form>
                  )}
                  <span className={styles.sectorTeams}>
                    {teamCount} équipe{teamCount > 1 ? 's' : ''}
                  </span>
                  {canDelete && (
                    <form action={deleteSector}>
                      <input type="hidden" name="enduroId" value={enduro.id} />
                      <input type="hidden" name="sectorId" value={s.id} />
                      <button type="submit" className={styles.btnDanger} style={{ padding: '6px 12px' }}>
                        Supprimer
                      </button>
                    </form>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {!locked && (
          <form action={addSector} className={styles.sectorAddRow}>
            <input type="hidden" name="enduroId" value={enduro.id} />
            <div className={styles.field} style={{ marginBottom: 0, flex: 1 }}>
              <label htmlFor="new-sector">Ajouter un secteur</label>
              <input id="new-sector" name="name" placeholder="Ex. E" required />
            </div>
            <button type="submit" className="btn btn-primary">
              + Ajouter
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
