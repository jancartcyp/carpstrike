import Link from 'next/link'
import { markAllNotificationsRead } from '@/app/actions/notifications'
import { requireUser } from '@/lib/auth/dal'
import { getUserNotifications, type UserNotification } from '@/lib/notifications'

export const metadata = { title: 'Notifications — CarpStrike' }

function timeAgo(date: Date): string {
  const s = Math.floor((Date.now() - date.getTime()) / 1000)
  if (s < 60) return "à l'instant"
  const m = Math.floor(s / 60)
  if (m < 60) return `il y a ${m} min`
  const h = Math.floor(m / 60)
  if (h < 24) return `il y a ${h} h`
  const j = Math.floor(h / 24)
  if (j < 7) return `il y a ${j} j`
  return date.toLocaleDateString('fr-FR')
}

const ICON: Record<string, string> = {
  ANNOUNCEMENT: '📢',
  CATCH_VALIDATED: '🎣',
  GENERIC: '🔔',
}

function Item({ n }: { n: UserNotification }) {
  const body = (
    <div
      style={{
        display: 'flex',
        gap: 14,
        padding: '16px 18px',
        borderRadius: 12,
        border: '1px solid var(--line)',
        background: n.read ? 'rgba(255,255,255,0.02)' : 'rgba(46,160,90,0.08)',
        borderLeft: n.read ? '1px solid var(--line)' : '3px solid var(--green)',
      }}
    >
      <span style={{ fontSize: '1.4rem', lineHeight: 1 }}>{ICON[n.type] ?? ICON.GENERIC}</span>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <strong style={{ color: 'var(--white)' }}>{n.title}</strong>
          {!n.read && (
            <span
              style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--green)', display: 'inline-block' }}
              aria-label="non lue"
            />
          )}
        </div>
        <div style={{ color: 'var(--dim)', fontSize: '0.9rem', marginTop: 2 }}>{n.body}</div>
        <div style={{ color: 'var(--dim)', fontSize: '0.75rem', marginTop: 6 }}>{timeAgo(n.createdAt)}</div>
      </div>
    </div>
  )

  return n.linkUrl ? (
    <Link href={n.linkUrl} style={{ textDecoration: 'none', display: 'block' }}>
      {body}
    </Link>
  ) : (
    body
  )
}

export default async function NotificationsPage() {
  const user = await requireUser()
  const items = await getUserNotifications(user.id)
  const unread = items.filter((i) => !i.read).length

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: '48px 20px 80px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 24 }}>
        <h1
          style={{
            fontFamily: 'var(--font-barlow-condensed), sans-serif',
            fontWeight: 800,
            fontSize: '2rem',
            color: 'var(--white)',
            margin: 0,
          }}
        >
          Notifications {unread > 0 && <span style={{ color: 'var(--green)' }}>({unread})</span>}
        </h1>
        {unread > 0 && (
          <form action={markAllNotificationsRead}>
            <button type="submit" className="btn btn-ghost" style={{ fontSize: '0.8rem' }}>
              Tout marquer comme lu
            </button>
          </form>
        )}
      </div>

      {items.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            color: 'var(--dim)',
            padding: '60px 20px',
            border: '1px dashed var(--line)',
            borderRadius: 12,
          }}
        >
          🔔 Aucune notification pour le moment.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {items.map((n) => (
            <Item key={n.id} n={n} />
          ))}
        </div>
      )}
    </main>
  )
}
