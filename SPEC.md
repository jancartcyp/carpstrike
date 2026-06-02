# SPEC.md — CarpStrike

> Spécification technique complète. Source de vérité pour le développement.
> Les 20 maquettes HTML dans `/mockups` sont la référence visuelle exacte.

---

## 1. Vision produit

CarpStrike est une application web de gestion d'**enduros de pêche à la carpe** (compétitions de longue durée, 24h à 96h, en équipes de 2 pêcheurs).

**3 types d'utilisateurs :**
- **Organisateur** — crée et pilote l'enduro de A à Z
- **Pêcheur** — découvre les enduros, s'inscrit en équipe, suit le classement
- **Commissaire** — valide les prises sur le terrain via une app mobile (pas de compte, accès par identifiants générés)

**Modèle économique :**
- Pêcheur : 100 % gratuit (paie seulement les frais d'inscription fixés par l'organisateur)
- Organisateur : tarif unique par enduro — **20 €** (gestion seule) ou **50 €** (avec inscriptions en ligne)
- CarpStrike : 0 % de commission sur les inscriptions

---

## 2. Stack technique recommandée

| Couche | Choix | Raison |
|---|---|---|
| Framework | **Next.js 15** (App Router, TypeScript) | SSR, routing, API routes intégrées |
| Base de données | **PostgreSQL** via **Supabase** | relationnel, temps réel natif (classement live), auth incluse |
| ORM | **Prisma** | typage fort, migrations |
| Auth | **Supabase Auth** | email/password, gestion sessions |
| Temps réel | **Supabase Realtime** | classement live, validations qui s'affichent en direct |
| Paiement | **Stripe** (Checkout + Connect) | CB, conformité PCI, virements |
| Stockage fichiers | **Supabase Storage** | photos de prises, certificats |
| UI | **Tailwind CSS** | les maquettes sont déjà en CSS, transposition directe |
| Hébergement | **Vercel** | déploiement Next.js natif |
| Emails | **Resend** | notifications (validation, relance paiement) |

> Stack alternative si tu préfères : Laravel + Vue + MySQL. Mais la stack ci-dessus est la plus rapide pour un solo/petit projet.

---

## 3. Modèle de données (schéma Prisma simplifié)

```
User
  id, email, passwordHash, role (ORGANIZER | FISHERMAN), firstName, lastName
  phone, avatarUrl, createdAt
  → enduros organisés (si organisateur)
  → équipes (si pêcheur, via TeamMember)

Enduro
  id, organizerId (→ User), name, slug, description
  status (DRAFT | PUBLISHED | LIVE | FINISHED | CANCELLED)
  mode (MANAGED_ONLY | WITH_REGISTRATION)   // 20€ vs 50€
  startAt, endAt, durationHours
  locationName, address, postalCode, lat, lng
  maxTeams, maxFishersPerTeam (défaut 2)
  registrationFee (frais payés par les pêcheurs, fixé par l'orga)
  prizePool, theme, rulesText
  minWeightKg (maille minimum, défaut 3.0)
  createdAt
  → sectors, teams, catches, commissaires, registrationRequests

Sector
  id, enduroId (→ Enduro), name (A, B, C, D...), color
  → teams (équipes attribuées à ce secteur)

Team
  id, enduroId (→ Enduro), name, sectorId (→ Sector, nullable)
  pegNumber (numéro de poste, nullable jusqu'à attribution)
  status (PENDING | CONFIRMED | WAITLIST | REJECTED)
  paymentStatus (NONE | AWAITING | PAID | REFUNDED)
  createdAt
  → members (TeamMember), catches

TeamMember
  id, teamId (→ Team), userId (→ User, nullable si saisie manuelle)
  firstName, lastName, email, isCaptain

RegistrationRequest
  id, enduroId, teamName, status (PENDING | APPROVED | REJECTED | PAID | EXPIRED)
  members (JSON: liste prénom/nom/email)
  requestedAt, decidedAt, paymentDeadline (decidedAt + 7 jours)
  rejectionReason (nullable)
  → devient une Team quand APPROVED puis PAID

Catch (prise)
  id, enduroId, teamId, commissaireId (→ Commissaire)
  weightKg, species (COMMUNE | MIROIR | CUIR | KOI | AMOUR_BLANC)
  photoUrl, caughtAt, status (VALID | CONTESTED | CANCELLED)
  note (nullable)

Commissaire
  id, enduroId, username (auto: initiale+nom+slug), passwordHash
  displayName, active (bool)
  // accès valable jusqu'à clôture de l'enduro par l'organisateur
  createdAt

Payment
  id, type (ORGANIZER_FEE | REGISTRATION_FEE)
  enduroId, teamId (nullable), userId
  amountCents, currency (EUR), stripeSessionId
  status (PENDING | PAID | REFUNDED), paidAt

Communication
  id, enduroId, subject, body, priority (LOW|NORMAL|HIGH)
  recipients (ALL | CONFIRMED | WAITLIST | ...), channels (EMAIL|NOTIF|SMS)
  sentAt, sentBy (→ User)
```

