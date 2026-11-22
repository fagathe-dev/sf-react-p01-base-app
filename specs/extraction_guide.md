# Guide d'extraction du socle

## 1. Objet

Inventaire exhaustif pour cloner le projet en ne gardant que le socle agnostique (auth, account, mailer, preview e-mails, logs, design system, socle front).
Légende : **G** = garder tel quel · **A** = adapter (voir §3) · **S** = supprimer.

## 2. Inventaire

### 2.1 API (`api/`)

| Chemin | Action | Remarque |
|---|---|---|
| `bin/`, `config/**`, `public/index.php`, `public/.htaccess`, `public/images/*` | G | `public/images/logo.*` = logo des e-mails : à remplacer par projet |
| `src/Kernel.php` | G | |
| `src/Controller/Auth/AuthController.php` | G | |
| `src/Controller/Auth/AccountController.php` | A | Retirer les 3 routes `journal-passcode` |
| `src/Controller/Admin/LogController.php` | G | |
| `src/Controller/EmailPreviewerController.php` | G | |
| `src/Controller/HealthCheckController.php` | A | Renommer `service` (`base-api`) et `version` |
| `src/Controller/{JournalPost,JournalTag,JournalSecurity,Tag,Todo}Controller.php` | S | |
| `src/DataFixtures/AppFixtures.php` | A | Garder `testuser` + `admin`, retirer tags / todos / journal (tags, posts, code, `journalLockEnabled`) |
| `src/Dto/Auth/*` | G | |
| `src/Dto/Account/{ChangeEmail,ChangePassword,UpdateAccount,UploadAvatar}Dto.php` | G | |
| `src/Dto/Account/{SetJournalPasscode,VerifyJournalPasscode}Dto.php` | S | |
| `src/Dto/Mail/*` | G | 7 DTO |
| `src/Dto/{Journal,Tag,Todo}/*` | S | |
| `src/Entity/User.php` | A | Voir §3.1 |
| `src/Entity/UserRequest.php` | G | |
| `src/Entity/AbstractFile.php` | G (optionnel) | Superclasse générique de fichier ; utile si le projet a des pièces jointes |
| `src/Entity/{AbstractTextEntry,JournalPost,JournalTag,JournalMedia,JournalLocation,Tag,Todo,TodoComment,TodoFile}.php` | S | |
| `src/Enum/JournalTabEnum.php`, `src/Doctrine/Query/DateFormat.php` (+ `dql` dans `doctrine.yaml`) | S | |
| `src/Enum/Auth/*` | G | `RoleEnum`, `UserRequestTypeEnum` |
| `src/Enum/{BlockType,Color,Mood,State}Enum.php` | S | |
| `src/Mailer/**` | G | `MailDispatcher`, `MailHandlerInterface`, `NullTransportWarningListener`, 7 handlers (`Handler/`), 7 aperçus (`Preview/`) |
| `src/Repository/{User,UserRequest}Repository.php` | G | |
| `src/Repository/{JournalPost,JournalTag,JournalMedia,JournalLocation,Tag,Todo,TodoComment,TodoFile}Repository.php` | S | |
| `src/Security/Voter/OwnerVoter.php` | G | Générique (`getOwner`/`getUser`/`getAuthor`/`getCreator`) |
| `src/Service/{AuthService,AccountService,AdminUserManager}.php` | A | Voir §3.2 à §3.4 |
| `src/Service/{EmailPreviewService,LogService,SecretDecoder,UserRequestService}.php` | G | |
| `src/Service/AttachmentFileService.php` | S (ou A) | Couplé à `Todo`/`JournalPost` ; à généraliser seulement si besoin de pièces jointes |
| `src/Service/{JournalPost,JournalTag,JournalSecurity,Tag,Todo,TodoFile}Service.php` | S | `TodoFileService` est déjà du code mort |
| `templates/emails/**` | G | Seuls templates de l'API : layout et composants viennent de `@CorePhp` |
| `migrations/` | S | Régénérer une migration initiale (voir [infrastructure_module.md](infrastructure_module.md)) |
| `composer.json` | G | Dépend du dépôt privé `fagathe-dev/core-php` (`>= 1.1.5`) |

### 2.2 Front (`frontend/`)

