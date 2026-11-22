# Design System & UI Kit (v2)

## 1. Objet

L'interface utilise **exclusivement** le UI Kit de `core-react` : composants de `core-react/ui`, icônes de `core-react/icons`, thème de `core-react/theme`. Il n'y a plus de couche d'adaptation : l'ancien barrel `src/ui/components` (`withLegacyProps`) a été supprimé, chaque fichier importe directement `core-react/ui` avec les props transitoires `$`.

- `src/theme/index.ts` : thème de l'app via `createAppTheme()` (identité DS : primary indigo) → `appTheme` + `cssVariables`, branchés dans `App.tsx` (`ThemeProvider`, `GlobalStyle`, `UIProvider` avec `RouterLink`, `ToastContainer`).
- `src/hooks/useTheme.ts` : réexporte le store de thème de `core-react/theme` (clé `ds-app-theme`), utilisé par `ThemeModeSwitcher` (barre de navigation).

## 2. Règles

| ID | Règle |
|---|---|
| RG-DS-01 | Composants importés uniquement depuis `core-react/ui` (et `core-react` pour les hooks : `useDebouncedValue`, `UIProvider`…). Aucun composant d'interface « maison » ne réimplémente un composant du kit (tiroir, modale, menu déroulant, toast, confirmation…). |
| RG-DS-02 | Props de style **transitoires `$`** (`$variant`, `$size`, `$color`, `$gap`…). `IconButton`, `Alert`, `Loading`, `Modal`, `Drawer`, `Dropdown.*` gardent leurs props normales (`variant`, `size`, `isOpen`…) selon leur contrat. |
| RG-DS-03 | **Tokens uniquement** dans les styled-components : `theme.colors.<rôle>.*`, `text|background|border.*`, `spacing[n]`, `radii.*`, `typography.*`, `shadows.*`, `media.*`. Aucune couleur en dur, aucun `style={{…}}`. Seule exception : les couleurs des tags (`tagColors`, données de l'API), passées au `Badge` via `$color` comme le prévoit le kit. |
| RG-DS-04 | `import { styled } from 'styled-components'` (jamais l'import par défaut). Étendre un composant « lien » du kit via sa base (`ButtonBase`), jamais `styled(Button)` / `styled(IconButton)`. |
| RG-DS-05 | Markdown affiché avec `MarkdownViewer` (aucun HTML injecté) ; saisi avec `MarkdownEditor`. `convertMarkdownToHtml` / `dangerouslySetInnerHTML` sont proscrits. |
| RG-DS-06 | Noms d'icônes : uniquement ceux de `core-react/icons` (`iconNames`). Le test `src/test/icons.test.ts` échoue si un nom inconnu (y compris dans un ternaire) est utilisé. |
| RG-DS-07 | `Card` du kit a `overflow: hidden` : une carte qui contient un `Dropdown` doit le surcharger (`overflow: visible`) pour que le menu ne soit pas coupé. |

## 3. Composants partagés de l'app (`src/components/`)

| Composant | Rôle |
|---|---|
| `PageHeader` | En-tête de page : icône, titre `h1`, description, actions |
| `Section` | Section titrée avec compteur (`Badge`) |
| `AuthCard` | Carte des écrans publics (connexion, inscription, liens e-mail) |
| `SettingsCard` | Carte de réglage du profil (formulaire optionnel, actions en pied) |
| `FullScreenLoader` | Attente plein écran (session, déconnexion) |
| `TagBadge` / `ColorDot` | Pastille et point de couleur d'un tag (`ColorEnum` → `tagColors`) |
| `ColorSwatchPicker` | Choix d'une couleur de tag (groupe radio accessible) |
| `FilterChip` / `FilterChipRow` | Puces à bascule (`aria-pressed`) : filtres par tag, échéances, tags du journal |

## 4. Shell

- `AppLayout` : `Sidebar` (16 rem, tiroir sous `md`) — *Espaces de travail* : Tâches, Journal ; *Administration* (admin) : E-mails, Logs. `Navbar` : `SidebarToggle`, `ThemeModeSwitcher` et menu du compte (profil, rôle, Mon profil, Se déconnecter). Contenu dans un `Container` (72 rem max).
- `AuthLayout` : fond dégradé `primary.subtle`, `ThemeModeSwitcher` en haut à droite, carte centrée (26 rem).

## 5. Écarts & points ouverts

- Aucune vérification visuelle automatisée (pas de Storybook dans l'app) : la conformité repose sur le typecheck, le lint, le test d'icônes et une revue manuelle.

## 6. Sources

`frontend/src/theme/index.ts`, `frontend/src/components/`, `frontend/src/layouts/`, `frontend/src/App.tsx`, `frontend/src/test/icons.test.ts`, `node_modules/core-react/docs/`.
