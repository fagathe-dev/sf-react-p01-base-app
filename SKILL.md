---
name: sf-react-p01-base-app
description: Architecture et conventions de développement de la Base App (socle réutilisable) — API REST Symfony 8 (`api/`, `App\`, JWT, Doctrine, librairie `core-php`) et SPA React 19 + TypeScript + Vite (`frontend/`, UI Kit `core-react`, utilitaires `core-ts`). Modules : auth, compte, e-mails, aperçu des e-mails, logs, todos, tags, notes, journal intime. À utiliser systématiquement pour toute intervention sur ce dépôt.
---

# Architecture & Conventions de la Base App

Dépôt à deux applications, servies sous le même domaine (`/api` → Symfony, le reste → SPA) :

```text
.
├── api/            # API REST Symfony 8.1 (App\), JWT stateless, MySQL / MariaDB
├── frontend/       # SPA React 19 + TypeScript + Vite
├── specs/          # Spécifications fonctionnelles du socle (une par module)
└── deploy-base.sh  # Déploiement (clone, build, bascule atomique)
```

1. **`api/` (`App\`)** — Contrôleurs minces, services métier, DTO, entités Doctrine, handlers d'e-mails. S'appuie sur la librairie maison `fagathe-dev/core-php` (`Fagathe\CorePhp\` : réponses, logs JSON, upload, mailer, commandes).
2. **`frontend/`** — SPA consommant l'API via `fetchAPI`. UI Kit fourni par `core-react` (dépôt Git `fagathe-dev/core-react`), utilitaires par `core-ts` (dépôt Git `fagathe-dev/core-ts`).
3. **`specs/`** — Référence fonctionnelle : règles `RG-<MODULE>-NN`, endpoints, écarts connus. **Lire le fichier du module concerné avant de le modifier** ; `specs/extraction_guide.md` liste ce qui est socle et ce qui est métier propre à ce projet.

| Couche | Socle (réutilisé par les autres projets) | Métier propre à ce projet |
|---|---|---|
| API | Auth, compte, mailer, aperçu des e-mails, logs, health-check | Todos, tags, notes, journal, lieux, pièces jointes |
| Front | `ui/`, hooks, stores, services, utils, router, layouts, pages `auth/` et `admin/` | Pages `todos/`, `tags/`, `notes/`, `journal/` |

> Ne jamais faire dépendre une brique du socle d'un module métier (ex. `AccountService` ne doit pas connaître `Todo`). Le nettoyage de données métier se branche par un service dédié ou un listener Doctrine.

---

## 0. Principes de conception — SOLID, appliqués avec pragmatisme

| Principe | Application attendue |
|---|---|
| **S** — Responsabilité unique | Contrôleur = HTTP, service = métier, repository = persistance, DTO = transport. Côté React, la page orchestre et les sous-composants détaillent. |
| **O** — Ouvert/fermé | Ajouter un cas = ajouter du code (un handler, un composant, une entrée de registre), pas une branche de plus dans un `switch`. |
| **L** — Substitution | Toute sous-classe de `AbstractFile` / `AbstractTextEntry` reste utilisable là où sa parente l'est. |
| **I** — Ségrégation | Petites interfaces ciblées plutôt qu'une interface fourre-tout. |
| **D** — Inversion | Dépendances injectées par le conteneur Symfony (autowiring), jamais instanciées à la main dans un service. |

- **Pas de sur-ingénierie** : pas d'interface, de couche ou d'abstraction sans besoin réel (un seul implémenteur, aucun test qui l'exige → pas d'interface).
- **Respecter l'existant** : reproduire les conventions du module voisin plutôt qu'en introduire de nouvelles.
- Signaler tout compromis architectural dans le compte rendu.

---

## 1. API — `api/` (Symfony, `App\`)

### 1.1. Pipeline d'une requête

```
Requête → Controller (mince) → Service (logique) → Repository
                    ↑                 │
                    └── objet réponse ┘  { data, status, headers, context }
```

- **Toutes les routes sont préfixées par `/api`** (`config/routes.yaml`) : un contrôleur déclare `#[Route('/journal', name: 'api_journal_')]`, pas `/api/journal`.
- **Contrôleurs** (`App\Controller\*`, `final`, `#[IsGranted(...)]` au niveau de la classe) : aucune logique métier, ils délèguent au service et convertissent le résultat :
  ```php
  $res = $this->service->listEntries($request);

  return $this->json($res->data, $res->status, $res->headers, $res->context);
  ```
  Sous-dossiers : `Auth\` (`AuthController`, `AccountController`), `Admin\` (`LogController`). Exception : `HealthCheckController` (`GET /api/health-check`, public) fait ses contrôles lui-même.
- **Services** (`App\Service\*`, `final`) : utilisent les traits de `core-php` — `ResponseTrait` (`sendJson`, `sendNoContent`, `sendViolations`), `DatetimeTrait` (`now()`, `isPastDate()`), `LoggerTrait` (`generateLog()`), `RequestTrait` ; `PaginationTrait` est disponible. L'utilisateur courant vient de `Security::getUser()`.

#### Étapes d'un service d'écriture

1. Récupérer l'utilisateur authentifié (sinon `401`).
2. Décoder les secrets si besoin (`SecretDecoder::decodeJsonBody()`, voir 1.5) **avant** la désérialisation.
3. Désérialiser le JSON vers un DTO (`SerializerInterface`) → JSON invalide : `400 { message: 'Format de données JSON invalide.' }`.
4. Valider le DTO (`ValidatorInterface`) → `return $this->sendViolations($violations);`.
5. Hydrater l'entité ; vérifier la propriété (`OwnerVoter`) ; revalider l'entité si elle porte des `#[UniqueEntity]`.
6. Persister via le repository, journaliser (`generateLog`), répondre avec `sendJson($entity, Response::HTTP_…, context: ['groups' => [...]])`.
7. Toute erreur inattendue → log `Critical` avec l'exception + `500 { message }`.

### 1.2. Entités, DTO, enums

- `declare(strict_types=1);` dans tout nouveau fichier ; setters fluents typés `: static`.
- Identifiants **UUID v7** générés dans le constructeur (`$this->id = Uuid::v7();`), avec `createdAt = new \DateTimeImmutable()`.
- Exposition contrôlée par `#[Groups]` : `user.read`, `entry.list` / `entry.read`, etc. Ne jamais exposer `password`, `journalPasscode`, `jCodeToken`.
- Superclasses : `AbstractFile` (métadonnées de fichier : `NoteFile`, `TodoFile`, `EntryMedia`) et `AbstractTextEntry` (contenu texte, `is_pinned` : `Note`, `Entry`).
- **DTO** (`App\Dto\<Domaine>\`) : classes `final` à propriétés publiques + contraintes `Assert`, messages en français. Les DTO d'e-mail (`Dto\Mail\`) sont `final readonly` avec constructeur promu.
- **Enums** : `Auth\RoleEnum` (`ROLE_USER`, `ROLE_ADMIN`, `mapRole()`, `choices()`, `values()`), `Auth\UserRequestTypeEnum`, `ColorEnum` (13 couleurs), `MoodEnum` (15 humeurs, `getLabel()`), `StateEnum` (`open`, `archived`, `trash`).

### 1.3. Persistance

- Les repositories exposent `save($entity, flush: true, isCreation: …): bool` (gère `createdAt` / `updatedAt`) et `remove($entity, flush: true): bool`. **Tout nouveau code passe par ces méthodes.**
- Quelques services historiques injectent encore `EntityManagerInterface` (`AccountService`, `AttachmentFileService`, `UserRequestService`) : ne pas étendre cet usage, ne pas l'introduire ailleurs.
- **Migrations** : `api/.gitignore` ignore `/migrations/` (écart connu, `specs/infrastructure_module.md`). Générer avec `make:migration`, ne pas supposer qu'elles sont versionnées.

### 1.4. Sécurité

- Firewall `api` (`^/api`), **stateless**, JWT Lexik (`Authorization: Bearer <token>`), provider `User` par `username`.
- Accès : `^/api/auth/` et `^/api/health-check` publics, `^/api/admin` → `ROLE_ADMIN`, reste de `^/api/` → `IS_AUTHENTICATED_FULLY`. Hiérarchie `ROLE_ADMIN` ⊃ `ROLE_USER`.
- **Propriété des ressources** : `App\Security\Voter\OwnerVoter` (`IS_OWNER`, `VIEW`, `EDIT`, `DELETE`) sur tout objet exposant `getOwner()`, `getUser()`, `getAuthor()` ou `getCreator()` — `$this->denyAccessUnlessGranted(OwnerVoter::EDIT, $resource);`.
- **Anti-énumération** : les endpoints publics prenant un identifiant (`login-code`, `resend-verification`, `forgot-password`) répondent toujours la même chose ; `login` hache un mot de passe factice si l'utilisateur est inconnu.
- **Limitation de débit** maison via `cache.app` (clés par utilisateur), pas de `symfony/rate-limiter`.
- **Journal intime** : en plus du JWT, chaque requête `/api/journal/*` (sauf `POST /journal/unlock`) exige l'en-tête **`X-JOURNAL-AUTH`** égal au `jCodeToken` de l'utilisateur, obtenu en déverrouillant le journal avec son code secret (`JournalController::verifyJournalAuth()`, comparaison `hash_equals`).

### 1.5. Conventions d'échange

- JSON en entrée et en sortie ; upload en `multipart/form-data`. Dates ISO 8601, fuseau `Europe/Paris`.
- **Secrets encodés en base64 UTF-8** par le front (`encodeSecret`) et décodés par `SecretDecoder` **avant validation et hachage** : `password` (`register`, `login`, `reset-password`), `currentPassword` / `newPassword` (`PUT /account/password`). Base64 invalide → `400 Format de données invalide.` Ce n'est pas du chiffrement : la confidentialité repose sur HTTPS.
- Formats de réponse :

| Cas | Statut | Corps |
|---|---|---|
| Ressource | 200 / 201 | objet sérialisé selon les groupes |
| Action | 200 | `{ message }` (+ champs éventuels) |
| Suppression | 204 | vide |
| Erreur | 4xx / 5xx | `{ message }`, ou `{ code, message }` avec un code métier (ex. `email_not_verified`) |
| Validation | 400 | `{ title: 'Validation failed !', violations: { champ: message }, status: 400 }` |

- Les messages sont **en français** et affichés tels quels par le front.

### 1.6. Mailer

Chaîne **DTO → `App\Mailer\MailDispatcher` → handler → template Twig**, sur la base mailer de `core-php` (`AbstractMailerHandler`, layout et composants `@CorePhp`) :

| E-mail | DTO (`Dto\Mail`) | Handler (`Mailer\Handler\`) | Template (`templates/emails/`) |
|---|---|---|---|
| Vérification du compte | `AccountVerificationMailDto` | `AccountVerificationMailHandler` | `auth/account_verification` |
| Bienvenue | `RegistrationConfirmedMailDto` | `RegistrationConfirmedMailHandler` | `auth/registration_confirmed` |
| Code de connexion | `OtpVerificationMailDto` | `OtpVerificationMailHandler` | `auth/otp_verification` |
| Mot de passe oublié | `ForgotPasswordMailDto` | `ForgotPasswordMailHandler` | `auth/forgot_password` |
| Changement d'e-mail | `EmailChangeVerificationMailDto` | `EmailChangeVerificationMailHandler` | `auth/email_change_verification` |
| Suppression de compte | `AccountDeletionCodeMailDto` | `AccountDeletionCodeMailHandler` | `auth/account_deletion_code` |
| Compte admin créé | `AdminAccountCreatedMailDto` | `AdminAccountCreatedMailHandler` | `admin/account_created` |

- **Handlers** : `extends Fagathe\CorePhp\Mailer\AbstractMailerHandler implements App\Mailer\MailHandlerInterface` ; `getDtoClass()` (DTO pris en charge), `getTemplate()`, `getSubject($dto)`, `getRecipients($dto)` (jamais de clé `email` dans `getContext()`). Templates : `{% extends '@CorePhp/layout.html.twig' %}` + composants `@CorePhp/components/_*.html.twig` (props `role`, `variant`, `tone` ; `_code` pour les codes à usage unique, `_details` pour les récapitulatifs ; aucune couleur en dur).
- **Open/Closed** : `MailDispatcher` retrouve le handler via un locator indexé par classe de DTO (`#[AutowireLocator]` sur le tag `app.mail_handler`) ; il n'est jamais modifié pour ajouter un e-mail.
- `dispatch()` propage les exceptions (l'appelant choisit le code HTTP) ; `dispatchSilently()` les absorbe (e-mails non bloquants, anti-énumération).
- **Aperçu** (`Mailer\Preview\`) : une classe `*MailPreview` par e-mail (`extends AbstractMailPreview`, `getSlug()`, `getLabel()`, `getDescription()`, `createDto()` avec des données factices et les constantes de durée des services). `#[AsTaggedItem(priority: …)]` fixe l'ordre d'affichage. `Service\EmailPreviewService` les découvre (tag `app.mail_preview`) et rend le HTML avec le `BodyRenderer` de l'envoi réel.
- **Ajouter un e-mail** = DTO + handler + template + `*MailPreview`. Aucun registre à mettre à jour. Voir `specs/mailer_module.md`.
- `Mailer\NullTransportWarningListener` journalise un avertissement quand un e-mail part vers `MAILER_DSN=null://null`.
- Liens envoyés : `FRONTEND_URL`, à défaut l'origine de la requête.
- Les services de `core-php` sont déclarés par `CorePhpBundle` : **ne jamais recharger `vendor/fagathe-dev/core-php/src` dans `services.yaml`** (seul `TokenGenerator`, absent du bundle, y est déclaré).

### 1.7. Logs & commandes

- Logs JSON par classe via `LoggerTrait` : `logs/<namespace>/<classe-kebab>-dd-mm-yyyy.json`. Convention : `content.message`, données utiles (`user_id`…), `exception` pour les erreurs ; `context.action` = `domaine.action.résultat` (ex. `account.delete.success`).
- Consultation admin : `GET /api/admin/logs`, `GET /api/admin/logs/{date}/{filePath}` (`LogService`) ; aperçu des e-mails : `GET /api/admin/emails`, `GET /api/admin/emails/{slug}` (`EmailPreviewService`).
- Commandes `core-php` : `core-php:create-admin-user` (via `App\Service\AdminUserManager`) et `core-php:log-file-rotation` (rétention 30 jours, à planifier).

---

## 2. Front — `frontend/` (React 19 + TypeScript + Vite)

### 2.1. Stack & arborescence

React 19, TypeScript strict, Vite (alias `@` → `src`), styled-components 6, react-router-dom 7, zustand 5, react-hook-form + zod 4, axios (encapsulé). Tests : Vitest + Testing Library.

```text
src/
├── App.tsx, main.tsx   # ThemeProvider + GlobalStyle + RouterProvider ; checkSession() au montage
├── hooks/              # useAuth, useTheme, useGeoLocation, useJournalAutoLock (+ index.ts)
├── layouts/            # AppLayout (espace connecté), AuthLayout (pages publiques)
├── pages/<feature>/    # <Nom>Page.tsx + components/ + index.ts
├── router/             # index.tsx + gardes protectedRoute / publicRoute / adminRoute
├── services/           # fetchAPI, apiError, storage.service + <feature>.api.ts
├── stores/             # auth.store, journal.store (zustand)
├── types/              # <feature>.types.ts (contrats de l'API)
├── ui/                 # Barrel du UI Kit core-react (components/index.ts) + thème
└── utils/              # Fonctions pures + tests (jwt, role, secret, string, dueDate.resolver)
```

### 2.2. UI Kit

- **Toujours importer depuis le barrel** `@/ui/components` (`import { Button, Icon, Alert } from '@/ui/components'`), jamais directement depuis `core-react`. Le barrel enveloppe certains composants avec `withLegacyProps` : les anciennes props (`variant`, `size`…) restent acceptées, **le nouveau code utilise les props préfixées `$`**. Documentation : `node_modules/core-react/docs/`.
- Hooks génériques (`useActionTimer`, `usePageFocus`…) : depuis `core-react`. Utilitaires (`StorageService`, `DateFormatter`, `convertMarkdownToHtml`, `FileSizeFormatter`…) : depuis `core-ts`.
- Styles avec les **tokens du thème** (`theme.colors.<rôle>`, `theme.radii`, `theme.shadows`) plutôt que des valeurs en dur. Icônes : `<Icon name="pencil-outline" />` (Material Design Icons).

### 2.3. Pages & composants

- **Une page par route**, suffixée `Page`, export nommé (`export const JournalEditPage: React.FC = () => …`). La page orchestre (store, paramètres d'URL, navigation) ; les blocs à responsabilité propre vont dans `components/`.
- **Un composant par fichier** ; barrel `index.ts` dans `components/` et dans chaque `pages/<feature>/` ; `pages/index.ts` réexporte toutes les features.
- **Styles** : un seul composant → `styled-components` en haut du fichier ; partagés ou volumineux → `<Composant>.styles.tsx` importé en `import * as S from './X.styles'`. Props stylées transitoires préfixées `$` (`$active`, `$color`).
- **Formulaires** : `react-hook-form` + `zod` + `zodResolver`, schémas partagés dans `pages/auth/authSchemas.ts`, messages en français. Erreurs de champ API → `getFieldErrors(err)` puis `setError`.
- **Navigation avec contexte** : passer l'information par `navigate(path, { state })` et la relire avec `useLocation()` (ex. `state.from` pour que « Annuler » ramène à la page d'origine).

### 2.4. Couche données

- **Appels API uniquement dans `services/<feature>.api.ts`** : une fonction `async` par endpoint, qui retourne la donnée typée ou lève une `ApiError` :
  ```ts
  const res = await fetchAPI<User>('/account/profile');
  if (!res.ok) throw toApiError(res, 'Message de repli');
  return res.data;
  ```
- `fetchAPI` ne lève jamais sur un statut HTTP ; il ajoute le JWT (`localStorage`, clé `todo_auth_token`) et sérialise les objets en JSON. **`VITE_API_URL` doit inclure le préfixe `/api`.**
- Erreurs : `getErrorMessage(err, fallback)`, `getFieldErrors(err)`, `getErrorCode(err)` (`services/apiError.ts`).
- État global : stores zustand lus par sélecteur (`useAuthStore((s) => s.user)`) ; `useAuth()` expose `isAuth`, `user`, `isAdmin`, `roleLabel`, `logout`…
- Secrets : toujours `encodeSecret(value)` (`utils/secret.ts`) avant envoi.

### 2.5. Routage

| Groupe | Garde / layout | Routes |
|---|---|---|
| Espace connecté | `ProtectedRoute` → `AppLayout` | `/` (→ `/todos`), `/todos`, `/tags`, `/notes`, `/archives`, `/trash`, `/journal` (`new`, `:journalId`, `:journalId/edit`), `/profile` |
| Admin | `AdminRoute` (sous `ProtectedRoute`) | `/admin/emails`, `/admin/logs` |
| Public | `PublicRoute` → `AuthLayout` | `/login`, `/register`, `/forgot-password` |
| Liens e-mail | `AuthLayout`, sans garde | `/verify-email`, `/reset-password`, `/confirm-email-change` |
| Déconnexion | `ProtectedRoute` | `/logout` |

### 2.6. Journal intime (`pages/journal/`)

- **Verrouillage** : `journal.store.ts` garde le jeton de déverrouillage en `sessionStorage` ; `journal.api.ts` l'envoie dans l'en-tête `X-JOURNAL-AUTH`. Chaque page du journal appelle `useJournalAutoLock()` et affiche `<JournalLockScreen />` tant que `isUnlocked` est faux. Verrouillage automatique 90 s après la perte du focus de la page.
- **Liste** (`JournalsPage`) : cartes `JournalCard` (épinglées puis autres), boutons d'action discrets (`S.ActionBtn` : modifier, épingler) visibles au survol, toujours visibles sur écran tactile, avec `e.stopPropagation()` pour ne pas ouvrir la carte. Le crayon mène directement à `/journal/:id/edit`.
- **Formulaire** (`JournalForm`, création et édition) : onglets Écrire / Aperçu (Markdown via `convertMarkdownToHtml`), barre d'outils sans bordure ni ombre (humeur, lieu, catégorie, couleur, média). Les médias ne sont gérés qu'en édition : bouton image, collage ou glisser-déposer sur la zone de texte (50 Mo max, image / vidéo / audio, `validateMediaFiles`). `JournalMediaManager` ne rend rien s'il n'y a ni média ni erreur.

### 2.7. Qualité

- `npm run lint`, `npm test` (Vitest, lancé par Husky en `pre-commit`), `npm run build` (`tsc -b && vite build`).
- Prettier : guillemets simples, 120 colonnes, LF (`.editorconfig` à la racine).
- Toute nouvelle fonction de `utils/` est accompagnée de son `*.test.ts`.

---

## 3. Environnement & déploiement

- **API** (`api/.env` = modèle sans secret, valeurs réelles dans `api/.env.local`, **jamais lu ni versionné**) : `DATABASE_URL`, `JWT_SECRET_KEY` / `JWT_PUBLIC_KEY` / `JWT_PASSPHRASE`, `JWT_TOKEN_TTL`, `CORS_ALLOW_ORIGIN`, `DEFAULT_URI`, `FRONTEND_URL`, `MAILER_DSN`, `DEFAULT_EMAIL_SENDER`, `APP_NAME`, `LOGO_PATH`, `SUPPORT_EMAIL`.
- **Front** : `VITE_API_URL` (avec `/api`).
- **Installation** : `composer install` (accès au dépôt privé `core-php`), `lexik:jwt:generate-keypair`, `doctrine:database:create`, `make:migration` + `doctrine:migrations:migrate`, `doctrine:fixtures:load` ; côté front `npm ci` puis `npm run dev`.
- **Déploiement** : `./deploy-base.sh [--project=api|frontend] [--migrations]` — clone dans un dossier temporaire, build, bascule atomique par renommage ; le front sert l'API via le lien symbolique `dist/api → api/public`.
- E-mails en dev : les domaines `example.com` des fixtures sont refusés par le contrôle de délivrabilité (`core_php.email.check_deliverability`).

---

## 4. Checklist avant de rendre la main

1. Le module modifié respecte son fichier `specs/<module>_module.md` (ou la spec est mise à jour si le comportement change volontairement).
2. API : `php bin/console lint:container`, `debug:router` si des routes changent ; messages d'erreur en français ; log `context.action` cohérent.
3. Front : `npx tsc -b`, `npm run lint`, `npm test` ; aucun appel HTTP hors de `services/`, aucun import direct de `core-react` hors du barrel `@/ui/components`.
4. Pas de secret ni de lecture de `.env.local` ; pas de nouvelle dépendance du socle vers un module métier.
