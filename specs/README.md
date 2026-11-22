# Spécifications de l'application — Base App (Symfony + React)

## Objectif

Ce dossier centralise la **documentation fonctionnelle, technique et la structure de données** complète de l'application (`api/` + `frontend/`), ainsi que le guide d'extraction du socle réutilisable pour démarrer de nouveaux projets (ex. `sf-react-p03-cms-app`).

| Périmètre | Modules couverts |
|---|---|
| **Architecture & Socle** | Architecture API (`core-php`), Architecture Front (`core-ts`, `core-react`), Design System & UI Kit, Modèle de données global, Infrastructure & déploiement, Guide d'extraction |
| **Socle transversal** | Authentification & session JWT, Gestion du compte & profil, Envoi d'e-mails transactionnels, Prévisualisation admin des e-mails, Journalisation JSON & consultation admin |
| **Modules métier** | **Tâches** (tâches, échéances, fichiers, commentaires, filtre par tag) avec leurs **Tags** (onglet de la page Tâches), **Journal** (réseau social personnel : Feed, Souvenirs, Enregistrés, Tags, onglet Privé protégé par code secret, suites, Markdown, médias) |

> État décrit : dépôt au **22/11/2026** (version 2.0 : suppression du module Notes, Journal refondu, UI 100 % `core-react/ui`). Les comportements documentés sont ceux **effectivement implémentés** dans `api/` et `frontend/`.
> Chaque module se termine par **Écarts & points ouverts** : bugs ou dettes techniques identifiés dans le code actuel.

## Index

### 1. Architecture, Design System & Structure de données
| Fichier | Contenu |
|---|---|
| [data_model.md](data_model.md) | **Structure de données complète** : diagramme ER global, dictionnaire des entités Doctrine (2 MappedSuperclasses + 10 tables + 1 table de jointure), énumérations, index (dont Full-Text), cascades et groupes de sérialisation |
| [api_core_module.md](api_core_module.md) | Architecture API Symfony 8.1, conventions (réponses, secrets base64, erreurs, codes HTTP), sécurité, gestion des fichiers (`AttachmentFileService`), socle `fagathe-dev/core-php` |
| [front_core_module.md](front_core_module.md) | Architecture front React 19 / Vite 8 / TS 6 : client HTTP, erreurs, stores Zustand, hooks (`core-react` + locaux), utilitaires (`core-ts` + locaux), routage, layouts |
| [design_system_module.md](design_system_module.md) | Design system & UI Kit : usage exclusif de `core-react/ui` et `core-react/theme` (props `$`, tokens), composants partagés de l'app (`src/components/`) |
| [infrastructure_module.md](infrastructure_module.md) | Variables d'environnement, installation locale, fixtures, déploiement Apache (`deploy-base.sh`), health-check, tâches planifiées, outillage |
| [extraction_guide.md](extraction_guide.md) | **Guide de clonage du socle** : inventaire fichier par fichier (garder / adapter / supprimer), points de découplage, checklist |

### 2. Modules du socle (Authentification, Compte & Back-office Admin)
| Fichier | Contenu |
|---|---|
| [auth_module.md](auth_module.md) | Inscription, vérification d'e-mail, connexion (mot de passe ou code OTP), mot de passe oublié, JWT, rôles et commande `core-php:create-admin-user` |
| [account_module.md](account_module.md) | Profil, avatar, changement d'e-mail en 2 étapes, changement de mot de passe, code secret du journal, suppression de compte par code OTP |
| [mailer_module.md](mailer_module.md) | Envoi d'e-mails transactionnels : DTO → `MailDispatcher` → handler (`AbstractMailerHandler`) → template Twig `@CorePhp` |
| [email_preview_module.md](email_preview_module.md) | Prévisualisation admin des 7 e-mails transactionnels avec données factices (`/admin/emails`) |
| [log_module.md](log_module.md) | Journalisation applicative JSON (`LoggerTrait`) et consultation admin par date / arborescence (`/admin/logs`) |

### 3. Modules métier (Espaces de travail)
| Fichier | Contenu |
|---|---|
| [tag_module.md](tag_module.md) | Tags colorés des tâches (unicité `(owner, color)`), gérés dans l'onglet « Tags » de la page Tâches ; filtre `?usedIn=todos` |
| [todo_module.md](todo_module.md) | Tâches (« Ma journée ») : regroupement par échéance, filtre par tags utilisés, tiroir d'édition Markdown, pièces jointes (`TodoFile`), commentaires (`TodoComment`) ; onglet « Tags » |
| [journal_module.md](journal_module.md) | Journal en réseau social personnel : posts Markdown, suites, humeur, lieu, médias, tags dédiés (`JournalTag`), onglets Feed / Souvenirs / Enregistrés / Tags / Privé (`X-JOURNAL-AUTH` + auto-lock 90 s) |

## Structure d'un fichier module

1. **Objet** — rôle et périmètre fonctionnel
2. **Règles métier** — identifiants `RG-<MODULE>-NN`, réutilisables dans les tickets et tests
3. **Modèle de données** — entités, enums et relations concernées (détail complet dans [data_model.md](data_model.md))
4. **API** — endpoints, payloads, réponses, groupes de sérialisation, erreurs
5. **Frontend** — routes, écrans, composants, stores et état
6. **Écarts & points ouverts**
7. **Sources**

## Écarts prioritaires identifiés

| # | Module | Constat | Impact |
|---|---|---|---|
| 1 | auth | La regex du mot de passe de l'entité `User` ne contrôle pas la longueur | Inscription / création admin acceptent < 8 caractères côté API |
| 2 | auth / account | Le JWT identifie l'utilisateur par `username` | Probable 401 juste après un changement de nom d'utilisateur |
| 3 | auth | Pas de limitation de débit sur `POST /auth/login` | Force brute possible sur les mots de passe |
| 4 | auth | Déconnexion purement côté client, pas de révocation ni de refresh token | Un JWT volé reste valide jusqu'à expiration |
| 5 | infra | `migrations/` est dans `.gitignore` (dont les scripts SQL de migration du journal) | `deploy-base.sh --migrations` ne trouve aucune migration ; scripts SQL à transmettre hors git |
| 6 | front | `VITE_API_URL` de `.env.example` n'inclut pas le préfixe `/api` | Tous les appels échouent en 404 si copié tel quel |
| 7 | account | `isVerified` / `hasJournalPasscode` attendus par le type `User` front mais non sérialisés dans `user.read` | `user.hasJournalPasscode` vaut toujours `undefined` côté front |
| 8 | journal / account | `POST /journal/unlock` reçoit `passcode` en clair alors que `/account/journal-passcode*` le décode en base64 | Asymétrie d'encodage entre configuration et déverrouillage |
| 9 | front | `npm test` lancé depuis un chemin `d:\…` (minuscule, terminal VS Code) charge vitest deux fois | Tous les tests échouent (« failed to find the current suite ») : lancer depuis `D:\…` |
