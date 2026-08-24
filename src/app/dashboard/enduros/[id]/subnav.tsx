'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import styles from '../../dashboard.module.css'

export function SubNav({
  enduroId,
  mode,
  pegAssignment,
}: {
  enduroId: string
  mode: string
  pegAssignment: string
}) {
  const pathname = usePathname()
  const base = `/dashboard/enduros/${enduroId}`

  const items = [
    { href: base, label: 'Aperçu' },
    { href: `${base}/equipes`, label: 'Équipes' },
    ...(mode === 'WITH_REGISTRATION' ? [{ href: `${base}/demandes`, label: 'Demandes' }] : []),
    { href: `${base}/secteurs`, label: 'Secteurs' },
    // L'onglet « Lancer » n'a de sens que si les postes sont attribués au lancer de précision.
    ...(pegAssignment === 'PRECISION_THROW' ? [{ href: `${base}/lancer`, label: 'Lancer' }] : []),
    { href: `${base}/commissaires`, label: 'Commissaires' },
    { href: `${base}/validations`, label: 'Validations' },
    { href: `${base}/communication`, label: 'Communication' },
    { href: `${base}/parametres`, label: 'Paramètres' },
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
        Classement<span className={styles.subNavSoon}>bientôt</span>
      </span>
    </nav>
  )
}
