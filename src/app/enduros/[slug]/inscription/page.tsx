import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getEnduroForRegistration } from '@/lib/enduros'
import styles from './inscription.module.css'
import { RegistrationWizard } from './registration-wizard'

const dateFmt = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const enduro = await getEnduroForRegistration(slug)
  return { title: enduro ? `Inscription — ${enduro.name}` : 'Inscription — CarpStrike' }
}

export default async function InscriptionPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const enduro = await getEnduroForRegistration(slug)
  if (!enduro) notFound()

  const fee = enduro.registrationFee > 0 ? `${Math.round(enduro.registrationFee / 100)} €` : 'Gratuit'

  return (
    <div className={styles.page}>
      <RegistrationWizard
        enduroId={enduro.id}
        enduroSlug={enduro.slug}
        rulesText={enduro.rulesText}
      />

      <aside className={styles.summary}>
        <div className={styles.summaryCard}>
          <div className={styles.summaryHero}>
            <div className={styles.summaryCat}>● Inscriptions ouvertes</div>
            <div className={styles.summaryName}>{enduro.name}</div>
            <div className={styles.summaryMeta}>
              {dateFmt.format(enduro.startAt)} → {dateFmt.format(enduro.endAt)} · {enduro.durationHours}h
              <br />
              {enduro.locationName}
              {enduro.postalCode ? ` (${enduro.postalCode})` : ''}
            </div>
          </div>
          <div className={styles.summaryBody}>
            <div className={styles.summaryRow}>
              <span className={styles.summaryRowLabel}>Inscription équipe</span>
              <span className={styles.summaryRowValue}>{fee}</span>
            </div>
            <div className={styles.summaryRow}>
              <span className={styles.summaryRowLabel}>Frais de plateforme</span>
              <span className={styles.summaryRowValue}>Offerts</span>
            </div>
            <div className={styles.summaryRow}>
              <span className={styles.summaryRowLabel}>Pêcheurs / équipe</span>
              <span className={styles.summaryRowValue}>{enduro.maxFishersPerTeam}</span>
            </div>
            <div className={styles.summaryAvail}>
              {enduro.spotsLeft > 0 ? (
                <>
                  Plus que <strong>{enduro.spotsLeft}</strong> place
                  {enduro.spotsLeft > 1 ? 's' : ''} sur {enduro.maxTeams}
                </>
              ) : (
                <>
                  Enduro <strong>complet</strong> — votre demande pourra être placée en liste
                  d’attente.
                </>
              )}
            </div>
          </div>
        </div>
      </aside>
    </div>
  )
}
