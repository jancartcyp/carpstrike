import type { Metadata } from 'next'
import Link from 'next/link'
import styles from '../marketing.module.css'

export const metadata: Metadata = {
  title: 'FAQ — CarpStrike',
  description:
    'Questions fréquentes sur CarpStrike : inscription, organisation d’un enduro, app commissaire et fonctionnement général.',
}

type QA = { q: string; a: string }
type Group = { title: string; items: QA[] }

const GROUPS: Group[] = [
  {
    title: '🎣 Pêcheurs',
    items: [
      {
        q: 'Comment m’inscrire à un enduro ?',
        a: 'Trouvez un enduro via la recherche, puis remplissez le formulaire de demande d’inscription (équipe, pêcheurs, acceptation du règlement). Votre demande est envoyée à l’organisateur qui la valide. Une fois acceptée, vous recevez une notification pour procéder au paiement et confirmer votre place.',
      },
      {
        q: 'Pourquoi dois-je attendre une validation ?',
        a: 'Les organisateurs souhaitent garder la main sur la composition de leur enduro (équilibre des équipes, places limitées, gestion des listes d’attente). C’est pourquoi chaque demande est validée manuellement avant le paiement.',
      },
      {
        q: 'Combien de temps ai-je pour payer ?',
        a: 'Une fois votre demande validée, votre place est réservée pendant 7 jours. Vous recevez un rappel avant l’expiration. Passé ce délai sans paiement, la place est libérée pour la liste d’attente.',
      },
      {
        q: 'Comment suivre le classement en direct ?',
        a: 'Pendant l’enduro, le classement live est public et mis à jour à chaque prise validée par un commissaire. Vous y voyez le podium, votre position, les statistiques par secteur, et les plus grosses prises en temps réel.',
      },
      {
        q: 'Est-ce payant pour les pêcheurs ?',
        a: 'Non, CarpStrike est 100 % gratuit pour les pêcheurs. Vous ne réglez que les frais d’inscription à l’enduro, fixés par l’organisateur. Aucune commission n’est prélevée.',
      },
      {
        q: 'Où récupérer mon certificat de participation ?',
        a: 'À la fin de l’enduro, votre certificat personnalisé est généré automatiquement. Vous le téléchargez depuis la page de résultats ou depuis votre profil pêcheur, onglet historique.',
      },
    ],
  },
  {
    title: '⚙ Organisateurs',
    items: [
      {
        q: 'Comment créer mon premier enduro ?',
        a: 'Depuis l’accueil, cliquez sur « Organiser un enduro ». Un assistant vous guide en plusieurs étapes : infos, dates, lieu, équipes/secteurs, règles de pesée, thème, règlement, inscriptions. Vous pouvez tout modifier ensuite depuis les paramètres.',
      },
      {
        q: 'Prenez-vous une commission sur les inscriptions ?',
        a: 'Non, aucune commission. Vous conservez 100 % des frais d’inscription. CarpStrike facture seulement un tarif unique par enduro : 20 € (gestion seule) ou 50 € (avec inscriptions en ligne). Voir la page Tarifs.',
      },
      {
        q: 'Comment fonctionne la rotation de secteurs ?',
        a: 'Pour un classement équitable, l’algorithme classe d’abord les équipes au sein de chaque secteur, puis construit le classement général par « tours » : le 1er de chaque secteur, puis le 2e de chaque secteur, etc. Cela garantit qu’aucun secteur n’est avantagé par un meilleur poste.',
      },
      {
        q: 'Puis-je gérer un enduro sans inscriptions en ligne ?',
        a: 'Oui. Le mode « gestion seule » vous permet de saisir manuellement les équipes (inscriptions gérées hors plateforme) tout en profitant du classement live, des commissaires et des résultats.',
      },
      {
        q: 'Comment ajouter mes commissaires ?',
        a: 'Depuis la page Commissaires, générez un identifiant et un mot de passe uniques pour chaque commissaire. Ils accèdent ainsi à l’app mobile de validation, sans compte CarpStrike. L’accès reste actif jusqu’à la clôture de l’enduro.',
      },
      {
        q: 'Que se passe-t-il si j’annule mon enduro ?',
        a: 'Depuis les paramètres (zone de danger), vous pouvez annuler l’enduro : les pêcheurs sont notifiés automatiquement. Si l’annulation a lieu avant le début, le tarif de l’enduro (20 € ou 50 €) vous est intégralement remboursé.',
      },
    ],
  },
  {
    title: '★ Commissaires',
    items: [
      {
        q: 'Comment me connecter à l’app commissaire ?',
        a: 'L’organisateur vous transmet un identifiant et un mot de passe uniques. Saisissez-les dans l’app commissaire (sur votre téléphone). Aucun compte à créer, c’est immédiat.',
      },
      {
        q: 'Comment enregistrer une prise ?',
        a: 'Sélectionnez l’équipe, saisissez le poids, choisissez l’espèce, prenez une photo du poisson sur le tapis, puis validez. La prise apparaît instantanément dans le classement live.',
      },
      {
        q: 'Puis-je saisir une prise après la fin du décompte ?',
        a: 'Oui. Vous pouvez enregistrer les dernières pesées tant que l’organisateur n’a pas clôturé officiellement l’enduro (généralement une période tampon de 2h après la fin, pour finaliser sereinement).',
      },
      {
        q: 'Que faire si je me trompe de poids ?',
        a: 'Signalez-le à l’organisateur : depuis sa page Validations, il peut contester ou corriger une prise. Toutes les saisies sont traçables avec le nom du commissaire.',
      },
    ],
  },
  {
    title: 'ℹ Général',
    items: [
      {
        q: 'Qu’est-ce qu’un enduro carpe ?',
        a: 'Un enduro est une compétition de pêche à la carpe de longue durée (souvent 48 à 96h), où des équipes pêchent en continu depuis des postes attribués. Le classement se fait au poids cumulé des prises validées.',
      },
      {
        q: 'Sur quels appareils fonctionne CarpStrike ?',
        a: 'CarpStrike fonctionne sur ordinateur, tablette et mobile. L’app commissaire est spécialement optimisée pour le téléphone, utilisable sur le terrain même avec une connexion limitée.',
      },
      {
        q: 'Mes données sont-elles protégées ?',
        a: 'Oui. Les paiements sont chiffrés et traités par un prestataire certifié (Stripe). Vos données personnelles ne sont jamais revendues. Voir notre politique de confidentialité.',
      },
      {
        q: 'Comment contacter le support ?',
        a: 'Via la page Contact, par email à support@carpstrike.fr, ou directement depuis votre espace organisateur. Nous répondons à tous les organisateurs sous 24h ouvrées.',
      },
    ],
  },
]

