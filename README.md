# Lokemo — Plateforme de cours en ligne payants (Cameroun)

Plateforme web permettant à des étudiants d'acheter des cours en ligne, en
payant par **Orange Money** ou **MTN Mobile Money**, avec déblocage du
téléchargement uniquement après confirmation réelle du paiement.

## Stack technique

- **Next.js 16** (React, App Router, TypeScript)
- **Tailwind CSS 4** pour le style
- **Drizzle ORM** + **PostgreSQL** (compatible **Vercel Postgres** / Neon —
  un seul compte Vercel suffit, pas besoin d'un service séparé)
- **Stockage de fichiers** : disque local en développement, **Vercel Blob**
  automatiquement en production sur Vercel (aucun changement de code requis)
- **JWT + cookies httpOnly** pour l'authentification
- **CinetPay** prévu comme agrégateur de paiement (Orange Money + MTN MoMo),
  avec un **mode simulation** activé par défaut

## Démarrage en local (sur votre ordinateur)

Il vous faut une base PostgreSQL accessible. La solution la plus simple,
même en développement, est d'utiliser directement votre base Vercel Postgres
gratuite (voir Étape 2 ci-dessous) — pas besoin d'installer PostgreSQL sur
votre machine.

```bash
npm install
# Renseignez DATABASE_URL dans .env (voir Étape 2)
npm run db:migrate
npm run create-admin -- admin@exemple.com MonMotDePasse "Mon Nom"
npm run dev
```

Rendez-vous sur `http://localhost:3000`.

---

## 🚀 Mettre la plateforme en ligne sur Vercel (guide pas à pas)

### Étape 1 — Mettre le code sur GitHub

1. Créez un compte sur [github.com](https://github.com) (gratuit).
2. Créez un nouveau dépôt (bouton "New repository"), nommez-le par exemple
   `lokemo`.
3. Envoyez ce dossier de projet dans le dépôt (via l'interface web "upload
   an existing file", ou via Git si vous êtes familier).

### Étape 2 — Importer le projet sur Vercel et créer la base de données

1. Créez un compte sur [vercel.com](https://vercel.com), connexion directe
   avec votre compte GitHub recommandée.
2. Cliquez "Add New" → "Project", puis choisissez votre dépôt `lokemo`.
3. **Ne cliquez pas encore sur Deploy.** Allez d'abord dans l'onglet
   **Storage** de votre compte Vercel (ou créez le projet d'abord, puis
   allez dans Storage depuis le projet).
4. Cliquez "Create Database" → choisissez **Postgres** (propulsé par Neon).
   Suivez les étapes ; c'est gratuit pour démarrer.
5. Une fois la base créée, connectez-la à votre projet `lokemo` (Vercel vous
   le proposera automatiquement). La variable `DATABASE_URL` est alors
   injectée automatiquement dans votre projet — vous n'avez rien à copier
   manuellement.
6. Ajoutez aussi ces variables d'environnement dans Project Settings →
   Environment Variables :

   | Nom | Valeur |
   |---|---|
   | `JWT_SECRET` | une longue chaîne aléatoire (générez-en une sur [generate-secret.vercel.app/32](https://generate-secret.vercel.app/32)) |
   | `PAYMENT_MODE` | `simulation` pour l'instant |
   | `NEXT_PUBLIC_BASE_URL` | laissez vide pour l'instant |

7. Cliquez "Deploy". Après 1 à 2 minutes, Vercel vous donne une adresse du
   type `lokemo.vercel.app` — votre site est en ligne !
8. Retournez dans Environment Variables, remplissez `NEXT_PUBLIC_BASE_URL`
   avec cette adresse (ex : `https://lokemo.vercel.app`), puis redéployez
   (Deployments → ⋯ → Redeploy).

### Étape 3 — Activer le stockage de fichiers (Vercel Blob)

1. Toujours dans l'onglet **Storage** de votre projet, cliquez
   "Create Database" → choisissez **Blob**.
2. Connectez-le à votre projet `lokemo` (la variable
   `BLOB_READ_WRITE_TOKEN` est alors injectée automatiquement).
3. Redéployez une fois (Deployments → ⋯ → Redeploy).

### Étape 4 — Créer les tables et votre compte administrateur

Sur votre ordinateur, dans le dossier du projet, créez un fichier `.env`
avec l'URL de connexion PostgreSQL que vous trouverez dans Vercel (onglet
Storage → votre base → ".env.local" ou "Connection string") :

```bash
# Dans .env :
DATABASE_URL="postgresql://...la valeur copiée depuis Vercel..."
```

Puis lancez :

```bash
npm install
npm run db:migrate
npm run create-admin -- vous@email.com VotreMotDePasse "Votre Nom"
```

### Étape 5 — Tester

Allez sur `https://lokemo.vercel.app/connexion`, connectez-vous avec le
compte créé, puis sur `/admin` pour ajouter votre premier cours. Le paiement
est en mode simulation : vous pouvez tester tout le parcours d'achat avant
d'activer les vrais paiements Mobile Money.

### Étape 6 (plus tard) — Brancher un nom de domaine personnalisé

Dans Vercel : Project Settings → Domains → ajoutez votre domaine (ex :
`lokemo.cm` ou `lokemo.com`) et suivez les instructions DNS affichées. Une
fois actif, mettez à jour `NEXT_PUBLIC_BASE_URL` avec ce nouveau domaine et
redéployez.

### Étape 7 (plus tard) — Activer les vrais paiements Orange Money / MTN MoMo

1. Créez un compte sur [cinetpay.com](https://cinetpay.com).
2. Récupérez votre `API KEY` et votre `SITE ID`.
3. Dans Vercel, ajoutez ces deux valeurs comme variables d'environnement
   (`CINETPAY_API_KEY`, `CINETPAY_SITE_ID`), changez `PAYMENT_MODE` à
   `cinetpay`, puis redéployez.
4. Dans le tableau de bord CinetPay, configurez l'URL de notification vers
   `https://votre-domaine.com/api/payments/webhook`.

---

## Ajouter des cours au quotidien

Une fois en ligne, **pas besoin de toucher au code ni de repasser par
GitHub/Vercel**. Connectez-vous simplement sur `https://votre-site.com/connexion`
avec votre compte admin, puis allez sur `/admin/cours/nouveau` pour ajouter
un cours (titre, description, prix, fichier PDF, image de couverture). Le
cours apparaît immédiatement dans le catalogue public.

## Comment fonctionne la protection des fichiers

Les fichiers de cours ne sont jamais accessibles par une URL publique
directe. Le seul chemin d'accès est la route `/api/download/[orderId]`, qui
vérifie à chaque appel que l'utilisateur est connecté, que la commande lui
appartient, et qu'elle a le statut `PAID`.

## Structure du projet

```
src/
  app/                  Pages et routes API (App Router)
    api/                Toutes les routes backend
    admin/              Espace administrateur
    cours/[slug]/       Page détail + achat d'un cours
  components/           Composants partagés (Header, Footer, CourseCard...)
  contexts/             Contexte React d'authentification
  db/                   Schéma et connexion Drizzle (PostgreSQL)
  lib/
    auth.ts             Authentification (JWT, cookies)
    payment.ts          Paiement (simulation / CinetPay)
    storage.ts          Stockage de fichiers (disque local / Vercel Blob)
    guards.ts            Protection des routes (admin / utilisateur connecté)
storage/courses/        Fichiers de cours en local (ignoré sur Vercel)
public/covers/          Images de couverture en local (ignoré sur Vercel)
scripts/create-admin.ts Script pour créer un compte administrateur
```

## Commandes utiles

```bash
npm run dev                  # serveur de développement local
npm run build && npm start   # build + serveur de production local
npm run db:generate          # générer une migration après modification du schéma
npm run db:migrate           # appliquer les migrations
npm run create-admin -- email motdepasse "Nom"   # créer/promouvoir un admin
```
