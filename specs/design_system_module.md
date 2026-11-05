# Module Design System

## 1. Objet

Bibliothèque de composants et de thème (`frontend/src/ui/`), **indépendante du métier**, destinée à être copiée telle quelle dans chaque projet.
La documentation d'usage détaillée (props, exemples) existe déjà dans `frontend/src/ui/docs/` ; ce fichier en est la carte et fixe les règles.

## 2. Règles

| ID | Règle |
|---|---|
| RG-DS-01 | `ui/` ne dépend d'aucun code métier : seules dépendances autorisées hors `ui/` = `@/hooks/useTheme` (pour `ThemeModeSwitcher`) et `core-ts` (`BreakPointType`). |
| RG-DS-02 | Tout composant étend un contrat de `ui/types/components.types.ts` : `BaseComponentProps` (`id`, `className`, `style`, `children`, `as`), `ClickableComponentProps` (+ `onClick`, `disabled`, `tabIndex`, `role`, `aria-label`), `InputComponentProps<T>` (+ `name`, `value`, `defaultValue`, `readOnly`, `required`, `onChange`), `OnInputComponentProps<T>` (+ `onInput`, `onKeyDown`, `onKeyUp`). |
| RG-DS-03 | Les styles utilisent **exclusivement les tokens du thème** (`theme.spacing`, `theme.radii`, `theme.colors.<rôle>`…) ; pas de valeur en dur. |
| RG-DS-04 | Les couleurs passent par les **rôles sémantiques** (`primary`, `secondary`, `tertiary`, `success`, `info`, `warning`, `danger`, `neutral`) et leurs alias `base`, `hover`, `subtle`, `dark`, `emphasis`, qui s'adaptent au mode sombre. Les palettes brutes (`theme.colors.palettes.*`) sont réservées aux nuances qui ne doivent pas changer. |
| RG-DS-05 | Contraste du focus et des textes : WCAG AA visé (ex. anneau de focus dark ≥ 3:1). |
| RG-DS-06 | Composants composés (Card, Modal, Tabs, Sidebar, Navbar, Dropdown, Accordion, Pagination…) : un composant racine + sous-composants partageant un Context. |
| RG-DS-07 | Chaque dossier de catégorie expose ses composants via `index.ts`. |
| RG-DS-08 | Responsive mobile-first via `theme.media.up(key)` / `theme.media.down(key)`. |

## 3. Thème

| Élément | Détail |
|---|---|
| Thèmes | `lightTheme`, `darkTheme` (`ui/theme/theme.ts`), type `AppTheme` déclaré comme `DefaultTheme` de styled-components |
| Choix | `useTheme()` : préférence `light` / `dark` / `system` persistée ([front_core_module.md §7](front_core_module.md#7-hooks--hooks)) ; attributs `data-theme` / `data-ds-theme` sur `<html>` |
| Tokens (`ui/theme/tokens/`) | `colors` (`palettes` olive / taupe / slate…, `staticColors`, `getColors(mode)` → rôles + `background`, `text`, `border`), `spacing`, `radii`, `typography` (`fonts`, `weights`…), `getShadows(mode)`, `borders` (`widths`, `focusRing`), `breakpoints` |
| Breakpoints | `sm` 576 · `md` 768 · `lg` 992 · `xl` 1200 · `xxl` 1400 px |
| Global | `GlobalStyle` : reset, polices Google Fonts (Noto Sans, Quicksand, Roboto, Roboto Flex) |
| Icônes | `public/assets/ds-icons.css` + polices locales ; `<Icon name>` : Material Design Icons par défaut (`mdi`), Boxicons via `iconSet` ou préfixes `bx-`, `bxs-`, `bxl-` |

## 4. Catalogue

| Catégorie | Composants exportés | Doc |
|---|---|---|
| Base | `Avatar`, `Badge`, `Button`, `Divider`, `Icon`, `IconButton`, `Link`, `SegmentedControl` | `docs/components/base_components_usage.md` |
| Typo | `Title`, `Display`, `Lead`, `Text` | `typo_components_usage.md` |
| Grid | `Container`, `Row`, `Col` (12 colonnes), `Grid`, `Flex`, `Columns` (masonry) | `grid_components_usage.md` |
| Content | `Accordion`, `Card`, `EmptyState`, `ListGroup`, `StatCard`, `Table` | `content_component_usage.md` |
| Forms | Atomes `Input`, `Textarea`, `Select`, `Checkbox`, `Radio`, `Toggle`, `Label` (`HelperText` non exporté) ; champs `TextField`, `TextareaField`, `ChoiceField`, `CheckField`, `ToggleField` ; enrichis `InputGroup`, `TagInput`, `FileDropzone` | `forms_components_usage.md` |
| Feedback | `Alert`, `Loading`, `Progress`, `Skeleton`, `Modal` / `Dialog` / `ConfirmDialog`, `Toast` / `useToast`, `Drawer`, `Tooltip` | `feedback_components_usage.md` |
| Navigation | `Navbar` (+ dropdown), `Sidebar`, `Tabs`, `Pagination`, `Dropdown`, `Breadcrumb`, `BackButton`, `ThemeModeSwitcher` | `navigation_components_usage.md` |
| Embed | `Image`, `Video`, `Figure` (+ `Carousel`, `Gallery` non exportés) | `embed_components_usage.md` |
| Editor | `BlockWrapper`, `BlockPicker` (+ `ImageBlock`, `VideoBlock`, `CarouselBlock` non exportés) | `docs/features/editor_usage.md` |

Contrat de création d'un composant : `docs/components/component_contracts_types.md`. Thème : `docs/theme_usage.md`.

## 5. Écarts & points ouverts

- `Carousel`, `Gallery`, `ImageBlock`, `VideoBlock`, `CarouselBlock`, `HelperText` existent mais ne sont pas exportés par leur `index.ts`.
- Pas de barrel global `ui/components/index.ts` : imports par catégorie (`@/ui/components/Base`…).
- `Toast` / `useToast` : aucun `ToastContainer` monté dans l'application.
- Polices chargées depuis Google Fonts (`@import` dans `GlobalStyle`) : dépendance externe et sujet RGPD ; à auto-héberger si nécessaire.
- Aucun test ni Storybook pour les composants `ui/`.
- Des couleurs en dur subsistent dans certaines pages (ex. `#e7000b`, `#dc2626`, `#b91c1c`) en violation de RG-DS-03.

## 6. Sources

`frontend/src/ui/{components,theme,types,docs}/**`, `frontend/public/assets/**`, `frontend/src/hooks/useTheme.ts`.
