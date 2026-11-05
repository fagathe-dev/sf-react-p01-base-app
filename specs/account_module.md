# Module Account

## 1. Objet

Gestion du compte par l'utilisateur connecté : profil, avatar, adresse e-mail, mot de passe et suppression définitive du compte.

> Hors socle : le **code secret du journal** (`/account/journal-passcode*`) est spécifique à ce projet et doit être retiré au clonage ([extraction_guide.md §3.4](extraction_guide.md#34-accountservice)).

## 2. Règles métier

| ID | Règle |
|---|---|
| RG-ACC-01 | Profil modifiable : `username` (obligatoire, 3–90, unique), `firstname`, `lastname` (≤ 80, chaînes vides → `null`). Valeurs *trimées*. |
| RG-ACC-02 | Avatar : un fichier JPEG, PNG, WEBP ou GIF de **5 Mo max**. Le nouveau fichier remplace l'ancien (ancien supprimé du disque). Stocké dans `public/uploads/avatars/<userId>/`, exposé en **URL absolue** (`DEFAULT_URI` + chemin). |
| RG-ACC-03 | Changement d'e-mail en **deux étapes** : la demande n'altère pas l'adresse actuelle ; un lien valable **24 h** est envoyé à la **nouvelle** adresse (`FRONTEND_URL/confirm-email-change?token=`). |
| RG-ACC-04 | La nouvelle adresse doit être différente de l'actuelle (comparaison insensible à la casse) et non utilisée. Elle est stockée en minuscules. |
| RG-ACC-05 | À la confirmation, l'unicité est revérifiée (409 si l'adresse a été prise entre-temps, la demande est alors consommée). Le clic vaut vérification : `emailVerifiedAt` est mis à jour. |
| RG-ACC-06 | La confirmation est **publique** (le jeton fait foi) : elle fonctionne connecté ou non, depuis n'importe quel navigateur. |
| RG-ACC-07 | Changement de mot de passe : mot de passe actuel obligatoire et correct ; nouveau mot de passe ≥ 8 caractères avec minuscule, majuscule et chiffre. |
| RG-ACC-08 | Suppression en **deux étapes** : envoi d'un code à 6 chiffres valable **10 min**, puis saisie du code. |
| RG-ACC-09 | Un nouveau code de suppression ne peut être demandé qu'après **30 s** (429 sinon). Si l'e-mail échoue, le code est révoqué (502). |
| RG-ACC-10 | Après **5 codes erronés**, le code est révoqué (429). |
| RG-ACC-11 | La suppression efface les fichiers physiques de l'utilisateur (avatar + fichiers métier), puis l'utilisateur et, en cascade, ses `UserRequest`. Elle est **irréversible**. |

## 3. Modèle de données

Utilise `User` et `UserRequest` (types `email_change` avec `payload.new_email`, `account_deletion`). Voir [api_core_module.md §6](api_core_module.md#6-modèle-de-données-du-socle).

## 4. API — `/api/account` (authentifié)

| Méthode | Route | Corps | Succès | Erreurs |
|---|---|---|---|---|
| GET | `/account/profile` | — | 200 `user` | 401 |
| PUT / PATCH | `/account/profile` | `{ username, firstname?, lastname? }` | 200 `user` | 400 format / violations (dont username pris) · 500 |
| PUT / PATCH | `/account/email` | `{ email }` | 200 `{ message }` | 400 violations (même adresse, déjà utilisée) · 422 domaine injoignable · 502 envoi · 500 |
| PUT / PATCH | `/account/password` | `{ currentPassword*, newPassword* }` | 200 `{ message }` | 400 format / violations · 422 mot de passe actuel incorrect |
| POST | `/account/avatar` | multipart, champ `avatar` (ou `file`) | 200 `user` | 400 violations (absent, type, taille) · 422 upload refusé · 500 |
| POST | `/account/delete-request` | — | 200 `{ message, expiresIn: 600, resendAvailable: 30 }` | 429 renvoi trop rapide · 502 envoi · 500 |
| DELETE | `/account` | `{ code }` | **204** | 400 code non conforme (≠ 6 chiffres) · 422 code invalide / expiré · 429 trop de tentatives · 500 |
| POST | `/auth/confirm-email-change` *(public)* | `{ token }` (ou `?token=`) | 200 `{ user, message }` | 422 token manquant · 400 invalide / expiré / payload absent · 409 adresse prise |

`*` = encodé en base64. `user` = groupe `user.read`.
Clés de cache : `account_deletion_code_sent_<userId>` (30 s), `account_deletion_attempts_<userId>` (10 min).

## 5. Frontend

### Route `/profile` (`ProfilePage`, sous `AppLayout`)

| Zone | Composant | Comportement |
|---|---|---|
| En-tête | `ChangeAvatarForm` | Clic sur l'avatar → sélecteur (`accept` = 4 types autorisés) → upload immédiat → `setUser` |
| Onglet **Informations** | `ChangeInformationsForm` | Username, prénom, nom → `setUser` |
| Onglet **Sécurité** | `ChangeEmailForm` | Message : l'adresse change après clic sur le lien |
| | `ChangePasswordForm` | Actuel + nouveau + confirmation (vérifiée côté client) ; champs vidés après succès |
| Onglet **Zone de danger** | `DeleteAccountCard` | `window.confirm` → envoi du code → saisie avec compte à rebours (expiration / renvoi) → succès : `logout()` + redirection `/login` |

### Route `/confirm-email-change?token=` (`ConfirmEmailChangePage`, sous `AuthLayout`, sans garde)
Appel automatique unique ; affiche succès ou erreur ; met à jour `user` si une session est ouverte.

## 6. Écarts & points ouverts

- **Changement de username et JWT** : le provider charge l'utilisateur par `username`, claim porté par le JWT. Après un changement, l'ancien jeton ne correspond plus à aucun utilisateur → 401 probable sur la requête suivante. À confirmer par test ; correctif : renvoyer un nouveau JWT dans la réponse ou identifier par `id`/`email`.
- Les DTO de compte n'imposent pas de format au `username` (espaces, caractères spéciaux acceptés).
- `confirmEmailChange` ne notifie pas l'ancienne adresse (bonne pratique de sécurité absente).
- Le type front `User` déclare `isVerified` et `hasJournalPasscode`, non sérialisés par l'API.
- Le texte de confirmation de `DeleteAccountCard` cite « notes, tâches, entrées de journal » : à rendre générique.
- `performAccountDeletion()` dépend directement des entités métier : voir [extraction_guide.md §3.4](extraction_guide.md#34-accountservice).

## 7. Sources

API : `src/Controller/Auth/AccountController.php`, `src/Service/AccountService.php`, `src/Dto/Account/{ChangeEmail,ChangePassword,UpdateAccount,UploadAvatar}Dto.php`.
Front : `src/pages/auth/{ProfilePage,ConfirmEmailChangePage}.tsx`, `src/pages/auth/components/{ChangeAvatarForm,ChangeInformationsForm,ChangeEmailForm,ChangePasswordForm,DeleteAccountCard,ProfileForms.styles}.tsx`, `src/services/auth.api.ts`.
