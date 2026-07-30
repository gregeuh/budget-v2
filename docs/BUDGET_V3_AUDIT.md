# Budget V3 — rapport d'audit

Date : 30 juillet 2026
Portée : audit uniquement. Aucune logique métier, API ou interface n'a été modifiée.

## Vue d'ensemble

Budget V2 est une application Next.js 14 en App Router, pensée mobile-first et installable comme PWA. Le code d'interface est en React/JSX avec Tailwind CSS et un système de variables CSS. L'application est déjà structurée autour d'une source d'état centrale et ses règles métier sont majoritairement placées dans `lib/`, ce qui permet une refonte visuelle progressive sans changer les calculs.

Le projet n'utilise ni TypeScript ni Framer Motion. Les animations existantes sont en CSS et couvrent déjà les principales interactions. Une dépendance d'animation ne doit donc être envisagée que si une phase ne peut réellement pas être réalisée avec ces primitives.

## Architecture

| Couche | Emplacement | Responsabilité |
| --- | --- | --- |
| Routes | `app/` | Six écrans client et huit endpoints d'API. |
| Shell global | `app/layout.jsx`, `components/AppShell.jsx` | Provider, thème sans flash, PWA, safe areas, navigation, overlays. |
| État et persistance | `lib/store.jsx` | Source unique des données, mutations, synchronisation et préférences. |
| Domaine | `lib/` | Calculs de soldes, projection, budgets, recherche, catégorisation, CSV, détection, conseils et formatage. |
| Interface | `components/` | Écrans composés, feuilles, cartes, graphiques, lignes et feedback. |
| Styles | `app/globals.css`, `tailwind.config.js`, `lib/themes.js` | Tokens de thème, classes utilitaires Tailwind et animations CSS. |
| Vérification | `tests/` | Régressions métier avec Vitest. |

## Pages et parcours couverts

| Route | Rôle | Composants ou flux principaux |
| --- | --- | --- |
| `/` | Accueil | Patrimoine calculé, carrousel de comptes, projection salaire, analyses, opérations récentes, recherche. |
| `/comptes` | Comptes | Gestion des comptes, détails, crédits et mouvements associés. |
| `/transactions` | Opérations | Liste, filtres, projection, import CSV et édition. |
| `/budgets` | Budgets | Budgets de catégories, projets et progression. |
| `/conseils` | Conseils | Score santé, analyse et assistant. |
| `/reglages` | Préférences | Profil, thème, accent, données, récurrences et configuration. |

L'ajout, l'édition, la recherche, les importations et les réglages sont principalement ouverts depuis des feuilles (`Sheet`, `AddSheet`, `EditTxSheet`, `RechercheSheet`, etc.) au-dessus de ces pages.

## Composants

Les 52 composants actuels se répartissent ainsi :

- **Structure et feedback** : `AppShell`, `TabBar`, `Sheet`, `Toast`, `DrawerReglages`, `Login`, `Onboarding`, `SWRegister`, `SqueletteAccueil`, `TirerPourRafraichir`, `Confettis`.
- **Comptes et patrimoine** : `CarrouselComptes`, `MiniCarte`, `FicheCompte`, `FicheCredit`, `PatrimoineChart`, `Montant`, `Reveler`.
- **Transactions** : `TxRow`, `AddSheet`, `EditTxSheet`, `RechercheSheet`, `CategoriserSheet`, `CategoriesSheet`, `RenommerSheet`, `ImportCSV`, `Rapprochement`, `LogoCommercant`.
- **Budgets et analyses** : `MoisSelecteur`, `FicheCategorie`, `FicheProjet`, `BilanMensuel`, `Analyses`, `AnalyseDepenses`, `AuditDepenses`, `CalendrierDepenses`, `DonutCat`, `SpendChart`, `Tendances`, `ProjectionIA`, `ScoreSante`.
- **Contenu et réglages** : `ReglagesContenu`, `AssistantConfig`, `ConseilsList`, `Accroches`, `BanniereConfig`, `JournalSheet`, `Repliable`, `PremiersPas`.
- **Micro-interactions** : `CountUp`, `ChiffresRoulants`, `CocheAnimee`, `PointsSautillants`.

## Provider et frontières métier à préserver

