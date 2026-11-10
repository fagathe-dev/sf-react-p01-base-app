# Module Email Preview

## 1. Objet

Permettre aux administrateurs de **visualiser le rendu HTML** de chaque e-mail transactionnel avec des données factices, sans rien envoyer.

## 2. Règles métier

| ID | Règle |
|---|---|
| RG-PREV-01 | Réservé à `ROLE_ADMIN` (access control `^/api/admin` + `#[IsGranted('ROLE_ADMIN')]`). |
| RG-PREV-02 | Chaque e-mail prévisualisable est identifié par un **slug** kebab-case (`[a-z-]+`) porté par une classe `App\Mailer\Preview\*MailPreview` (`getSlug()`, `getLabel()`, `getDescription()`, `createDto()`). L'ordre d'affichage suit `#[AsTaggedItem(priority: …)]` (la plus haute en premier). |
| RG-PREV-03 | Les données factices utilisent le destinataire `Jane Doe <jane.doe@example.com>`, un jeton et des codes à 6 chiffres aléatoires (régénérés à chaque rendu), le mot de passe `MotDePasse123` pour l'e-mail admin, et `FRONTEND_URL` (défaut `http://localhost:5173`). Les durées reprennent les constantes des services (`AuthService`, `AccountService`, `AdminUserManager`). |
| RG-PREV-04 | Le rendu passe par le **même handler** que l'envoi réel (`MailDispatcher::createEmail`) puis par le `BodyRenderer` de l'envoi : objet, expéditeur, destinataires, template, contexte et HTML sont identiques à la production. Aucun contrôle de délivrabilité ni envoi. |
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

Créer une classe `src/Mailer/Preview/XxxMailPreview.php` qui étend `AbstractMailPreview` (liens factices via `frontendUrl()`, `fakeToken()`, `fakeCode()`) et porte `#[AsTaggedItem(priority: …)]`. `EmailPreviewService` la découvre seul ; aucune modification front n'est nécessaire.

## 6. Écarts & points ouverts

- La route `/{slug}` renvoie l'erreur 404 HTML standard de Symfony (et non `{ message }`).

## 7. Sources

API : `src/Controller/EmailPreviewerController.php`, `src/Service/EmailPreviewService.php`, `src/Mailer/Preview/*`.
Front : `src/pages/admin/EmailPreviewPage.tsx`, `src/services/emailPreview.api.ts`, `src/types/emailPreview.types.ts`, `src/router/adminRoute.tsx`.
