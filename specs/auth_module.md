# Module Auth

## 1. Objet

Cycle de vie de l'accès : inscription, vérification de l'adresse e-mail, connexion (mot de passe ou code à usage unique), mot de passe oublié, session JWT, rôles et création d'administrateurs.

## 2. Règles métier

### Inscription & vérification
| ID | Règle |
|---|---|
| RG-AUTH-01 | Champs : `email` (valide, unique, ≤ 180), `username` (3–90, unique), `password` (≥ 8, 1 minuscule, 1 majuscule, 1 chiffre). |
| RG-AUTH-02 | Le compte est créé **non vérifié**, rôle `ROLE_USER`. Il ne peut pas se connecter tant qu'il n'est pas vérifié. |
| RG-AUTH-03 | Un lien de vérification valable **72 h** est envoyé : `FRONTEND_URL/verify-email?token=<64 hex>`. |
| RG-AUTH-04 | Si l'e-mail de vérification ne peut pas partir, l'inscription est **annulée** (utilisateur supprimé) pour libérer e-mail et username. |
| RG-AUTH-05 | Valider le lien active le compte (`isVerified`, `emailVerifiedAt`), **connecte automatiquement** (JWT renvoyé) et envoie un e-mail de bienvenue (une seule fois, échec non bloquant). |
| RG-AUTH-06 | Le renvoi du lien est possible pour un compte non vérifié ; il invalide le lien précédent. Réponse identique que le compte existe ou non. |

### Connexion
| ID | Règle |
|---|---|
| RG-AUTH-10 | L'identifiant de connexion accepte le **username ou l'e-mail** (recherche par username puis par e-mail). |
| RG-AUTH-11 | Mot de passe incorrect ou compte inconnu → même message `Identifiants invalides.` |
| RG-AUTH-12 | Compte non vérifié (mot de passe correct) → 403 avec `code: "email_not_verified"` ; le front propose alors le renvoi du lien. |
| RG-AUTH-13 | Connexion par code : code à **6 chiffres**, valable **90 s**, envoyé uniquement aux comptes vérifiés. |
| RG-AUTH-14 | Un nouveau code ne peut être envoyé qu'après **30 s** ; une demande pendant ce délai reçoit la réponse standard sans envoi. |
| RG-AUTH-15 | Après **5 codes erronés**, le code actif est révoqué (429) ; il faut en redemander un. Le compteur expire avec le code. |
| RG-AUTH-16 | Tout nouveau code / lien d'un type donné invalide les précédents du même type. |

