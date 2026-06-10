import type { Metadata } from 'next'
import Link from 'next/link'
import styles from '../marketing.module.css'

export const metadata: Metadata = {
  title: 'Tarifs — CarpStrike',
  description:
    'Tarifs organisateurs CarpStrike : un paiement unique par enduro, 0 % de commission, gratuit pour les pêcheurs.',
}

const MINI_FAQ = [
  {
    q: 'Combien ça coûte aujourd’hui ?',
    a: 'Rien. CarpStrike est entièrement gratuit pendant sa phase de lancement : créez et gérez autant d’enduros que vous voulez, sans payer. Une tarification simple (20 € ou 50 € par enduro) sera introduite plus tard, et annoncée à l’avance.',
  },
  {
    q: 'Prenez-vous une commission sur les inscriptions ?',
    a: 'Non, jamais. Vous conservez 100 % des frais d’inscription payés par les pêcheurs. CarpStrike ne se rémunérera, à terme, que sur un tarif fixe par enduro — jamais en pourcentage de vos inscriptions.',
  },
  {
    q: 'C’est gratuit pour les pêcheurs ?',
    a: 'Totalement. Les pêcheurs créent un compte et s’inscrivent gratuitement. Ils ne règlent que les frais d’inscription que vous fixez pour votre enduro.',
  },
  {
    q: 'Que se passe-t-il quand la tarification arrivera ?',
    a: 'Vous serez prévenu bien à l’avance. Les enduros déjà créés pendant la phase gratuite ne seront pas facturés rétroactivement.',
  },
]

export default function TarifsPage() {
  return (
    <>
      <div className={styles.hero} data-watermark="TARIFS">
        <div className={styles.heroEyebrow}>Tarifs organisateurs</div>
        <h1 className={styles.heroTitle}>
          Simple et <span className="accent">sans surprise</span>
        </h1>
        <p className={styles.heroSub}>
          CarpStrike est <strong>gratuit pendant son lancement</strong> : créez et gérez vos enduros
          sans rien payer, et découvrez toutes les fonctionnalités. Une tarification simple arrivera
          plus tard.
        </p>
      </div>

      <div className={styles.wrap}>
        <div className={styles.freeBanner}>
          <div className={styles.freeBannerIcon}>✓</div>
          <div className={styles.freeBannerText}>
            <strong>Offre de lancement : tout est gratuit.</strong> Profitez de l’ensemble des
            fonctionnalités sans frais pendant la phase de découverte. Les pêcheurs ne paient jamais
            de commission, et vous gardez 100 % des frais d’inscription que vous fixez.
          </div>
        </div>

        <div className={styles.plans}>
          <div className={`${styles.plan} ${styles.planBasic}`}>
            <div className={styles.planIcon}>⚐</div>
            <div className={styles.planName}>Gestion seule</div>
            <div className={styles.planTagline}>
              Vous gérez les inscriptions de votre côté. CarpStrike s’occupe du reste.
            </div>
            <div className={styles.planPrice}>
              <span className="amount">Gratuit</span>
            </div>
            <div className={styles.planPriceNote}>
              Pendant le lancement · tarif normal 20 € / enduro à terme
            </div>
            <div className={styles.planCta}>
              <Link href="/inscription" className="btn btn-ghost">
                Commencer gratuitement
              </Link>
            </div>
            <ul className={styles.planFeatures}>
              <li>
                <span className="check">✓</span> Saisie <strong>manuelle des équipes</strong>
              </li>
              <li>
                <span className="check">✓</span> Secteurs &amp; rotation de classement
              </li>
              <li>
                <span className="check">✓</span> Lancer de précision
              </li>
              <li>
                <span className="check">✓</span> Commissaires illimités + app mobile
              </li>
              <li>
                <span className="check">✓</span> Classement live public
              </li>
              <li>
                <span className="check">✓</span> Page de résultats + galerie photo
              </li>
              <li>
                <span className="check">✓</span> Certificats personnalisés
              </li>
              <li className="off">
                <span className="cross">✕</span> Inscriptions en ligne
              </li>
              <li className="off">
                <span className="cross">✕</span> Paiement intégré des pêcheurs
              </li>
            </ul>
          </div>

          <div className={`${styles.plan} ${styles.planFull}`}>
            <div className={styles.planIcon}>◉</div>
            <div className={styles.planName}>Avec inscriptions</div>
            <div className={styles.planTagline}>
              L’expérience complète : les pêcheurs s’inscrivent et paient directement sur
              CarpStrike.
            </div>
            <div className={styles.planPrice}>
              <span className="amount">Gratuit</span>
            </div>
            <div className={styles.planPriceNote}>
              Pendant le lancement · tarif normal 50 € / enduro à terme
            </div>
            <div className={styles.planCta}>
              <Link href="/inscription" className="btn btn-primary">
                Commencer gratuitement
              </Link>
            </div>
            <ul className={styles.planFeatures}>
              <li>
                <span className="check">✓</span>{' '}
                <strong>Tout ce qui est inclus en Gestion seule</strong>
              </li>
              <li>
                <span className="check">✓</span>{' '}
                <strong>Demandes d’inscription en ligne</strong>
              </li>
              <li>
                <span className="check">✓</span> Validation des équipes avant paiement
              </li>
              <li>
                <span className="check">✓</span> <strong>Paiement intégré</strong> (CB + virement)
              </li>
              <li>
                <span className="check">✓</span> Gestion liste d’attente automatique
              </li>
              <li>
                <span className="check">✓</span> Relances de paiement automatiques
              </li>
              <li>
                <span className="check">✓</span> Communication multi-canal aux équipes
              </li>
              <li>
                <span className="check">✓</span> <strong>0 % de commission</strong> sur les
                inscriptions
              </li>
            </ul>
          </div>
        </div>

        <h2 className={styles.sectionTitle}>
          Questions <span className="accent">fréquentes</span>
        </h2>
        <p className={styles.sectionSub}>Sur la tarification.</p>

        <div className={styles.faqMini}>
          {MINI_FAQ.map((item) => (
            <div key={item.q} className={styles.faqMiniItem}>
              <div className={styles.faqMiniQ}>{item.q}</div>
              <div className={styles.faqMiniA}>{item.a}</div>
            </div>
          ))}
        </div>

        <div className={styles.ctaBand}>
          <div className={styles.ctaBandTitle}>
            Prêt à lancer votre <span className="accent">enduro</span> ?
          </div>
          <div className={styles.ctaBandSub}>
            Créez-le maintenant — c’est gratuit pendant le lancement.
          </div>
          <div className={styles.ctaBandActions}>
            <Link href="/inscription" className="btn btn-primary">
              Créer mon enduro
            </Link>
            <Link href="/contact" className="btn btn-ghost">
              Une question ?
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
