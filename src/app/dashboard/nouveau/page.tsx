import type { Metadata } from 'next'
import Link from 'next/link'
import { requireRole } from '@/lib/auth/dal'
import styles from '../dashboard.module.css'
import { CreateWizard } from './create-wizard'

export const metadata: Metadata = {
  title: 'Créer un enduro — CarpStrike',
}

export default async function NouvelEnduroPage() {
  await requireRole('ORGANIZER')

  return (
    <div className={styles.wrap}>
      <div className={styles.breadcrumb}>
        <Link href="/dashboard">Mes enduros</Link>
        <span className={styles.sep}>/</span>
        <span className={styles.current}>Nouvel enduro</span>
      </div>

      <div className={styles.pageHead}>
        <div>
          <div className={styles.pageEyebrow}>Assistant de création</div>
          <h1 className={styles.pageTitle}>
            Créer un <span className="accent">enduro</span>
          </h1>
        </div>
      </div>

      <CreateWizard />
    </div>
  )
}