export default function FaqPage() {
  return (
    <>
      <div className={styles.hero} data-watermark="FAQ">
        <div className={styles.heroEyebrow}>Centre d’aide</div>
        <h1 className={styles.heroTitle}>
          Questions <span className="accent">fréquentes</span>
        </h1>
        <p className={styles.heroSub}>
          Tout ce qu’il faut savoir sur CarpStrike, que vous soyez pêcheur, organisateur ou
          commissaire.
        </p>
      </div>

      <div className={`${styles.wrap} ${styles.wrapNarrow}`}>
        {GROUPS.map((group) => (
          <section key={group.title}>
            <h2 className={styles.faqGroupTitle}>{group.title}</h2>
            {group.items.map((item) => (
              <details key={item.q} className={styles.faq}>
                <summary className={styles.faqQ}>
                  {item.q}
                  <span className={styles.faqToggle}>+</span>
                </summary>
                <div className={styles.faqAInner}>{item.a}</div>
              </details>
            ))}
          </section>
        ))}

        <div className={styles.contactBand}>
          <div className={styles.contactBandTitle}>Vous ne trouvez pas votre réponse ?</div>
          <div className={styles.contactBandSub}>Notre équipe vous répond sous 24h.</div>
          <Link href="/contact" className="btn btn-primary">
            Contacter le support
          </Link>
        </div>
      </div>
    </>
  )
}