### Mot de passe oublié
| ID | Règle |
|---|---|
| RG-AUTH-20 | La demande se fait **par e-mail uniquement** ; lien valable **24 h** : `FRONTEND_URL/reset-password?token=…`. Réponse constante. |
| RG-AUTH-21 | La réinitialisation applique les règles RG-AUTH-01 sur le mot de passe et **vérifie le compte** s'il ne l'était pas (le lien prouve la possession de l'adresse). |

### Demandes à usage unique (`UserRequest`)
| ID | Règle |
|---|---|
| RG-AUTH-30 | Type OTP → `code` = entier aléatoire 100000–999999. Type lien → `token` = 32 octets aléatoires en hexadécimal (64 caractères). |
| RG-AUTH-31 | Une demande est valide si `isUsed = false` et `expiresAt` non dépassé. Une demande expirée trouvée est marquée utilisée. |
| RG-AUTH-32 | Un code OTP est toujours recherché **pour un utilisateur donné** (les codes ne sont pas uniques entre utilisateurs). |
| RG-AUTH-33 | Une demande consommée (`consume`) passe `isUsed = true`. |

| Type (`UserRequestTypeEnum`) | Forme | Durée | Usage |
|---|---|---|---|
| `email_verification` | token | 72 h | Activation du compte |
| `otp_login` | code | 90 s | Connexion sans mot de passe |
| `password_reset` | token | 24 h (72 h si créé par la commande admin) | Réinitialisation |
| `email_change` | token + `payload.new_email` | 24 h | Voir [account_module.md](account_module.md) |
| `account_deletion` | code | 10 min | Voir [account_module.md](account_module.md) |
| `otp_register` | — | — | Déclaré, **non utilisé** |

### Session & rôles
| ID | Règle |
|---|---|
| RG-AUTH-40 | Le JWT (Lexik, RS256) a une durée `JWT_TOKEN_TTL` (secondes) et porte `username`, `roles`, `iat`, `exp`. Pas de refresh token. |
| RG-AUTH-41 | La déconnexion supprime le jeton côté navigateur uniquement. |
| RG-AUTH-42 | Rôles : `ROLE_USER` (« Utilisateur »), `ROLE_ADMIN` (« Administrateur », hérite de `ROLE_USER`). |
| RG-AUTH-43 | Les administrateurs sont créés **uniquement en ligne de commande** (`core-php:create-admin-user`) : compte vérifié d'office + e-mail récapitulatif avec lien de changement de mot de passe (72 h). |

## 3. Modèle de données

Entités `User` et `UserRequest` : voir [api_core_module.md §6](api_core_module.md#6-modèle-de-données-du-socle).

## 4. API — `/api/auth` (public)

| Méthode | Route | Corps | Succès | Erreurs |
|---|---|---|---|---|
| POST | `/auth/register` | `{ email, username, password* }` | **201** `{ user, message }` | 400 format / violations · 422 domaine e-mail injoignable · 502 envoi impossible · 500 |
| POST | `/auth/verify-email` | `{ token }` | 200 `{ token, user, message }` | 422 token manquant · 400 invalide / expiré |
| POST | `/auth/resend-verification` | `{ username }` (username ou e-mail) | 200 `{ message }` (constant) | 422 champ manquant |
| POST | `/auth/login` | `{ username, password* }` | 200 `{ token, user }` | 400 format · 422 champs manquants · 401 identifiants · 403 `email_not_verified` |
| POST | `/auth/login-code` | `{ username }` | 200 `{ message, expiresIn: 90, resendAvailable: 30 }` (constant) | 422 champ manquant |
| POST | `/auth/login-code/verify` | `{ username, code }` | 200 `{ token, user }` | 422 champs manquants · 401 code invalide / expiré · 429 trop de tentatives |
| POST | `/auth/forgot-password` | `{ email }` | 200 `{ message }` (constant) | 422 champ manquant |
| POST | `/auth/reset-password` | `{ token, password* }` | 200 `{ message }` | 400 format / violations / lien invalide |
| POST | `/auth/confirm-email-change` | `{ token }` | voir [account_module.md](account_module.md) | |

`*` = encodé en base64 ([api_core_module.md §4.2](api_core_module.md#42-secrets-encodés)). `user` = groupe `user.read`.

Clés de cache (pool `cache.app`) : `login_code_sent_<userId>` (30 s), `login_code_attempts_<userId>` (90 s).

### Commande d'administration

```bash
php bin/console core-php:create-admin-user [username] [email] [password] [--type=admin]
```
Arguments demandés interactivement s'ils sont omis (mot de passe masqué). Validation identique à l'inscription. Types disponibles : `AdminUserManager::getAdminRoles()` = `['admin' => 'ROLE_ADMIN']`.

## 5. Frontend

### Routes
| Route | Garde | Écran |
|---|---|---|
| `/login` | `PublicRoute` | Bascule (`SegmentedControl`) **Mot de passe** / **Code par e-mail** |
| `/register` | `PublicRoute` | Formulaire + confirmation des mots de passe ; après succès, message + bouton « renvoyer le lien » |
| `/forgot-password` | `PublicRoute` | Saisie de l'e-mail |
| `/verify-email?token=` | aucune | Appel automatique (une seule fois), `setAuth`, redirection `/` |
| `/reset-password?token=` | aucune | Nouveau mot de passe + confirmation |
| `/logout` | `ProtectedRoute` | `logout()` puis redirection `/login` |

`PublicRoute` redirige vers `/` si connecté ; `ProtectedRoute` vers `/login` sinon ; `AdminRoute` (sous `ProtectedRoute`) vers `/` si non admin. Les deux premières affichent un loader pendant `isLoading`.

### Comportements
- **PasswordLoginForm** : sur `email_not_verified`, alerte « warning » + bouton de renvoi du lien.
- **CodeLoginForm** : étape 1 identifiant → étape 2 code ; compte à rebours d'expiration (`expiresIn`) et de renvoi (`resendAvailable`) rafraîchi chaque seconde ; bouton désactivé une fois le code expiré.
- Erreurs de champ : `getFieldErrors(err)` → `setError` de react-hook-form.

### Session (`stores/auth.store.ts`)
- Jeton en `localStorage` (clé `todo_auth_token`, via `StorageService` de `core-ts`).
- Au démarrage (`App`) : `checkSession()` → si jeton absent ou expiré (lecture de `exp` côté client) → `logout()` ; sinon `GET /account/profile` → `user` ; en cas d'échec → `logout()`.
- `useAuth()` expose `isAuth`, `user`, `role`, `isAdmin`, `roleLabel`, `isLoading`, `token`, `logout`.

### Validation (`pages/auth/authSchemas.ts`, zod)
`passwordSchema` (≥ 8 + minuscule + majuscule + chiffre), `identifierSchema` (e-mail valide **ou** ≥ 3 caractères), `loginCodeSchema` (`^\d{6}$`).

## 6. Écarts & points ouverts

- **Regex de `User::$password`** : `#^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9]){8,}#` répète le lookahead au lieu d'exiger 8 caractères → aucune contrainte de longueur à l'inscription ni à la création admin. Corriger en `#^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9]).{8,}$#` (comme les DTO).
- **Pas de limitation de débit sur `/auth/login`** (seule la connexion par code est protégée).
- **Pas de révocation JWT** ni refresh token ; un changement de mot de passe ne déconnecte pas les autres sessions.
- **Rate limiting dans `cache.app`** : local au serveur, remis à zéro par `cache:clear`.
- `requestLoginCode` renvoie 200 même quand le délai de 30 s n'est pas écoulé (aucun code envoyé) : le front ne peut pas distinguer ce cas.
- Le type front `JwtPayload` décrit `userId` / `role` qui n'existent pas dans le jeton (seul `exp` est utilisé).
- `otp_register` est déclaré mais inutilisé.

## 7. Sources

API : `src/Controller/Auth/AuthController.php`, `src/Service/{AuthService,UserRequestService,AdminUserManager,SecretDecoder}.php`, `src/Entity/{User,UserRequest}.php`, `src/Enum/Auth/*`, `src/Dto/Auth/ResetPasswordDto.php`.
Front : `src/pages/auth/{LoginPage,RegisterPage,ForgotPasswordPage,ResetPasswordPage,VerifyEmailPage,LogoutPage,authSchemas}.ts(x)`, `src/pages/auth/components/{PasswordLoginForm,CodeLoginForm}.tsx`, `src/services/auth.api.ts`, `src/stores/auth.store.ts`, `src/hooks/useAuth.ts`, `src/router/*`, `src/utils/{jwt,role,secret}.ts`.