`DataProvider` dans `lib/store.jsx` est la frontière à ne pas contourner. Il expose les données (`comptes`, `transactions`, `budgets`, `projets`, `credits`, `recurrentes`, `profil`, `soldes`, catégories) et toutes les mutations : ajout, modification et suppression de comptes, opérations, récurrences, projets et crédits ; import/fusion/annulation d'import ; virements ; sauvegarde ; rafraîchissement ; notifications et célébrations.

Les calculs réutilisés par les écrans sont concentrés dans des modules purs, notamment `lib/soldes.js`, `lib/projection.js`, `lib/conseils.js`, `lib/format.js`, `lib/score.js`, `lib/categorisation.js`, `lib/recherche.js` et `lib/csv.js`. Leur signature et leur résultat doivent rester inchangés pendant toute la roadmap.

Les endpoints existants sont uniquement des `POST` : `analyser`, `audit`, `audit-depenses`, `categoriser`, `coach`, `conseils`, `projection` et `saisie`. Ils sont hors périmètre de la refonte visuelle.

## Design System existant

Le projet possède déjà une base solide, mais les tokens sont mêlés à des commentaires et classes de composants plutôt qu'exprimés en échelle V3 claire.

- **Couleurs** : fond, surfaces, textes, séparateurs et rôles sémantiques sont définis dans `globals.css`. La couleur de marque et ses alternatives sont centralisées dans `lib/themes.js`.
- **Thème sombre** : une vraie palette sombre est déjà présente via la classe `html.sombre`, avec démarrage sans flash depuis le layout.
- **Rayons et élévations** : Tailwind expose `rounded-ios`, `rounded-pill`, `shadow-carte`, `shadow-flottant` et `shadow-bouton`.
- **Typographie** : pile système SF, classe monétaire arrondie `chiffres` et chiffres tabulaires `tnum`.
- **Mouvement** : feuilles, pages, lignes, jauges, donuts, graphiques, onglets, skeletons et feedback disposent de classes CSS. `prefers-reduced-motion` est déjà pris en charge, à compléter pour les nouvelles primitives.
- **Verre et profondeur** : les feuilles et la barre d'onglets utilisent déjà blur, transparence et ombres douces.

## Risques et garde-fous

1. **Ne pas migrer le provider ni `lib/` dans les phases UI.** Une nouvelle présentation doit consommer les mêmes valeurs et appeler les mêmes actions.
2. **Préserver les sélecteurs utilitaires employés par le code.** Par exemple, le bouton d'ajout est référencé via `data-bouton-ajout` depuis l'onboarding.
3. **Ne pas convertir le projet en TypeScript dans cette roadmap.** Cela élargirait inutilement la surface de changement ; les contrôles existants sont ESLint et Vitest.
4. **Conserver la PWA, les safe areas et le démarrage sans flash de thème.** Ce sont des éléments fonctionnels de l'expérience mobile, pas seulement du style.
5. **Éviter d'ajouter Framer Motion par défaut.** Le CSS actuel permet les transitions demandées sans dépendance supplémentaire.
6. **Valider les flux sensibles après chaque phase** : ajout/édition/suppression d'opération, virement, import CSV, budgets/projets, réglages et thème.

## Ordre d'exécution recommandé

1. **Phase 2 — fondations V3** : documenter des tokens sémantiques normalisés (surfaces, texte, espacement, rayon, élévation, mouvement, verre), puis les exposer dans Tailwind sans changer les composants.
2. **Phase 3 — shell** : `AppShell`, `TabBar` et fond global. C'est le meilleur endroit pour appliquer le nouveau rythme sans dupliquer les règles dans les pages.
3. **Phase 4 — accueil et patrimoine** : isoler une carte héros de patrimoine réutilisable, puis composer le nouveau dashboard avec les données existantes.
4. **Phases 5 à 9** : moderniser les pages par domaine, en réutilisant les primitives créées plutôt qu'en réécrivant les flux de gestion.
5. **Phases 10 et 11** : généraliser les états de chargement, vides et les interactions ; contrôler le thème sombre sur chaque primitive.
6. **Phase 12** : supprimer les redondances uniquement après avoir vérifié les écrans et les tests.

## Validation attendue avant chaque commit

```bash
npm run lint
npm test
npm run build
npm run dev
```

Le dossier initial fourni ne contenait pas de dépôt Git initialisé ; les commits de la roadmap doivent être créés depuis le dépôt officiel. Cette contrainte n'empêche ni l'audit ni les validations locales.
