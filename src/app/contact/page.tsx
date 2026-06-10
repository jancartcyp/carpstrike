import type { Metadata } from 'next'
import styles from '../marketing.module.css'
import { ContactForm } from './contact-form'

export const metadata: Metadata = {
  title: 'Contact & À propos — CarpStrike',
  description:
    'Une question sur CarpStrike ? Contactez notre équipe. Organisateur, pêcheur ou curieux, on vous répond sous 24h.',
}

const CONTACTS = [
  {
    icon: '✉️',
    label: 'Email général',
    email: 'contact@carpstrike.fr',
    sub: 'Réponse sous 24h ouvrées',
  },
  {
    icon: '🛠️',
    label: 'Support technique',
    email: 'support@carpstrike.fr',
    sub: 'Réponse sous 24h pour tous les organisateurs',
  },
  {
    icon: '🤝',
    label: 'Partenariats',
    email: 'pro@carpstrike.fr',
    sub: 'Fédérations, clubs, sponsors',
  },
]

const STATS = [
  { val: '247', lbl: 'Enduros référencés' },
  { val: '5 800+', lbl: 'Pêcheurs inscrits' },
  { val: '0 %', lbl: 'Commission' },
  { val: '24h', lbl: 'Délai de réponse' },
]

export default function ContactPage() {
  return (
    <>
      <div className={styles.hero} data-watermark="CONTACT">
        <div className={styles.heroEyebrow}>On vous écoute</div>
        <h1 className={styles.heroTitle}>
          Une question ? <span className="accent">Parlons-en</span>
        </h1>
        <p className={styles.heroSub}>
          Organisateur, pêcheur ou simple curieux : notre équipe de passionnés vous répond sous
          24h.
        </p>
      </div>

      <div className={`${styles.wrap} ${styles.wrapWide}`}>
        <div className={styles.layout}>
          <ContactForm />

          <div className={styles.contactSide}>
            {CONTACTS.map((c) => (
              <div key={c.email} className={styles.contactItem}>
                <div className={styles.contactItemIcon}>{c.icon}</div>
                <div className={styles.contactItemLabel}>{c.label}</div>
                <div className={styles.contactItemValue}>
                  <a href={`mailto:${c.email}`}>{c.email}</a>
                </div>
                <div className={styles.contactItemSub}>{c.sub}</div>
              </div>
            ))}
            <div className={styles.contactItem}>
              <div className={styles.contactItemIcon}>📍</div>
              <div className={styles.contactItemLabel}>Basés en France</div>
              <div className={styles.contactItemValue}>Sud-Ouest</div>
              <div className={styles.contactItemSub}>Au cœur des spots à carpes</div>
            </div>
          </div>
        </div>

        <div className={styles.about}>
          <div className={styles.aboutEyebrow}>Notre histoire</div>
          <h2 className={styles.aboutTitle}>
            Né d’une frustration au bord de <span className="accent">l’eau</span>
          </h2>
          <div className={styles.aboutText}>
            <p>
              CarpStrike est né d’un constat simple : organiser un enduro carpe, c’est un
              casse-tête. Tableurs Excel, groupes WhatsApp dans tous les sens, classements
              recalculés à la main à 3h du matin, pêcheurs qui ne savent pas où ils en sont…{' '}
              <strong>On a vécu ça, et on en avait marre.</strong>
            </p>
            <p>
              Alors on a construit l’outil qu’on aurait voulu avoir : une plateforme qui gère{' '}
              <strong>tout le cycle d’un enduro</strong>, de l’inscription jusqu’au certificat de
              victoire, en passant par la validation des prises en temps réel par les commissaires
              et le classement live que tout le monde peut suivre.
            </p>
            <p>
              Notre mission : que les organisateurs se concentrent sur{' '}
              <strong>la passion et la convivialité</strong>, pas sur la paperasse. Et que chaque
              pêcheur vive son enduro à fond, en sachant exactement où il en est.
            </p>
          </div>

          <div className={styles.statsRow}>
            {STATS.map((s) => (
              <div key={s.lbl} className={styles.stat}>
                <div className={styles.statVal}>{s.val}</div>
                <div className={styles.statLbl}>{s.lbl}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