---

## 4. Règles métier critiques

### 4.1 Workflow d'inscription (mode WITH_REGISTRATION)
1. Pêcheur remplit une `RegistrationRequest` (équipe + membres + accepte règlement) → status `PENDING`
2. Organisateur voit la demande, l'**accepte** ou la **refuse**
   - Accepté → status `APPROVED`, `paymentDeadline = now + 7 jours`, notification envoyée, place réservée
   - Refusé → status `REJECTED` avec raison, notification envoyée
3. Pêcheur paie dans les 7 jours (Stripe) → status `PAID`, une `Team` CONFIRMED est créée
4. Si pas payé après 7 jours → status `EXPIRED`, place libérée pour la liste d'attente

> En mode MANAGED_ONLY : pas de RegistrationRequest. L'organisateur crée les `Team` manuellement.

### 4.2 Algorithme de rotation de secteurs (classement équitable)
Pour éviter qu'un secteur avantagé fausse le classement général :
1. Grouper les équipes par secteur
2. Classer les équipes **au sein de chaque secteur** par poids total décroissant
3. Construire le classement général par "tours" :
   - Tour 1 : le 1er de chaque secteur (triés entre eux par poids)
   - Tour 2 : le 2e de chaque secteur
   - etc.
4. Résultat : top N composé des meilleurs de secteurs différents

> Référence d'implémentation : voir `buildGeneralRanking()` dans `mockups/carpstrike-classement-live.html`

### 4.3 Validation des prises
- Une prise sous la maille minimum (`minWeightKg`, défaut 3 kg) est refusée à la saisie
- Le commissaire saisit : équipe, poids, espèce, photo obligatoire
- La prise s'affiche **instantanément** dans le classement live (Supabase Realtime)
- L'organisateur peut `CONTESTER` ou `ANNULER` une prise depuis son dashboard
- Le commissaire peut saisir des prises jusqu'à la **clôture officielle** par l'organisateur (période tampon ~2h après endAt)

### 4.4 Accès commissaire
- Pas de compte CarpStrike. L'organisateur génère `username` (auto: `initiale+nom.slug-enduro`) + `password` (format `XXXX-XXXX-XXXX`)
- Accès actif jusqu'à ce que l'organisateur clôture l'enduro (pas de date fixe)

### 4.5 Paiements
- **Frais organisateur** (20 ou 50 €) : payé à la création de l'enduro. Remboursé si annulation avant `startAt`.
- **Frais d'inscription** (fixés par l'orga) : payés par les pêcheurs. 0 % de commission — l'organisateur reçoit 100 % (via Stripe Connect).

### 4.6 Lancer de précision (attribution des postes)
- Optionnel, avant l'enduro. Chaque équipe fait 2 lancers (distance en cm vers une cible)
- Moyenne des 2 lancers ; classement par moyenne la plus petite
- En cas d'égalité : le plus petit lancer individuel départage
- Le classement détermine l'ordre de choix des postes

---

## 5. Liste des écrans (→ maquette de référence)

### Public
- Landing → `carpstrike-app.html`
- Recherche d'enduros (filtres) → `carpstrike-recherche.html`
- Page publique d'un enduro → `carpstrike-enduro-page.html`
- Classement live → `carpstrike-classement-live.html`
- Résultats finaux → `carpstrike-resultats.html`
- Tarifs / FAQ / Contact → `carpstrike-tarifs.html`, `-faq.html`, `-contact.html`

### Pêcheur
- Demande d'inscription → `carpstrike-inscription.html`
- Paiement → `carpstrike-paiement.html`
- Profil (stats, historique, trophées) → `carpstrike-profil-pecheur.html`

### Organisateur
- Dashboard → `carpstrike-dashboard.html`
- Demandes d'inscription → `carpstrike-demandes.html`
- Validations des prises → `carpstrike-validations.html`
- Équipes (manuel / inscriptions) → `carpstrike-equipes.html`, `-equipes-inscriptions.html`
- Lancer de précision → `carpstrike-lancer-precision.html`
- Commissaires → `carpstrike-commissaires.html`
- Communication → `carpstrike-communication.html`
- Paramètres → `carpstrike-parametres.html`

### Commissaire
- App mobile (login, saisie prise, historique) → `carpstrike-commissaire-app.html`

---

## 6. Hors périmètre v1 (à noter, pas à construire)
- Application mobile native (l'app commissaire est web responsive)
- Classement de circuit/championnat multi-enduros
- Marque blanche
- SMS (garder Email + notif in-app pour la v1)
