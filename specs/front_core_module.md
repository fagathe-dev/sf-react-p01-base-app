# Front — Socle applicatif

## 1. Objet

Architecture et briques transverses du front React : client HTTP, gestion d'erreurs, état global, hooks, utilitaires, routage et layouts. Le design system est décrit dans [design_system_module.md](design_system_module.md).

## 2. Stack

| Élément | Choix |
|---|---|
| Build | Vite 8, TypeScript 6 (`strict`, `noUncheckedIndexedAccess`), alias `@` → `src` |
| UI | React 19, styled-components 6 |
| Routage | react-router-dom 7 (`createBrowserRouter`) |
| État | zustand 5 |
| Formulaires | react-hook-form + zod 4 (`@hookform/resolvers`) |
| HTTP | axios (encapsulé dans `fetchAPI`) |
| Utilitaires maison | `core-ts` (Git `fagathe-dev/core-ts#master`) : `StorageService`, `DateCalculator`, `DateFormatter`, `ensureDate`, `FileSizeFormatter`, `copyToClipboard`, `isClipboardSupported`, `convertMarkdownToHtml`, type `BreakPointType` |
| Tests | Vitest + jsdom + Testing Library (`src/test/setup.ts`) |
| Qualité | ESLint (js, typescript-eslint, react-hooks, react-refresh), Prettier, Husky (`pre-commit` → tests) |

## 3. Arborescence

```
src/
├── App.tsx, main.tsx     # ThemeProvider + GlobalStyle + RouterProvider ; checkSession() au montage
├── hooks/                # hooks transverses (+ index.ts)
├── layouts/              # AppLayout (espace connecté), AuthLayout (pages publiques)
├── pages/<domaine>/      # <Xxx>Page.tsx + components/ + index.ts (barrel)
├── router/               # index.tsx + gardes protected/public/admin
├── services/             # fetchAPI, apiError, storage + <domaine>.api.ts
├── stores/               # stores zustand
├── types/                # <domaine>.types.ts (contrats API)
├── ui/                   # design system
└── utils/                # fonctions pures (+ tests)
```

Conventions : styles locaux dans `<Composant>.styles.tsx` importés en `import * as S from './X.styles'` ; props stylées transitoires préfixées `$` ; un fichier `index.ts` par dossier exporte l'API publique.

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
| `useAuthStore` | `token`, `user`, `isLoading` ; actions `setAuth`, `setUser`, `logout`, `checkSession` | `localStorage` `todo_auth_token` (via `appStorage`) |
| `useThemeStore` (dans `hooks/useTheme.ts`) | `preference` (`light`/`dark`/`system`), `systemMode` | zustand `persist`, clé `ds-app-theme`, v1 (migration v0 → v1) |

`services/storage.service.ts` : `appStorage` (local) et `sessionAppStorage` (session), instances de `StorageService` (`core-ts`).

## 7. Hooks — `hooks/`

| Hook | Rôle |
|---|---|
| `useAuth()` | Vue dérivée de la session : `isAuth`, `user`, `role`, `isAdmin`, `roleLabel`, `isLoading`, `token`, `logout` (alias `useIsAuth`) |
| `useTheme()` | `theme` (objet styled-components), `mode`, `preference`, `isDark`, `setPreference`… Synchronise `data-theme`, `data-ds-theme` et `color-scheme` sur `<html>` et suit le réglage système en direct |
| `useActionTimer({ type, delay, action, onCleanUp })` | `setTimeout` / `setInterval` déclaratif ; `delay: null` = en pause ; callbacks toujours à jour sans recréer le timer |
| `useClipboard({ feedbackDuration, onSuccess, onError })` | `copy(text)`, `hasCopied` (2 s par défaut), `error`, `isSupported` |
| `useToggle(initial)` | `[value, toggle(next?)]` |

## 8. Utilitaires — `utils/`

| Fonction | Rôle |
|---|---|
| `encodeSecret(value)` | Base64 UTF-8 des secrets envoyés à l'API |
| `decodeToken(token)`, `isTokenValid(token)` | Lecture du payload JWT et contrôle de `exp` (sans vérification de signature) |
| `ROLE_LABELS`, `getPrimaryRole(roles)`, `getRoleLabel(roles)` | Rôle principal (`ROLE_ADMIN` prioritaire) et libellé aligné sur `RoleEnum::mapRole()` |
| `truncateWords(text, max = 100)` | Troncature par mots avec « … » |

## 9. Routage — `router/`

| Groupe | Garde / layout | Routes du socle |
|---|---|---|
| Espace connecté | `ProtectedRoute` → `AppLayout` | `/` (redirection vers l'accueil du projet), `/profile`, `/admin` → `AdminRoute` : `/admin/emails`, `/admin/logs` |
| Déconnexion | `ProtectedRoute` (sans layout) | `/logout` |
| Public | `PublicRoute` → `AuthLayout` | `/login`, `/register`, `/forgot-password` |
| Liens e-mail | `AuthLayout` (sans garde) | `/verify-email`, `/reset-password`, `/confirm-email-change` |
| Fallback | — | `*` → `/` |

## 10. Layouts — `layouts/`

| Layout | Contenu |
|---|---|
| `AppLayout` | `Sidebar` (260 px, repliable sous `md`) : marque, sections de navigation déclarées en tableaux `{ label, path, icon }`, section admin visible si `isAdmin` ; `Navbar` avec menu compte (avatar, nom, badge de rôle, `ThemeModeSwitcher`, liens Profil / Déconnexion) ; zone de contenu scrollable dans un `Container` |
| `AuthLayout` | Carte centrée : logo, sélecteur de thème, `<Outlet />` |

## 11. Tests

`npm test` (= `vitest run`) ; exécuté en `pre-commit`. Couverture du socle : `useActionTimer`, `jwt`, `role`, `secret`, `string`, `authSchemas`, `logFormat`, `logException`.

## 12. Écarts & points ouverts

- La clé `todo_auth_token` est dupliquée dans `fetchAPI.ts` et `auth.store.ts` : à centraliser (et renommer par projet).
- Le système de toasts (`ToastContainer` / `useToast`) existe dans `ui/` mais **n'est monté nulle part** : les retours utilisateur passent par des `Alert` locales.
- Aucune interception globale du 401 : un jeton révoqué ou invalide n'est détecté qu'au prochain `checkSession()` (rechargement).
- `fetchAPI` envoie le JWT à toute URL absolue passée en paramètre (y compris un domaine tiers).
- `index.html` : `lang="en"` alors que l'interface est en français.
- `frontend/README.md` est le README par défaut du template Vite.

## 13. Sources

`frontend/src/{App,main}.tsx`, `src/services/{fetchAPI,apiError,storage.service}.ts`, `src/stores/auth.store.ts`, `src/hooks/*`, `src/utils/*`, `src/router/*`, `src/layouts/*`, `vite.config.ts`, `tsconfig.app.json`, `eslint.config.js`, `.prettierrc`, `.husky/pre-commit`.
