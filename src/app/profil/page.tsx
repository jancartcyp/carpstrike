import type { Metadata } from 'next'
import Link from 'next/link'
import { requireRole } from '@/lib/auth/dal'
import { getFishermanProfile } from '@/lib/fisherman'
import { AvatarUploader } from './avatar-uploader'
import styles from './profil.module.css'

export const metadata: Metadata = {
  title: 'Mon profil — CarpStrike',
}

const dayMonth = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })

function rankLabel(p: { status: string; rank: number | null }) {
  if (p.rank === null) return p.status === 'DRAFT' ? 'À venir' : 'Non classé'
  const suffix = p.rank === 1 ? 'er' : 'e'
  return `${p.rank}${suffix}${p.status === 'FINISHED' ? ' (final)' : ''}`
}

export default async function ProfilPage() {
  const user = await requireRole('FISHERMAN')
  const { participations, stats } = await getFishermanProfile(user.id)
  const initials = `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase()

  const STAT_CARDS = [
    { val: String(stats.enduros), unit: '', lbl: 'Enduros', accent: 'var(--red)' },
    { val: String(stats.totalCatches), unit: '', lbl: 'Prises', accent: 'var(--blue)' },
    { val: stats.biggest.toFixed(1), unit: ' kg', lbl: 'Plus grosse', accent: 'var(--green)' },
    { val: String(stats.trophies), unit: '', lbl: 'Trophées', accent: 'var(--gold)' },
  ]

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <AvatarUploader avatarUrl={user.avatarUrl} initials={initials} />
        <div>
          <div className={styles.eyebrow}>Profil pêcheur</div>
          <div className={styles.name}>
            {user.firstName} {user.lastName}
          </div>
        </div>
      </div>

      <div className={styles.statRow}>
        {STAT_CARDS.map((s) => (
          <div key={s.lbl} className={styles.statCard} style={{ ['--accent' as string]: s.accent }}>
            <div className={styles.statVal}>
              {s.val}
              {s.unit && <span className="unit">{s.unit}</span>}
            </div>
            <div className={styles.statLbl}>{s.lbl}</div>
          </div>
        ))}
      </div>

      <h2 className={styles.sectionTitle}>
        <span className={styles.bar} />
        Mes enduros
      </h2>

      {participations.length === 0 ? (
        <div className={styles.empty}>
          Vous n’avez pas encore participé à un enduro.{' '}
          <Link href="/enduros" style={{ color: 'var(--red-bright)' }}>
            Trouver un enduro
          </Link>
        </div>
      ) : (
        <div className={styles.histList}>
          {participations.map((p) => {
            const href =
              p.status === 'FINISHED'
                ? `/enduros/${p.enduroSlug}/resultats`
                : `/enduros/${p.enduroSlug}/classement`
            return (
              <Link
                key={p.teamId}
                href={href}
                className={styles.histCard}
                style={{ ['--accent' as string]: p.isPodium ? 'var(--gold)' : 'var(--red)' }}
              >
                <div>
                  <div className={styles.histName}>{p.enduroName}</div>
                  <div className={styles.histMeta}>
                    {dayMonth.format(p.startAt)} · Équipe {p.teamName}
                    {p.sectorName ? ` · Secteur ${p.sectorName}` : ''} · {p.catches} prises
                  </div>
                </div>
                <span className={`${styles.rankBadge} ${p.isPodium ? styles.podium : ''}`}>
                  {p.isPodium ? '🏆 ' : ''}
                  {rankLabel(p)}
                </span>
                <div className={styles.histTotal}>
                  {p.total.toFixed(1)}
                  <span className="unit"> kg</span>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
