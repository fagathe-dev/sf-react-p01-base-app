# Module Email Preview

## 1. Objet

Permettre aux administrateurs de **visualiser le rendu HTML** de chaque e-mail transactionnel avec des données factices, sans rien envoyer.

## 2. Règles métier

| ID | Règle |
|---|---|
| RG-PREV-01 | Réservé à `ROLE_ADMIN` (access control `^/api/admin` + `#[IsGranted('ROLE_ADMIN')]`). |
| RG-PREV-02 | Chaque e-mail prévisualisable est identifié par un **slug** kebab-case (`[a-z-]+`) déclaré dans `EmailMockService::PREVIEWS` avec `label` et `description`. |
| RG-PREV-03 | Les données factices utilisent le destinataire `Jane Doe <jane.doe@example.com>`, un jeton et des codes à 6 chiffres aléatoires (régénérés à chaque rendu), le mot de passe `MotDePasse123` pour l'e-mail admin, et `FRONTEND_URL` (défaut `http://localhost:5173`). |
| RG-PREV-04 | Le rendu passe par le **même handler** que l'envoi réel (`EmailDispatcherService::createEmail`) : objet, expéditeur, destinataires, template et contexte sont identiques à la production. Aucun contrôle de délivrabilité ni envoi. |
| RG-PREV-05 | Slug inconnu → 404. |

## 3. API — `/api/admin/emails`

| Méthode | Route | Réponse |
|---|---|---|
| GET | `/admin/emails` | 200 `EmailPreview[]` |
| GET | `/admin/emails/{slug}` | 200 **HTML** (`text/html`, rendu Twig) · 404 slug inconnu |

```ts
interface EmailPreview {
  slug: string;            // ex. "forgot-password"
  label: string;           // ex. "Mot de passe oublié"
  description: string;
  subject: string | null;
  from: { name: string | null; email: string }[];
  to:   { name: string | null; email: string }[];
}
```

Slugs disponibles : `account-verification`, `otp-verification`, `registration-confirmed`, `forgot-password`, `email-change-verification`, `account-deletion-code`, `admin-account-created`.

## 4. Frontend

Route `/admin/emails` (`EmailPreviewPage`, gardes `ProtectedRoute` → `AdminRoute`) ; `/admin` redirige ici.

| Zone | Comportement |
|---|---|
| Liste | Chargée au montage ; le premier e-mail est sélectionné et rendu automatiquement |
| Métadonnées | Expéditeur (« Expéditeur non configuré » si absent), destinataire, objet |
| Aperçu | HTML récupéré en texte (`fetchAPI(..., { responseType: 'text' })`) puis affiché dans une `<iframe srcDoc sandbox="">` : aucun script ni navigation possible |
| Action | Bouton de rafraîchissement du rendu courant |

Services : `fetchEmailPreviews()`, `fetchEmailPreviewHtml(slug)` (`src/services/emailPreview.api.ts`). Types : `src/types/emailPreview.types.ts`.

## 5. Ajouter un e-mail à la prévisualisation

1. Ajouter l'entrée `slug => [label, description]` dans `EmailMockService::PREVIEWS`.
2. Ajouter le cas `slug => new XxxMailDto(...)` dans `EmailMockService::createMock()`.
Aucune modification front n'est nécessaire.

## 6. Écarts & points ouverts

- La liste `PREVIEWS` et le `match` de `createMock()` sont deux sources à maintenir en parallèle (risque d'oubli) ; le handler map du dispatcher en est une troisième.
- La route `/{slug}` renvoie l'erreur 404 HTML standard de Symfony (et non `{ message }`).

## 7. Sources

API : `src/Controller/EmailPreviewerController.php`, `src/Service/EmailMockService.php`.
Front : `src/pages/admin/EmailPreviewPage.tsx`, `src/services/emailPreview.api.ts`, `src/types/emailPreview.types.ts`, `src/router/adminRoute.tsx`.
