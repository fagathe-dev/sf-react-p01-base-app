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
| `src/Controller/{Journal,Note,Tag,Todo}Controller.php` | S | |
| `src/DataFixtures/AppFixtures.php` | A | Garder `testuser` + `admin`, retirer tags / todos / notes / entrées / code journal |
| `src/Dto/Auth/*` | G | |
| `src/Dto/Account/{ChangeEmail,ChangePassword,UpdateAccount,UploadAvatar}Dto.php` | G | |
| `src/Dto/Account/{SetJournalPasscode,VerifyJournalPasscode}Dto.php` | S | |
| `src/Dto/Mail/*` | G | 7 DTO |
| `src/Dto/{Journal,Note,Tag,Todo}/*` | S | |
| `src/Entity/User.php` | A | Voir §3.1 |
| `src/Entity/UserRequest.php` | G | |
| `src/Entity/AbstractFile.php` | G (optionnel) | Superclasse générique de fichier ; utile si le projet a des pièces jointes |
| `src/Entity/{AbstractTextEntry,Entry,EntryMedia,Location,Note,NoteFile,Tag,Todo,TodoComment,TodoFile}.php` | S | |
| `src/Enum/Auth/*` | G | `RoleEnum`, `UserRequestTypeEnum` |
| `src/Enum/{Color,Mood,State}Enum.php` | S | |
| `src/Mailer/*` | G | 7 handlers |
| `src/Repository/{User,UserRequest}Repository.php` | G | |
| `src/Repository/*` (autres) | S | |
| `src/Security/Voter/OwnerVoter.php` | G | Générique (`getOwner`/`getUser`/`getAuthor`/`getCreator`) |
| `src/Service/{AuthService,AccountService,AdminUserManager}.php` | A | Voir §3.2 à §3.4 |
| `src/Service/{EmailDispatcherService,EmailMockService,LogService,SecretDecoder,UserRequestService}.php` | G | |
| `src/Service/AttachmentFileService.php` | S (ou A) | Couplé à `Todo`/`Note`/`Entry` ; à généraliser seulement si besoin de pièces jointes |
| `src/Service/{Journal,Note,Tag,Todo,TodoFile}Service.php` | S | `TodoFileService` est déjà du code mort |
| `templates/base.html.twig`, `templates/emails/**` | G | |
| `migrations/` | S | Régénérer une migration initiale (voir [infrastructure_module.md](infrastructure_module.md)) |
| `composer.json` | G | Dépend du dépôt privé `fagathe-dev/core-php` |

### 2.2 Front (`frontend/`)

| Chemin | Action | Remarque |
|---|---|---|
| `src/ui/**` (composants, thème, types, docs) | G | Autonome : seules dépendances externes `@/hooks/useTheme` et `core-ts` (`BreakPointType`) |
| `public/assets/**` (`ds-icons.css` + polices), `public/images/*`, `public/.htaccess` | G | Remplacer favicon / logo |
| `index.html` | A | `<title>`, `lang="en"` → `fr` |
| `src/main.tsx`, `src/App.tsx` | G | |
| `src/hooks/{useActionTimer(+test),useAuth,useClipboard,useTheme,useToggle}` | G | |
| `src/hooks/{useGeoLocation,useJournalAutoLock}` | S | Mettre à jour `hooks/index.ts` |
| `src/layouts/AuthLayout.tsx` | G | |
| `src/layouts/AppLayout.tsx` | A | Remplacer la config de menu (« Espaces de travail », lien de marque `/todos`) |
| `src/router/{adminRoute,protectedRoute,publicRoute}.tsx` | G | |
| `src/router/index.tsx` | A | Retirer routes todos/tags/notes/archives/trash/journal ; changer la cible de `/` |
| `src/services/{fetchAPI,apiError,storage.service,emailPreview.api,log.api}.ts` | G | Renommer la clé `todo_auth_token` (aussi dans `auth.store.ts`) |
| `src/services/auth.api.ts` | A | Retirer `updateJournalPasscode` |
| `src/services/{journal,note,tag,todo}.api.ts` | S | |
| `src/stores/auth.store.ts` | G | |
| `src/stores/journal.store.ts` | S | |
| `src/types/{emailPreview,log}.types.ts` | G | |
| `src/types/auth.types.ts` | A | Retirer `hasJournalPasscode`, `SetJournalPasscode*` |
| `src/types/{journal,note,tag,todo}.types.ts` | S | |
| `src/utils/{jwt,role,secret}(+tests)` | G | |
| `src/utils/string.ts` | A | Texte par défaut « Note sans texte… » à rendre générique |
| `src/utils/dueDate.resolver(+test)` | S | Mettre à jour `utils/index.ts` |
| `src/pages/auth/**` | A | Supprimer `ChangeJournalPasscodeForm` (+ export, + usage dans `ProfilePage`) ; reformuler l'avertissement de `DeleteAccountCard` |
| `src/pages/admin/**` | G | |
| `src/pages/{journal,notes,tags,todos}/**` | S | Mettre à jour `pages/index.ts` |
| `src/test/setup.ts`, `vite.config.ts`, `tsconfig*.json`, `eslint.config.js`, `.prettierrc`, `.husky/` | G | |
| `package.json` | A | Champs `name`, `description` |

### 2.3 Racine

| Chemin | Action | Remarque |
|---|---|---|
| `deploy-base.sh` | A | `APP_DIR`, `GIT_REPO_URL`, `GIT_BRANCH` |
| `.editorconfig`, `.gitignore` | G | |
| `specs/` | A | Ne conserver que les fichiers du socle |

## 3. Points de découplage

### 3.1 `User.php`
- Supprimer les collections et leurs accesseurs : `tags`, `todos`, `notes`, `entries`, `todoFiles`, `noteFiles`, `entryMedia`, `locations` (+ initialisation dans le constructeur).
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
3. Vérifier qu'aucune référence ne subsiste : `grep -rE "Todo|Note|Entry|Tag|Journal|jCode|Location" api/src frontend/src`.
4. `php bin/console lint:container` et `debug:router` (routes attendues : `/api/auth/*`, `/api/account/*`, `/api/admin/*`, `/api/health-check`).
5. Front : `npm ci`, `npm run lint`, `npm test`, `npm run build`.
6. Recette : inscription → lien de vérification → connexion mot de passe et code → mot de passe oublié → changement e-mail / mot de passe / avatar → suppression de compte → (admin) preview e-mails et logs.
7. Personnaliser : nom d'app (`APP_NAME`), logo e-mails, favicon, clés de stockage navigateur, nom du service du health-check.
8. Corriger en priorité les écarts listés dans [README.md](README.md).
