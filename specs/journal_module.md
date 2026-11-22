# Module Journal (réseau social personnel)

## 1. Objet

Fil de micro-blogging privé : l'utilisateur publie des posts Markdown courts (humeur, lieu, tags, médias), les épingle ou les enregistre, retrouve ses souvenirs « ce jour-là » et ajoute des **suites** (fils de mise à jour) à un post existant. Un onglet **Privé** regroupe les posts protégés par le code secret du journal.

Le module est isolé **fonctionnellement** (ses propres tags, ses médias, ses routes `/api/journal/*`), mais son code suit les conventions du projet : entités dans `App\Entity`, repositories dans `App\Repository`, services dans `App\Service`, contrôleurs dans `App\Controller`, DTO dans `App\Dto\Journal`.

## 2. Règles métier (`RG-JRN-*`)

| Règle | Énoncé |
|---|---|
| RG-JRN-01 | Un post a un contenu Markdown (20 000 caractères max) **ou** au moins un média. Un post sans texte garde toujours au moins un média. |
| RG-JRN-02 | Un post racine (`parent` nul) peut recevoir des **suites** ; une suite ne peut pas avoir de suite (un seul niveau). |
| RG-JRN-03 | Une suite hérite toujours de la confidentialité de son post racine ; basculer un post en privé/public bascule ses suites. La confidentialité se règle uniquement sur le post racine. |
| RG-JRN-04 | Feed, Souvenirs, Enregistrés et Tags sont accessibles **sans code**. Ils ne montrent que des posts publics (`is_private = false`). |
| RG-JRN-05 | **Si la protection est active** (code secret défini **et** `user.journalLockEnabled = true`), tout ce qui concerne un post privé (lecture de l'onglet Privé, création, modification, bascule, suppression, médias) exige l'en-tête `X-JOURNAL-AUTH` valide, sinon **403**. Sans protection active, l'en-tête n'est pas demandé. |
| RG-JRN-14 | La protection est **désactivée par défaut**. Elle s'active / se désactive dans *Mon profil → onglet Journal* (`PUT /api/account/journal-lock`) ; l'activer exige un code défini, la désactiver exige le code actuel. Sans protection active, l'onglet Privé affiche un bandeau avec un lien vers ce réglage. |
| RG-JRN-06 | Les listes ne renvoient que les posts racines, triés épinglés d'abord (`is_pinned DESC`) puis du plus récent au plus ancien. Les suites sont incluses dans leur post (`replies`, ordre chronologique). |
| RG-JRN-07 | **Souvenirs** : posts racines publics créés le même jour et le même mois que la date courante, lors d'une année antérieure. |
| RG-JRN-08 | Filtres cumulables sur toutes les listes : `?tag=<slug>` (tag du journal) et `?q=<texte>` (contenu du post **ou** de ses suites). |
| RG-JRN-09 | Les tags du journal (`JournalTag`) sont propres au journal, indépendants des tags des tâches. Nom unique par utilisateur (via le slug) ; plusieurs tags peuvent partager une couleur. |
| RG-JRN-10 | Le compteur de posts d'un tag ne compte que les posts publics, sauf si le code secret est fourni. |
| RG-JRN-11 | Suppression d'un post : fichiers physiques du post et de ses suites supprimés, puis suppression en cascade. Supprimer un tag le retire des posts sans supprimer les posts. |
| RG-JRN-12 | Médias acceptés : images, audio et vidéo (50 Mo max), stockés dans `public/uploads/journal/<userId>/`. |
| RG-JRN-13 | Protection active : l'onglet Privé se reverrouille après 90 s hors focus (`useJournalAutoLock`) ou via le bouton **Verrouiller** ; un 403 de l'API reverrouille aussi. |

## 3. Modèle de données

Détail complet (colonnes, index, diagramme) : [data_model.md](data_model.md#5-entités-métier).

| Entité | Table | Rôle |
|---|---|---|
| `JournalPost` (hérite de `AbstractTextEntry`) | `journal_post` | Post ou suite : `content` (FULLTEXT), `mood`, `color`, `is_pinned`, `is_bookmarked`, `is_private`, `owner`, `parent`/`replies`, `location`, `tags`, `medias` |
| `JournalTag` | `journal_tag` | Tag du journal : `name`, `slug` (unique par `owner`), `color` |
| `journal_post_tag` | — | Jointure ManyToMany post ↔ tag |
| `JournalMedia` (hérite de `AbstractFile`) | `journal_media` | Média d'un post |
| `JournalLocation` | `journal_location` | Lieu (coordonnées, rue, ville, pays) |

Sérialisation : groupes `journal_post.list` / `journal_post.read` (+ `file.read` pour les médias, `MaxDepth(1)` sur `replies`), `journal_tag.read`. Les champs du post sont exposés en snake_case (`is_pinned`, `created_at`, `parent_id`…).

## 4. API

Toutes les routes exigent le JWT. `X-JOURNAL-AUTH: <jCodeToken>` n'est exigé que pour le contenu privé (RG-JRN-05).

### 4.1 Code secret

| Méthode | Route | Description |
|---|---|---|
| `PUT` | `/api/account/journal-passcode` | Définir / modifier le code secret (module Compte) |
| `GET` | `/api/account/journal-passcode/status` | `{ hasPasscode, lockEnabled, lockActive }` |
| `PUT` | `/api/account/journal-lock` | `{ enabled, passcode? (base64) }` : activer / désactiver la protection (RG-JRN-14) |
| `POST` | `/api/journal/unlock` | `{ passcode }` → `{ jCodeToken }` (403 si incorrect) |

### 4.2 Posts — `/api/journal/posts`

| Méthode | Route | Description |
|---|---|---|
| `GET` | `/api/journal/posts?tab=feed\|memories\|bookmarks\|private&tag=&q=` | Posts racines de l'onglet (défaut `feed`). `private` sans code → 403. |
| `GET` | `/api/journal/posts/counts` | Compteurs `{ feed, memories, bookmarks[, private] }` (badges ; `private` seulement avec le code) |
| `POST` | `/api/journal/posts` | JSON ou multipart : `content`, `mood?`, `color?`, `tagIds[]?`, `location?` (objet ou JSON), `parentId?`, `isPrivate?`, `medias[]?`. Une suite renvoie le **post racine complet**. |
| `PATCH` | `/api/journal/posts/{id}` | Champs envoyés uniquement : `content`, `mood`, `color`, `tagIds`, `location`, `isPinned`, `isBookmarked`, `isPrivate` |
| `POST` | `/api/journal/posts/{id}/bookmark` · `/pin` · `/toggle-private` | Bascules (renvoient le post racine) |
| `POST` | `/api/journal/posts/{id}/medias` | Ajout de médias (multipart `medias[]`) |
| `DELETE` | `/api/journal/posts/{id}/medias/{mediaId}` | Suppression d'un média |
| `DELETE` | `/api/journal/posts/{id}` | Suppression du post, de ses suites et de leurs fichiers |

Erreurs : 400 + `violations` (validation, convention core-php), 403 (contenu privé sans code ou post d'un autre utilisateur), 404.

### 4.3 Tags du journal — `/api/journal/tags`

| Méthode | Route | Description |
|---|---|---|
| `GET` | `/api/journal/tags` | Tags triés par nom, avec `postCount` (RG-JRN-10) |
| `POST` | `/api/journal/tags` | `{ name, color }` → slug généré |
| `PUT` | `/api/journal/tags/{id}` | `{ name?, color? }` |
| `DELETE` | `/api/journal/tags/{id}` | Suppression (les posts sont conservés) |

## 5. Frontend — `/journal`

Une seule route ; l'onglet est dans l'URL (`/journal?tab=memories`, `&tag=<slug>`). Composants dans `pages/journal/components/`, tous construits sur `core-react/ui`.

| Onglet | Contenu |
|---|---|
| **Feed** | `JournalComposer`, `JournalFilterBar` (recherche instantanée + pastilles de tags), liste des posts |
| **Souvenirs** (badge) | Posts « ce jour-là », avec « Il y a N ans » |
| **Enregistrés** (badge) | Posts enregistrés, filtrables |
| **Tags** | `JournalTagManager` : liste avec compteur, création/édition en modale (`ColorSwatchPicker`), suppression confirmée, lien « voir » vers le Feed filtré |
| **Privé** (cadenas) | Protection active : `JournalLockScreen` tant que le journal est verrouillé, puis composer en mode privé + liste privée et bouton **Verrouiller**. Protection inactive : accès direct avec un bandeau vers *Mon profil → Journal* |

- **`JournalComposer`** : `MarkdownEditor` du kit (gras, italique, code, liste, lien, aperçu), sélection multi-tags, humeur (`Dropdown`), géolocalisation (`useGeolocation`), médias avec miniatures, publication par **Ctrl/Cmd + Entrée**. Mode compact pour les suites.
- **`JournalPostCard`** : avatar, date relative (date complète en infobulle), badges humeur / lieu / privé / épinglé, Markdown rendu par `MarkdownViewer` (aucun HTML injecté), galerie (`Image`, `Video`), tags, actions (Enregistrer, Épingler, Modifier en ligne, Rendre privé/public si déverrouillé, Supprimer) et **« + Ajouter une suite »**. Les suites s'affichent dans un fil relié par un filet vertical.
- État : `stores/journal.store.ts` (jeton en `sessionStorage`, statut de protection `security` + sélecteurs `selectLockActive` / `selectCanSeePrivate`), `hooks/useJournalAutoLock.ts`. Services : `services/journal.api.ts` ; utilitaires testés : `utils/journal.ts`.

## 6. Migration des données (ancien journal par blocs)

Scripts `api/migrations/migration_01_backup_tmp.sql` → `02_schema.sql` → `03_restore_and_cleanup.sql`. Les anciennes entrées deviennent des **posts privés** (titre + `content` + blocs convertis en Markdown), les tags utilisés deviennent des `JournalTag`, médias et lieux sont repris ; les notes sont supprimées. Détail : [infrastructure_module.md](infrastructure_module.md#migration-journal-v2).

## 7. Écarts & points ouverts

- Les médias migrés restent dans `uploads/entries/…` ; les nouveaux vont dans `uploads/journal/…`.
- Pas de pagination des listes (volumes personnels) : à ajouter si un fil dépasse quelques centaines de posts.
- La recherche utilise `LIKE` ; l'index FULLTEXT est prêt pour un `MATCH … AGAINST` si besoin.

## 8. Sources

`api/src/Entity/Journal*.php`, `api/src/Repository/Journal*Repository.php`, `api/src/Service/Journal*Service.php`, `api/src/Controller/Journal*Controller.php`, `api/src/Dto/Journal/`, `api/src/Enum/JournalTabEnum.php`, `api/src/Doctrine/Query/DateFormat.php`, `frontend/src/pages/journal/`, `frontend/src/services/journal.api.ts`, `frontend/src/types/journal.types.ts`, `frontend/src/utils/journal.ts`.
