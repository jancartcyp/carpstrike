'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import styles from '../../dashboard.module.css'

export function SubNav({ enduroId }: { enduroId: string }) {
  const pathname = usePathname()
  const base = `/dashboard/enduros/${enduroId}`

  const items = [
    { href: base, label: 'Aperçu' },
    { href: `${base}/parametres`, label: 'Paramètres' },
    { href: `${base}/secteurs`, label: 'Secteurs' },
  ]

  return (
    <nav className={styles.subNav}>
      {items.map((it) => {
        const active = pathname === it.href
        return (
          <Link
            key={it.href}
            href={it.href}
            className={`${styles.subNavItem} ${active ? styles.active : ''}`}
          >
            {it.label}
          </Link>
        )
      })}
      <span className={`${styles.subNavItem} ${styles.disabled}`}>
        Équipes<span className={styles.subNavSoon}>bientôt</span>
      </span>
      <span className={`${styles.subNavItem} ${styles.disabled}`}>
        Commissaires<span className={styles.subNavSoon}>bientôt</span>
      </span>
      <span className={`${styles.subNavItem} ${styles.disabled}`}>
        Classement<span className={styles.subNavSoon}>bientôt</span>
      </span>
    </nav>
  )
}
