# BUILD-PLAN.md — CarpStrike

> Plan de construction par phases. Faire **une phase à la fois**, dans l'ordre.
> Cocher chaque tâche une fois terminée et testée. Commit à la fin de chaque tâche.
> Voir @SPEC.md pour les détails métier et @CLAUDE.md pour les conventions.

---

## Phase 0 — Fondations (setup projet)

- [x] Initialiser Next.js 15 (TypeScript, App Router, Tailwind)
- [x] Configurer ESLint + Prettier + Vitest
- [x] Créer le projet Supabase, configurer `.env.local` (URL, clés)
- [x] Installer et configurer Prisma, connecter à Supabase
- [x] Transposer le design system des maquettes dans `tailwind.config.ts` (couleurs, polices) + `globals.css`
- [x] Créer le composant `<Logo />` à partir de `/mockups/carpstrike-logo.svg`
- [x] Mettre en place le layout de base + police (Barlow Condensed, Rajdhani, Barlow via next/font)

**Critère de fin :** `npm run dev` affiche une page d'accueil vide stylée avec le logo.

---

## Phase 1 — Modèle de données

- [x] Écrire le schéma Prisma complet (toutes les entités de @SPEC.md section 3)
- [x] Générer et appliquer la première migration
- [x] Créer des seeds de test (1 organisateur, 1 enduro LIVE avec secteurs/équipes/prises, 1 pêcheur)
- [x] Vérifier dans Prisma Studio que les relations sont correctes

**Critère de fin :** la DB est peuplée, les relations testées.

---

## Phase 2 — Authentification

- [ ] Intégrer Supabase Auth (inscription, connexion, déconnexion)
- [ ] Page de connexion + inscription (rôle ORGANIZER ou FISHERMAN)
- [ ] Middleware de protection des routes selon le rôle
- [ ] Helper `getCurrentUser()` côté serveur

**Critère de fin :** on peut créer un compte, se connecter, les routes protégées le sont.

---

## Phase 3 — Pages publiques (lecture seule)

- [ ] Landing → maquette `carpstrike-app.html`
- [ ] Recherche d'enduros avec filtres → `carpstrike-recherche.html` (données réelles depuis la DB)
- [ ] Page publique d'un enduro → `carpstrike-enduro-page.html`
- [ ] Pages Tarifs / FAQ / Contact → maquettes correspondantes (statiques)

**Critère de fin :** un visiteur peut parcourir les enduros publiés et leurs détails.

---

## Phase 4 — Espace organisateur : création & gestion d'enduro

- [ ] Assistant de création d'enduro (multi-étapes) → flow de `carpstrike-app.html`
- [ ] Choix du mode : MANAGED_ONLY (20 €) ou WITH_REGISTRATION (50 €)
- [ ] Paiement des frais organisateur via Stripe Checkout
- [ ] Dashboard organisateur → `carpstrike-dashboard.html`
- [ ] Page Paramètres (édition, sections verrouillées si LIVE, zone de danger) → `carpstrike-parametres.html`
- [ ] Gestion des secteurs

**Critère de fin :** un organisateur crée et paie un enduro, le voit dans son dashboard.

---

## Phase 5 — Équipes & inscriptions

- [ ] Mode MANAGED_ONLY : saisie manuelle des équipes → `carpstrike-equipes.html`
- [ ] Mode WITH_REGISTRATION : formulaire public de demande → `carpstrike-inscription.html`
- [ ] Page organisateur des demandes (accepter/refuser) → `carpstrike-demandes.html`
- [ ] Implémenter le workflow complet de @SPEC.md 4.1 (statuts, deadline 7j, liste d'attente)
- [ ] Page paiement pêcheur (Stripe) → `carpstrike-paiement.html`
- [ ] Emails de notification (validation, refus, relance paiement) via Resend

**Critère de fin :** le cycle demande → validation → paiement → équipe confirmée fonctionne de bout en bout.

---

## Phase 6 — Commissaires & saisie des prises

- [ ] Page organisateur de gestion des commissaires (génération identifiants) → `carpstrike-commissaires.html`
- [ ] Auth commissaire spécifique (username/password générés, pas de compte User)
- [ ] App mobile commissaire (login, saisie prise + photo, historique) → `carpstrike-commissaire-app.html`
- [ ] Upload photo vers Supabase Storage
- [ ] Validation maille minimum à la saisie (@SPEC.md 4.3)
- [ ] Page validations organisateur (contester/annuler) → `carpstrike-validations.html`

**Critère de fin :** un commissaire se connecte et enregistre une prise avec photo.

---

## Phase 7 — Classement live (temps réel)

- [ ] Implémenter l'algo de rotation de secteurs (@SPEC.md 4.2, réf. JS dans la maquette)
- [ ] Page classement live publique → `carpstrike-classement-live.html`
- [ ] Abonnement Supabase Realtime sur les `Catch` (mise à jour instantanée)
- [ ] Stats par secteur, podium, plus grosses prises

**Critère de fin :** une prise saisie par un commissaire apparaît en direct dans le classement public.

---

## Phase 8 — Lancer de précision & résultats

- [ ] Module lancer de précision → `carpstrike-lancer-precision.html` (@SPEC.md 4.6)
- [ ] Clôture officielle de l'enduro par l'organisateur
- [ ] Page résultats finaux → `carpstrike-resultats.html`
- [ ] Génération des certificats PDF (stockés dans Supabase Storage)
- [ ] Profil pêcheur (stats, historique, trophées) → `carpstrike-profil-pecheur.html`

**Critère de fin :** un enduro peut être clôturé, les résultats et certificats sont générés.

---

## Phase 9 — Communication & finitions

- [ ] Centre de communication organisateur → `carpstrike-communication.html`
- [ ] Envoi multi-destinataires (email + notif in-app)
- [ ] Responsive mobile sur toutes les pages
- [ ] Gestion des erreurs, états de chargement, pages 404/500
- [ ] Tests end-to-end des parcours critiques (inscription, paiement, saisie prise)

**Critère de fin :** l'app est complète, testée, prête pour un déploiement de test.

---

## Phase 10 — Déploiement

- [ ] Configurer Vercel + variables d'environnement de production
- [ ] Configurer Stripe en mode live
- [ ] Migrations DB de production
- [ ] Tests de fumée en production
- [ ] Domaine + HTTPS

**Critère de fin :** CarpStrike est en ligne et fonctionnel.

---

## Conseils d'exécution avec Claude Code

1. **Une session = une phase** (ou une grosse tâche). Utiliser `/clear` entre les phases.
2. Démarrer chaque phase en **Plan Mode** : demander un plan détaillé avant de coder.
3. Compacter le contexte (`/compact`) quand il dépasse ~70 %.
4. À chaque erreur récurrente de Claude, **ajouter une règle dans CLAUDE.md** (compound engineering).
5. Garder la maquette HTML de l'écran en cours ouverte comme référence.
6. Commit fréquent, un commit par tâche cochée.
