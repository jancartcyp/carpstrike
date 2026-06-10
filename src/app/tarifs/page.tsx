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
    q: 'Le tarif est-il vraiment unique ?',
    a: 'Oui. Vous payez 20 € ou 50 € une seule fois, au moment de créer votre enduro. Aucun abonnement, aucun frais caché, aucune reconduction.',
  },
  {
    q: 'Prenez-vous une commission sur les inscriptions ?',
    a: 'Non, jamais. Même en formule « Avec inscriptions », vous conservez 100 % des frais d’inscription payés par les pêcheurs. CarpStrike ne se rémunère que sur le tarif de l’enduro.',
  },
  {
    q: 'C’est gratuit pour les pêcheurs ?',
    a: 'Totalement. Les pêcheurs créent un compte et s’inscrivent gratuitement. Ils ne règlent que les frais d’inscription que vous fixez pour votre enduro.',
  },
  {
    q: 'Et si j’annule mon enduro ?',
    a: 'Si vous annulez avant le début de l’enduro, les 20 € ou 50 € vous sont intégralement remboursés. La météo et les imprévus font partie du jeu.',
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
          Pas d’abonnement, pas d’engagement. Vous payez une seule fois, par enduro. Deux formules
          selon vos besoins.
        </p>
      </div>

      <div className={styles.wrap}>
        <div className={styles.freeBanner}>
          <div className={styles.freeBannerIcon}>✓</div>
          <div className={styles.freeBannerText}>
            <strong>Gratuit pour les pêcheurs · 0 % de commission.</strong> Les pêcheurs ne paient
            que leur inscription à l’enduro, fixée par vous. CarpStrike ne prélève rien dessus —
            vous gardez 100 % des frais.
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
              <span className="currency">€</span>
              <span className="amount">20</span>
              <span className="per">/ enduro</span>
            </div>
            <div className={styles.planPriceNote}>Paiement unique, à la création de l’enduro</div>
            <div className={styles.planCta}>
              <Link href="/inscription" className="btn btn-ghost">
                Choisir Gestion seule
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
              <span className="currency">€</span>
              <span className="amount">50</span>
              <span className="per">/ enduro</span>
            </div>
            <div className={styles.planPriceNote}>Paiement unique, à la création de l’enduro</div>
            <div className={styles.planCta}>
              <Link href="/inscription" className="btn btn-primary">
                Choisir Avec inscriptions
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
            Créez-le maintenant, choisissez votre formule à la fin.
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
