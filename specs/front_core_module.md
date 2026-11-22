# Front — Socle applicatif

## 1. Objet

Architecture et briques transverses du front React : client HTTP, gestion d'erreurs, état global, hooks, utilitaires, routage et layouts. Le design system et l'intégration de `core-react` sont décrits dans [design_system_module.md](design_system_module.md).

## 2. Stack

| Élément | Choix |
|---|---|
| Build | Vite 8, TypeScript 6 (`strict`, `noUncheckedIndexedAccess`), alias `@` → `src`, `optimizeDeps.include` pour `@dnd-kit/*` |
| UI & Design System | React 19, styled-components 6, **`core-react`** (`git+https://github.com/fagathe-dev/core-react.git#master` : `core-react`, `core-react/ui`, `core-react/theme`, `core-react/icons` ; plus de `core-react/compat` ni d'éditeur de blocs) |
| Drag & Drop (éditeur) | `@dnd-kit/core` 6, `@dnd-kit/sortable` 10, `@dnd-kit/utilities` 3 (peerDependencies de `core-react`) |
| Routage | react-router-dom 7 (`createBrowserRouter`) |
| État | zustand 5 |
| Formulaires | react-hook-form 7 + zod 4 (`@hookform/resolvers` 5) |
| HTTP | axios (encapsulé dans `fetchAPI`) |
| Utilitaires maison | **`core-ts`** (`git+https://github.com/fagathe-dev/core-ts.git#master`) : `StorageService`, `DateCalculator`, `DateFormatter`, `ensureDate`, `FileSizeFormatter`, `copyToClipboard`, `isClipboardSupported`, `convertMarkdownToHtml`, type `BreakPointType` |
| Tests | Vitest 5 + jsdom + Testing Library (`src/test/setup.ts`) |
| Qualité | ESLint 10 (js, typescript-eslint, react-hooks, react-refresh), Prettier, Husky (`pre-commit` → tests) |

## 3. Arborescence

```
src/
├── App.tsx, main.tsx     # initThemeStore() ; ThemeProvider + GlobalStyle + UIProvider + RouterProvider + ToastContainer ; checkSession()
├── hooks/                # hooks locaux (useAuth, useTheme, useGeoLocation, useJournalAutoLock) + index.ts
├── layouts/              # AppLayout (espace connecté), AuthLayout (pages publiques)
├── pages/<domaine>/      # <Xxx>Page.tsx + components/ + index.ts (barrel)
│   ├── admin/            # EmailPreviewPage, LogsPage
│   ├── auth/             # Login, Register, Forgot/ResetPassword, VerifyEmail, ConfirmEmailChange, Profile, Logout
│   ├── journal/          # JournalPage (5 onglets) + components/ (composer, cartes, tags, verrou)
│   ├── tags/             # TagsPage
│   └── todos/            # TodoPage
├── router/               # index.tsx + gardes protected/public/admin
├── services/             # fetchAPI, apiError, storage + <domaine>.api.ts (auth, emailPreview, log, tag, todo, journal)
├── stores/               # stores zustand (auth.store.ts, journal.store.ts)
├── types/                # <domaine>.types.ts (contrats API)
├── components/           # composants partagés construits sur core-react/ui (PageHeader, Section, TagBadge…)
├── theme/                # createAppTheme() de core-react/theme
└── utils/                # fonctions pures (+ tests unitaires)
```

Conventions : styles locaux dans `<Composant>.styles.ts(x)` importés en `import * as S from './X.styles'` ; props stylées transitoires préfixées `$` ; un fichier `index.ts` par dossier exporte l'API publique.

## 4. Client HTTP — `services/fetchAPI.ts`

| Règle | Détail |
|---|---|
| URL | `VITE_API_URL` + endpoint (les URL absolues `http(s)://` sont utilisées telles quelles). **`VITE_API_URL` doit inclure `/api`** (les services appellent `/auth/login`, `/account/...`). |
| Auth | Ajoute `Authorization: Bearer <token>` depuis `localStorage` (`todo_auth_token`) si l'en-tête n'est pas déjà fourni. |
| Corps | Objet → JSON (`Content-Type: application/json` auto) ; `FormData`, `Blob`, `URLSearchParams`, `string` envoyés tels quels. |
| Statuts | **Ne lève jamais** sur un statut HTTP (`validateStatus: () => true`) : renvoie `{ ok, status, headers, raw, data | text | blob }`. 204 → `data: null`. |
| Formats | `responseType`: `json` (défaut), `text`, `blob` (surcharges typées). |

### Contrat des services `<domaine>.api.ts`
Une fonction `async` par endpoint qui **retourne la donnée typée** ou **lève une `ApiError`** :
```ts
const res = await fetchAPI<User>('/account/profile');
if (!res.ok) throw toApiError(res, 'Message de repli');
return res.data;
```

## 5. Erreurs — `services/apiError.ts`

| Élément | Rôle |
|---|---|
| `ApiError` | `message`, `status`, `violations: Record<champ, message>`, `code` métier (ex. `email_not_verified`) |
| `toApiError(res, fallback)` | Message = `data.message`, sinon concaténation des violations, sinon `fallback` |
| `getErrorMessage(err, fallback)` | Message affichable |
| `getFieldErrors(err)` | Violations → à injecter dans `setError` (react-hook-form) |
| `getErrorCode(err)` | Code métier ou `null` |

## 6. État global — `stores/`

| Store | État | Persistance |
|---|---|---|
| `useAuthStore` (`stores/auth.store.ts`) | `token`, `user`, `isLoading` ; actions `setAuth`, `setUser`, `logout`, `checkSession` | `localStorage` `todo_auth_token` (via `appStorage`) |
| `useJournalStore` (`stores/journal.store.ts`) | `token` (`jCodeToken`), `isUnlocked`, `security` (statut de protection) ; actions `unlock(token)`, `lock()`, `syncSession()`, `loadSecurity()`, `setSecurity()` ; sélecteurs `selectLockActive`, `selectCanSeePrivate` | `sessionStorage` `ffr.v4_jtkn` (via `sessionAppStorage`) |
| Store de thème (`core-react/theme`) | `preference` (`light`/`dark`/`system`), `mode` | `localStorage` `ds-app-theme` (initialisé par `initThemeStore()`) |

`services/storage.service.ts` : `appStorage` (`localStorage`) et `sessionAppStorage` (`sessionStorage`), instances de `StorageService` (`core-ts`).

## 7. Hooks — `hooks/` & `core-react`

| Hook | Source | Rôle |
|---|---|---|
| `useAuth()` | `src/hooks/useAuth.ts` | Vue dérivée de la session : `isAuth`, `user`, `role`, `isAdmin`, `roleLabel`, `isLoading`, `token`, `logout` (alias `useIsAuth`) |
| `useTheme()` | `src/hooks/useTheme.ts` (`core-react/theme`) | `theme`, `mode`, `preference`, `isDark`, `setPreference`… Synchronise `data-theme`, `data-ds-theme` et `color-scheme` sur `<html>` |
| `useGeolocation(initial?)` | `src/hooks/useGeoLocation.tsx` | Géolocalisation navigateur + géocodage inverse OpenStreetMap Nominatim (`status`, `location`, `errorMessage`, `requestLocation`, `clearLocation`) |
| `useJournalAutoLock()` | `src/hooks/useJournalAutoLock.ts` | Si la protection est active, verrouille l'onglet Privé après **90 s** (`JOURNAL_AUTO_LOCK_DELAY_MS`) passées hors focus (`usePageFocus` + `useActionTimer` de `core-react`) |
| `useActionTimer`, `useClipboard`, `useToggle`, `usePageFocus` | `core-react` | Hooks transverses fournis directement par le package `core-react` |

## 8. Utilitaires — `utils/`

| Fonction | Fichier | Rôle |
|---|---|---|
| `encodeSecret(value)` | `utils/secret.ts` | Base64 UTF-8 des secrets envoyés à l'API |
| `decodeToken(token)`, `isTokenValid(token)` | `utils/jwt.ts` | Lecture du payload JWT et contrôle de `exp` (sans vérification de signature) |
| `ROLE_LABELS`, `getPrimaryRole(roles)`, `getRoleLabel(roles)` | `utils/role.ts` | Rôle principal (`ROLE_ADMIN` prioritaire) et libellé aligné sur `RoleEnum::mapRole()` |
| `truncateWords(text, max = 100)` | `utils/string.ts` | Troncature par mots avec « … » |
| `getFileIcon(file)`, `DEFAULT_FILE_ICON` | `utils/fileIcon.ts` | Résout le nom d'icône MDI d'une pièce jointe à partir de `file.type` (`FileTypeEnum` de `core-php`) ou, à défaut, de `file.mimeType` |
| `dueDateEnumToIso(enum)`, `isoToDueDateCategory(iso)` | `utils/dueDate.resolver.ts` | Conversion entre les catégories d'échéance (`overdue`, `today`, `tomorrow`, `this_week`, `later`, `none`) et les dates ISO 8601 calées à `23:59:59` |

## 9. Routage — `router/index.tsx`

| Groupe | Garde / layout | Routes |
|---|---|---|
| Espace connecté (socle) | `ProtectedRoute` → `AppLayout` | `/` (redirige vers `/todos`), `/profile`, `/admin` → `AdminRoute` : `/admin/emails`, `/admin/logs` |
| Espace connecté (métier) | `ProtectedRoute` → `AppLayout` | `/todos` (`?tab=tags`), `/tags` → redirection `/todos?tab=tags`, `/journal` (`?tab=feed\|memories\|bookmarks\|tags\|private`, `&tag=`), `/profile` (`?tab=security\|journal\|danger`) |
| Déconnexion | `ProtectedRoute` (sans layout) | `/logout` |
| Public | `PublicRoute` → `AuthLayout` | `/login`, `/register`, `/forgot-password` |
| Liens e-mail | `AuthLayout` (sans garde) | `/verify-email`, `/reset-password`, `/confirm-email-change` |
| Fallback | — | `*` → `/` |

## 10. Layouts — `layouts/`

| Layout | Contenu |
|---|---|
| `AppLayout` | `Sidebar` (16 rem, repliable sous `md`) : **Espaces de travail** (`Tâches` `/todos`, `Journal` `/journal`) et **Administration** (`E-mails`, `Logs`, si `isAdmin`) ; `Navbar` avec `ThemeModeSwitcher` et menu du compte (profil, Se déconnecter) ; contenu dans un `Container` de 72 rem. Détail : [design_system_module.md](design_system_module.md#4-shell). |
| `AuthLayout` | Carte centrée : logo, sélecteur de thème, `<Outlet />`. |

## 11. Tests

`npm test` (= `vitest run`) ; exécuté en `pre-commit`. Suites de tests unitaires présentes : `dueDate.resolver.test.ts`, `fileIcon.test.ts`, `jwt.test.ts`, `role.test.ts`, `secret.test.ts`, `string.test.ts`, `authSchemas.test.ts`, `logFormat.test.ts`, `logException.test.ts`, `journal.test.ts` (onglets, `FormData` multipart, dates relatives) et `test/icons.test.ts` (toutes les icônes utilisées existent dans `core-react/icons`).

> Sous Windows, lancer `npm test` depuis un chemin `D:\…` (lettre de lecteur en majuscule) : depuis `d:\…` (terminal VS Code), vitest est chargé deux fois et toutes les suites échouent (« failed to find the current suite »).

## 12. Écarts & points ouverts

- La clé `todo_auth_token` est dupliquée dans `fetchAPI.ts` et `auth.store.ts` : à centraliser (et renommer par projet).
- `<ToastContainer />` est monté dans `App.tsx`, mais les retours utilisateur des pages passent encore par des `Alert` locales.
- Aucune interception globale du 401 : un jeton révoqué ou invalide n'est détecté qu'au prochain `checkSession()` (rechargement).
- `fetchAPI` envoie le JWT à toute URL absolue passée en paramètre (y compris un domaine tiers).
- `index.html` : `lang="en"` alors que l'interface est en français.

## 13. Sources

`frontend/src/{App,main}.tsx`, `src/services/{fetchAPI,apiError,storage.service}.ts`, `src/stores/{auth,journal}.store.ts`, `src/hooks/*`, `src/utils/*`, `src/router/*`, `src/layouts/*`, `vite.config.ts`, `package.json`.
