# Budget v2 💶

Application de gestion de budget multi-comptes (PWA optimisée iPhone), construite avec Next.js, Tailwind CSS et Firebase. Successeur de « Mon Budget » avec des comptes façon Apple Wallet, des conseils automatiques et un coach IA.

## Ce que fait l'app

- **Multi-comptes** : compte courant, Revolut, Swile (titres-resto), Livret A, LDDS, PEA, espèces… avec suivi des plafonds réglementaires (Livret A 22 950 €, LDDS 12 000 €) et virements entre comptes.
- **Opérations « hors solde »** : une dépense ou un revenu peut être marqué 👻 hors solde — compté dans les statistiques et budgets, mais sans impact sur le solde du compte (espèces, dépense déjà couverte par un réajustement…).
- **Réajustement de solde** : depuis la fiche d'un compte, saisis le solde réel de ta banque — l'écart est enregistré comme une opération « Ajustement » neutre, exclue des statistiques de dépenses.
- **Édition d'opération** : tape n'importe quelle ligne pour modifier montant, libellé, catégorie, compte, date ou hors solde. Suppression avec bouton « Annuler » dans la confirmation.
- **Navigation par mois** : sélecteur ‹ Mois › sur l'accueil et les budgets pour consulter et comparer les mois passés.
- **Catégories personnalisées** : depuis Réglages → Catégories, crée tes propres catégories (nom, emoji, type 50/30/20) ; elles apparaissent partout (saisie, budgets, import CSV, recherche).
- **Hors-ligne** : cache Firestore persistant — l'app s'ouvre et fonctionne sans réseau, la synchro reprend automatiquement.
- **Opérations** : dépenses, revenus et virements, catégorisés selon la logique 50/30/20 (besoins / envies / épargne).
- **Budgets** : plafonds mensuels par catégorie avec jauges, et analyse 50/30/20 en temps réel.
- **Profil** : prénom, revenu mensuel, jour d'arrivée du salaire (compte à rebours et « reste à vivre » par jour sur l'accueil), choix du thème.
- **Thème clair / sombre / auto** : suit l'apparence de l'iPhone ou se force manuellement, sans flash au chargement.
- **Transactions récurrentes** : au moment d'ajouter une opération, choisis « Chaque semaine / mois / année » — elle sera créée automatiquement à chaque échéance. Gestion (pause, suppression) depuis le Profil.
- **Projets d'épargne** : objectifs avec barre de progression, échéance optionnelle et rythme mensuel calculé, contribution rapide, projet le plus avancé affiché sur l'accueil.
- **Crédits** : suivi du restant dû, mensualité, taux optionnel avec durée et date de fin estimées ; le patrimoine affiché devient un patrimoine net (crédits déduits) et le taux d'endettement est surveillé (seuil 35 %).
- **Import CSV bancaire** : détection automatique du format (séparateur, colonnes Date/Libellé/Montant ou Débit/Crédit, dates FR ou ISO, virgule décimale), catégorisation automatique par mots-clés (Carrefour → Courses, Netflix → Abonnements…), aperçu modifiable et détection des doublons avant import.
- **Conseils automatiques** : taux d'épargne, fonds d'urgence, budgets dépassés, catégories en hausse, abonnements récurrents détectés, plafond Livret A, solde Swile qui dort.
- **Coach IA** : chat qui analyse un résumé anonymisé de tes chiffres (route API côté serveur, la clé n'est jamais exposée au navigateur).
- **Onboarding** : à la première connexion, 3 écrans guidés (profil, création des comptes de départ, réflexes clés).
- **Évolution du patrimoine** : courbe sur 12 mois des soldes cumulés, avec variation affichée, sur l'accueil.
- **Recherche** : dans l'onglet Opérations, recherche instantanée par libellé ou catégorie (insensible aux accents), avec total dépensé/reçu pour le terme cherché.
- **PWA** : installable sur l'écran d'accueil iPhone, plein écran, icônes dédiées, service worker.
- **Mode démo** : sans configuration Firebase, l'app fonctionne en local (localStorage) avec des données d'exemple.

## Déploiement en 4 étapes (~15 min)

### 1. Pousser le code sur GitHub

```bash
cd budget-v2
git init
git add .
git commit -m "Budget v2"
# Crée un dépôt vide sur github.com (ex : budget-v2), puis :
git remote add origin https://github.com/TON_PSEUDO/budget-v2.git
git branch -M main
git push -u origin main
```

### 2. Déployer sur Vercel

1. Sur [vercel.com](https://vercel.com) → **Add New → Project** → importe le dépôt `budget-v2`.
2. Ne change rien (Next.js est détecté automatiquement) → **Deploy**.
3. L'app est en ligne en mode démo. ✅

### 3. Brancher Firebase (synchronisation + connexion)

Tu peux réutiliser ton projet Firebase existant de « Mon Budget » :

1. [Console Firebase](https://console.firebase.google.com) → ton projet → ⚙️ **Paramètres du projet → Tes applications** → récupère la config web (`apiKey`, `authDomain`, etc.).
2. Dans **Authentication → Sign-in method**, active **E-mail/Mot de passe** et **Google** (pour le bouton « Continuer avec Google », choisis simplement un email d'assistance quand la console le demande).
3. **Authentication → Settings → Domaines autorisés** : ajoute ton domaine Vercel (ex : `budget-v2.vercel.app`).
4. **Firestore → Règles** : l'app écrit dans `users/{uid}/…`, ces règles suffisent :

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
  }
}
```

5. Sur Vercel → ton projet → **Settings → Environment Variables**, ajoute :

| Variable | Valeur |
|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | ta apiKey |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | ton authDomain |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | ton projectId |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | ton storageBucket |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | ton messagingSenderId |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | ton appId |

6. **Deployments → ⋯ → Redeploy**. L'écran de connexion apparaît, les données sont synchronisées entre appareils.

### 4. Activer le coach IA (optionnel)

1. Crée une clé API sur [console.anthropic.com](https://console.anthropic.com).
2. Sur Vercel, ajoute la variable `ANTHROPIC_API_KEY` (sans préfixe `NEXT_PUBLIC_` — elle reste côté serveur).
3. Redéploie. Le chat de l'onglet Conseils devient actif.

Sans cette clé, les conseils automatiques fonctionnent quand même : seul le chat affiche un message d'activation.

## Installer sur iPhone

Ouvre l'URL Vercel dans **Safari** → bouton **Partager** → **« Sur l'écran d'accueil »**. L'app s'ouvre alors en plein écran, avec son icône, comme une app native.

## Développement local

```bash
npm install
npm run dev        # http://localhost:3000 (mode démo)
```

Pour tester Firebase en local : copie `.env.local.example` en `.env.local` et remplis les variables.

## Structure

```
app/            pages (accueil, comptes, transactions, budgets, conseils, réglages)
app/api/coach/  route serveur du coach IA
components/     UI (WalletStack, AddSheet, TabBar, graphiques…)
lib/            store (Firebase ou local), moteur de conseils, formats
public/         manifest PWA, service worker, icônes
```

## Idées pour la suite

Export PDF mensuel, thèmes de couleurs multiples, notifications de dépassement de budget.
