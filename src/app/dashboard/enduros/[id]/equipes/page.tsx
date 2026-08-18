import { notFound } from 'next/navigation'
import { requireRole } from '@/lib/auth/dal'
import { isStructurallyLocked } from '@/lib/validations/enduro'
import { type EnduroTeam, getEnduroTeams, getOrganizerEnduro } from '@/lib/organizer'
import styles from '../../../dashboard.module.css'
import { AddTeamForm } from './add-team-form'
import { PegsForm } from './pegs-form'

function membersLabel(team: EnduroTeam) {
  if (team.members.length === 0) return '—'
  return team.members.map((m) => `${m.firstName} ${m.lastName}`).join(' & ')
}

export default async function EquipesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await requireRole('ORGANIZER')
  const enduro = await getOrganizerEnduro(id, user.id)
  if (!enduro) notFound()

  const teams = await getEnduroTeams(enduro.id)
  const confirmed = teams.filter((t) => t.status === 'CONFIRMED').length
  const pct = enduro.maxTeams > 0 ? Math.min(100, Math.round((confirmed / enduro.maxTeams) * 100)) : 0
  // Aligné sur le verrou serveur (addTeam/assignTeamPegs) : LIVE ou FINISHED.
  const locked = isStructurallyLocked(enduro.status)

  return (
    <>
      <div className={styles.progressCard}>
        <div className={styles.progressHead}>
          <span className={styles.progressLabel}>Équipes confirmées</span>
          <span className={styles.progressCount}>
            {confirmed}
            <span className="total">/{enduro.maxTeams}</span>
          </span>
        </div>
        <div className={styles.progressBar}>
          <div className={styles.progressFill} style={{ width: `${pct}%` }} />
        </div>
      </div>

      {enduro.mode === 'WITH_REGISTRATION' && (
        <div className={styles.infoBox}>
          💡 Cet enduro accepte les inscriptions en ligne : les équipes acceptées depuis l’onglet
          « Demandes » apparaissent ici. Vous pouvez aussi en ajouter manuellement.
        </div>
      )}

      {!locked && <AddTeamForm enduroId={enduro.id} sectors={enduro.sectors} />}

      {teams.length === 0 ? (
        <div className={styles.empty}>Aucune équipe pour le moment.</div>
      ) : (
        <PegsForm
          enduroId={enduro.id}
          sectors={enduro.sectors}
          locked={locked}
          teams={teams.map((t) => ({
            id: t.id,
            name: t.name,
            membersLabel: membersLabel(t),
            sectorId: t.sectorId,
            pegNumber: t.pegNumber,
            status: t.status,
          }))}
        />
      )}
    </>
  )
}
