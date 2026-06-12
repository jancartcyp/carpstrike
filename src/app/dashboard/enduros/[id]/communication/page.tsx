import { notFound } from 'next/navigation'
import { requireRole } from '@/lib/auth/dal'
import { getEnduroCommunications, getOrganizerEnduro } from '@/lib/organizer'
import { PRIORITY_LABELS, RECIPIENT_LABELS } from '@/lib/validations/communication'
import styles from '../../../dashboard.module.css'
import { ComposeForm } from './compose-form'

const dateFmt = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
})

export default async function CommunicationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await requireRole('ORGANIZER')
  const enduro = await getOrganizerEnduro(id, user.id)
  if (!enduro) notFound()

  const communications = await getEnduroCommunications(enduro.id)

  return (
    <>
      <div className={styles.infoBox}>
        ◎ Composez une annonce pour vos équipes. Les annonces « à toutes les équipes » sont
        affichées sur la page publique de l’enduro.
      </div>

      <ComposeForm enduroId={enduro.id} />

      <h2 className={styles.sectionName} style={{ margin: '8px 0 12px' }}>
        Historique des annonces
      </h2>

      {communications.length === 0 ? (
        <div className={styles.empty}>Aucune annonce envoyée pour le moment.</div>
      ) : (
        <div className={styles.reqList}>
          {communications.map((c) => (
            <div key={c.id} className={styles.reqCard} style={{ gridTemplateColumns: '1fr auto' }}>
              <div>
                <div className={styles.reqTeam}>{c.subject}</div>
                <div className={styles.reqMembers} style={{ marginTop: 4, whiteSpace: 'pre-line' }}>
                  {c.body}
                </div>
                <div className={styles.reqMeta} style={{ marginTop: 6 }}>
                  {RECIPIENT_LABELS[c.recipients] ?? c.recipients} · {PRIORITY_LABELS[c.priority] ?? c.priority}{' '}
                  · {c.channels.join(', ')} · {c.sentAt ? dateFmt.format(c.sentAt) : '—'}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