| Chemin | Action | Remarque |
|---|---|---|
| `src/ui/{components,theme}/index.ts` | G | Pont vers `core-react/ui`, `core-react/compat` et `core-react/theme` |
| `public/assets/**` (`ds-icons.css` + polices), `public/images/*`, `public/.htaccess` | G | Remplacer favicon / logo |
| `index.html` | A | `<title>`, `lang="en"` → `fr` |
| `src/main.tsx`, `src/App.tsx` | G | `ThemeProvider`, `GlobalStyle`, `UIProvider`, `RouterProvider`, `ToastContainer` |
| `src/hooks/{useAuth,useTheme}.ts` | G | Les hooks génériques (`useActionTimer`, `useClipboard`, `useToggle`, `usePageFocus`) viennent de `core-react` |
| `src/hooks/{useGeoLocation.tsx,useJournalAutoLock.ts}` | S | Mettre à jour `hooks/index.ts` |
| `src/layouts/AuthLayout.tsx` | G | |
| `src/layouts/AppLayout.tsx` | A | Remplacer la config de menu (`PRIMARY_MODULES`, `ARCHIVE_MODULES`, lien de marque `/todos`) |
| `src/router/{adminRoute,protectedRoute,publicRoute}.tsx` | G | |
| `src/router/index.tsx` | A | Retirer les routes todos/tags/journal ; changer la cible de `/` |
| `src/services/{fetchAPI,apiError,storage.service,emailPreview.api,log.api}.ts` | G | Renommer la clé `todo_auth_token` (aussi dans `auth.store.ts`) |
| `src/services/auth.api.ts` | A | Retirer `updateJournalPasscode` |
| `src/services/{journal,tag,todo}.api.ts` | S | |
| `src/stores/auth.store.ts` | G | |
| `src/stores/journal.store.ts` | S | |
| `src/types/{emailPreview,log}.types.ts` | G | |
| `src/types/auth.types.ts` | A | Retirer `hasJournalPasscode`, `SetJournalPasscode*` |
| `src/types/{journal,tag,todo}.types.ts` | S | |
| `src/utils/{jwt,role,secret,fileIcon}(+tests)` | G | `fileIcon` est générique (basé sur `FileTypeEnum` de `core-php`) |
| `src/utils/string.ts` | A | Texte par défaut « Note sans texte… » à rendre générique |
| `src/utils/dueDate.resolver(+test)` | S | Mettre à jour `utils/index.ts` |
| `src/pages/auth/**` | A | Supprimer `ChangeJournalPasscodeForm` (+ export, + usage dans `ProfilePage`) ; reformuler l'avertissement de `DeleteAccountCard` |
| `src/pages/admin/**` | G | |
| `src/pages/{journal,tags,todos}/**` | S | Mettre à jour `pages/index.ts` |
| `src/test/setup.ts`, `vite.config.ts`, `tsconfig*.json`, `eslint.config.js`, `.prettierrc`, `.husky/` | G | |
| `package.json` | A | Champs `name`, `description` ; conserver `core-react`, `core-ts` et `@dnd-kit/*` (si `core-react/editor` est utilisé) |

### 2.3 Racine

| Chemin | Action | Remarque |
|---|---|---|
| `deploy-base.sh` | A | `APP_DIR`, `GIT_REPO_URL`, `GIT_BRANCH` |
| `.editorconfig`, `.gitignore` | G | |
| `specs/` | A | Retirer `tag_module.md`, `todo_module.md`, `note_module.md`, `journal_module.md` et adapter `data_model.md` |

## 3. Points de découplage

### 3.1 `User.php`
- Supprimer les collections et leurs accesseurs : `tags`, `todos`, `todoFiles`, `journalPosts`, `journalTags`, `journalMedia`, `journalLocations` (et le champ `journalLockEnabled`) (+ initialisation dans le constructeur).
- Supprimer `journalPasscode`, `jCodeToken` et méthodes associées (`hasJournalPasscode`, `get/setJCodeToken`…).
- Retirer le groupe `note.list` sur `id`.
- Recommandé : ajouter `#[Groups(['user.read'])]` sur `isVerified()` (attendu par le type front).

### 3.2 `AuthService`
- `register()` : retirer `->setJCodeToken(...)` et la dépendance `TokenGenerator` si elle devient inutile ; nettoyer `IGNORED_ATTRIBUTES` (`tags`, `todos`).

### 3.3 `AdminUserManager`
- `createAdmin()` : retirer `->setJCodeToken(...)` (+ `TokenGenerator`).

### 3.4 `AccountService`
- Supprimer `setJournalPasscode()`, `verifyJournalPasscode()`, `getJournalPasscodeStatus()` et les imports des DTO associés.
- `performAccountDeletion()` : supprimer la collecte des fichiers todos / notes / journal (étapes 1–2) ; conserver la suppression de l'avatar puis de l'utilisateur.
- Pour un nouveau projet ayant des fichiers : brancher leur nettoyage via un service dédié appelé ici (ou un listener Doctrine `preRemove`) plutôt que de réintroduire des dépendances directes.

### 3.5 Front
- `ProfilePage` : onglet « Sécurité » = `ChangeEmailForm` + `ChangePasswordForm` uniquement.
- `AppLayout` : la section admin (« E-mails », « Logs ») et le menu compte (profil, thème, déconnexion) sont génériques ; seule la liste « Espaces de travail » est métier.

## 4. Checklist de clonage

1. Copier le dépôt, appliquer les actions **S** puis **A** ci-dessus.
2. API : `composer install`, créer `.env.local` ([infrastructure_module.md](infrastructure_module.md)), générer les clés JWT, créer la base, `make:migration` puis `doctrine:migrations:migrate`.
3. Vérifier qu'aucune référence ne subsiste : `grep -rE "Todo|Tag|Journal|jCode|journalLock" api/src frontend/src`.
4. `php bin/console lint:container` et `debug:router` (routes attendues : `/api/auth/*`, `/api/account/*`, `/api/admin/*`, `/api/health-check`).
5. Front : `npm ci`, `npm run lint`, `npm test`, `npm run build`.
6. Recette : inscription → lien de vérification → connexion mot de passe et code → mot de passe oublié → changement e-mail / mot de passe / avatar → suppression de compte → (admin) preview e-mails et logs.
7. Personnaliser : nom d'app (`APP_NAME`), logo e-mails, favicon, clés de stockage navigateur, nom du service du health-check.
8. Corriger en priorité les écarts listés dans [README.md](README.md).
