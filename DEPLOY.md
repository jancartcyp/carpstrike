# DEPLOY.md — Déploiement CarpStrike (Vercel + Supabase)

> Lancement **gratuit** : pas de Stripe ni d'emails Resend pour l'instant (différés).
> Stack : Next.js 16 (App Router) · Supabase (Postgres + Auth + Storage) · Prisma 7 · Vercel.

## 0. Pré-requis
- [ ] Compte **Vercel** relié au dépôt Git.
- [ ] Projet **Supabase** (le projet de dev peut servir au lancement de test, ou en créer un dédié « prod »).
- [ ] (Optionnel) Nom de domaine.

## 1. Variables d'environnement
Renseigner dans **Vercel → Project → Settings → Environment Variables** (Production + Preview),
d'après [`.env.example`](.env.example) :

| Variable | Source | Exposée client ? |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → API | oui |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → API | oui |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → API | **non (serveur)** |
| `DATABASE_URL` | Supabase → pooler **5432** | non |
| `COMMISSAIRE_SESSION_SECRET` | généré (`openssl rand -hex 32`) — **stable** | **non (serveur)** |

> La valeur de `COMMISSAIRE_SESSION_SECRET` utilisée en prod doit être **fixe** (la changer
> déconnecte tous les commissaires). En local elle est déjà dans `.env.local` ; en prod, créer
> une valeur dédiée dans Vercel. Si non renseignée en prod, l'app **refuse de démarrer** (fail-fast).

> ⚠️ `SUPABASE_SERVICE_ROLE_KEY` sert aussi à **signer le cookie commissaire**. Si elle change
> après déploiement, les sessions commissaires en cours sont invalidées (re-login). Garder stable.
> `DATABASE_URL` doit pointer le **pooler** (`...pooler.supabase.com:5432`), username `postgres.<ref>`.

## 2. Base de données (migrations prod)
Le client Prisma généré est committé (`src/generated/prisma`) et sans moteur natif (adapter `pg`),
donc portable. `postinstall: prisma generate` régénère quand même à l'install Vercel.

Appliquer les migrations sur la base de prod **avant/au déploiement** :
```
# en local, avec DATABASE_URL pointant la base de prod :
npx prisma migrate deploy
```
(NE PAS utiliser `migrate dev` en prod.) Migrations présentes : `init`, `commissaires_catches`.

(Optionnel) Seed de démo : `npx tsx --env-file=.env.local prisma/seed.ts` (à éviter sur une vraie prod).

## 3. Supabase Storage
- [ ] Le bucket **`catches`** (public) doit exister dans le projet Supabase utilisé.
  - Déjà créé sur le projet courant. Sur un nouveau projet : le créer (public) — soit via le
    Dashboard (Storage → New bucket → Public), soit via la service role :
    `supabase.storage.createBucket('catches', { public: true })`.

## 4. Supabase Auth
- [ ] **Authentication → URL Configuration** : ajouter l'URL de prod (Site URL + Redirect URLs),
      ex. `https://carpstrike.vercel.app` et le domaine final.
- [ ] **Confirm email** : activé = l'inscription envoie un mail de confirmation (recommandé en prod).
      Désactivé = connexion immédiate (pratique pour tester). Le code gère les deux cas.

## 5. Déploiement Vercel
- [ ] Importer le dépôt dans Vercel (framework détecté : **Next.js**, zéro config).
- [ ] Build command : défaut (`next build`) ; Install : défaut (`postinstall` régénère Prisma).
- [ ] Renseigner les variables (étape 1) puis **Deploy**.
- Le proxy/middleware (`src/proxy.ts`) tourne en runtime Node (déjà configuré).

## 6. Smoke tests post-déploiement
Vérifier sur l'URL de prod :
- [ ] `/` (accueil) et `/enduros` (recherche) s'affichent.
- [ ] Inscription **organisateur** → connexion → `/dashboard`.
- [ ] Créer un enduro (wizard) → publier → visible sur `/enduros` et `/enduros/[slug]`.
- [ ] Générer un commissaire → se connecter sur `/commissaire` → saisir une prise **avec photo** (vérifie l'upload Storage).
- [ ] La prise apparaît dans `/dashboard/.../validations` et au `/enduros/[slug]/classement`.
- [ ] Clôturer l'enduro → `/enduros/[slug]/resultats`.
- [ ] Envoyer une annonce « à tous » → visible sur la page publique de l'enduro.
- [ ] Une URL inconnue → page **404** stylée.

## 7. Domaine + HTTPS
- [ ] Vercel → Domains → ajouter le domaine, suivre la config DNS. HTTPS automatique (Let's Encrypt).
- [ ] Mettre à jour les **Redirect URLs** Supabase Auth avec le domaine final.

## 8. Différé (à activer plus tard)
- **Paiements Stripe** (frais orga + pêcheur) : clés `STRIPE_*` + mode live + webhooks.
- **Emails Resend** (validation inscription, annonces email) : `RESEND_API_KEY` + domaine vérifié.
- **Realtime** classement instantané (publication + RLS), **lancer de précision** (migration),
  **certificats PDF** (lib + Storage).
