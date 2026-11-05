# Module Mailer

## 1. Objet

Envoi des e-mails transactionnels via une chaîne typée et extensible : **DTO → `EmailDispatcherService` → handler → template Twig**.

## 2. Règles métier

| ID | Règle |
|---|---|
| RG-MAIL-01 | Chaque e-mail est décrit par un **DTO immuable** (`final readonly`) validé (`Assert`) avant tout envoi. DTO invalide → `InvalidEmailDataException`. |
| RG-MAIL-02 | Chaque DTO a **un seul handler**, déclaré dans `EmailDispatcherService::HANDLER_MAP`. DTO non mappé → `InvalidArgumentException`. |
| RG-MAIL-03 | Avant l'envoi, chaque destinataire est contrôlé : format valide, domaine non réservé (`example.com/net/org/edu`, `invalid`, `test`, `localhost`), et enregistrement **MX** exploitable (MX `.` = refus). Échec → `RecipientUnreachableException`. |
| RG-MAIL-04 | Échec du transport → `EmailSendingException` (`isRetryable()` faux si le destinataire est rejeté). |
| RG-MAIL-05 | Succès et échecs sont journalisés par le handler (actions `mailer.send_success`, `mailer.send_error`, `mailer.recipient_unreachable`). Les données sensibles du DTO (ex. mot de passe en clair) ne sont pas journalisées. |
| RG-MAIL-06 | Deux modes d'appel : `dispatch()` **propage** les exceptions (l'appelant choisit le code HTTP) ; `dispatchSilently()` les absorbe et retourne `bool` (e-mails non bloquants ou anti-énumération). |
| RG-MAIL-07 | Expéditeur par défaut : `DEFAULT_EMAIL_SENDER` au nom de `APP_NAME`. Contexte commun injecté dans tous les templates : `app_name`, `logo_url` (`DEFAULT_URI` + `LOGO_PATH`, défaut `images/logo.webp`), `support_email`. |
| RG-MAIL-08 | Les liens envoyés pointent vers le **front** : `FRONTEND_URL`, à défaut l'origine de la requête. |

## 3. Catalogue

| DTO (`src/Dto/Mail`) | Template (`templates/emails`) | Objet | Déclencheur | Mode |
|---|---|---|---|---|
| `AccountVerificationMailDto` | `auth/account_verification` | Activez votre compte et vérifiez votre adresse e-mail | Inscription, renvoi du lien | `dispatch` (inscription) / silencieux (renvoi) |
| `RegistrationConfirmedMailDto` | `auth/registration_confirmed` | Bienvenue ! Votre compte est maintenant activé | 1ʳᵉ vérification | silencieux |
| `OtpVerificationMailDto` | `auth/otp_verification` | Votre code de vérification : `<code>` | Connexion par code | silencieux |
| `ForgotPasswordMailDto` | `auth/forgot_password` | Réinitialisation de votre mot de passe | Mot de passe oublié | silencieux |
| `EmailChangeVerificationMailDto` | `auth/email_change_verification` | Confirmez votre nouvelle adresse e-mail | Changement d'e-mail | `dispatch` |
| `AccountDeletionCodeMailDto` | `auth/account_deletion_code` | Code de confirmation de suppression de compte : `<code>` | Demande de suppression | `dispatch` |
| `AdminAccountCreatedMailDto` | `admin/account_created` | Votre compte administrateur a été créé | Commande `create-admin-user` | `dispatch` (erreur journalisée) |

Champs communs : `recipientEmail` (ou `newEmail`), `recipientName` (prénom + nom, sinon username). Durées exposées : `ttlHours` / `ttlMinutes`, `validityLabel` (libellé prioritaire, ex. « 1 min 30 »).

Templates : héritent de `@CorePhp/layout.html.twig` et composent `@CorePhp/components/_{text,button,card,box,alert,divider}.html.twig`.

## 4. Ajouter un e-mail

1. Créer le DTO dans `src/Dto/Mail/` (`final readonly`, contraintes `Assert`).
2. Créer le handler dans `src/Mailer/` : `extends AbstractMailerHandler`, implémenter `getTemplate()`, `getSubject($dto)`, `getRecipients($dto)` ; surcharger si besoin `getContext()` (ne jamais utiliser la clé `email`), `getFrom()`, `getReplyTo()`.
3. Créer le template dans `templates/emails/<domaine>/`.
4. Ajouter le couple `DTO::class => Handler::class` dans `EmailDispatcherService::HANDLER_MAP`.
5. Ajouter un mock dans `EmailMockService` pour la prévisualisation ([email_preview_module.md](email_preview_module.md)).

## 5. Configuration

| Variable | Rôle |
|---|---|
| `MAILER_DSN` | Transport Symfony Mailer (ex. `smtp://…`, `null://null` pour ne rien envoyer) |
| `DEFAULT_EMAIL_SENDER` | Adresse d'expédition |
| `APP_NAME` | Nom affiché (expéditeur, templates) |
| `DEFAULT_URI` | Base de l'URL du logo |
| `LOGO_PATH` | Chemin public du logo (défaut `images/logo.webp`) |
| `SUPPORT_EMAIL` | Adresse de support affichée (optionnelle) |
| `FRONTEND_URL` | Base des liens envoyés |

Paramètre `core_php.email.check_deliverability` (défaut `true`) : désactivable pour le développement.

## 6. Écarts & points ouverts

- Les comptes de fixtures (`@example.com`) sont **refusés** par le contrôle de délivrabilité : en dev, la connexion par code, le mot de passe oublié, etc. n'envoient rien (silencieusement). Désactiver `check_deliverability` en dev ou utiliser des domaines réels avec un `MAILER_DSN` de capture (Mailpit…).
- Le contrôle MX fait une requête DNS **synchrone** à chaque envoi ; envois synchrones (pas de Messenger).
- `AdminAccountCreatedMailDto` transporte le **mot de passe en clair** dans l'e-mail.
- `AccountVerificationMailDto::$ttlHours` vaut 24 par défaut alors que le lien est créé pour 72 h (valeur toujours passée explicitement, mais défaut trompeur).

## 7. Sources

`src/Service/EmailDispatcherService.php`, `src/Mailer/*`, `src/Dto/Mail/*`, `templates/emails/**`, `config/packages/mailer.yaml`, `vendor/fagathe-dev/core-php/src/Mailer/*`, `vendor/fagathe-dev/core-php/config/my_email.yaml`.
