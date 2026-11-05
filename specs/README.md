# Spécifications du socle — Base App (Symfony + React)

## Objectif

Ce dépôt sert de **socle réutilisable** pour démarrer de nouveaux projets (ex. `sf-react-p03-cms-app`).
Les specs décrivent uniquement les parties **agnostiques** à conserver lors d'un clonage :

| Couche | Conservé | Exclu (métier propre à ce projet) |
|---|---|---|
| API | Authentification, compte, e-mails transactionnels, prévisualisation des e-mails, logs, health-check | Todos, notes, tags, journal intime, lieux, pièces jointes métier |
| Front | Design system (`ui/`), socle applicatif (hooks, stores, services, utils, router, layouts), pages auth / profil / admin | Pages todos, notes, tags, journal et leurs services / types |

> État décrit : dépôt au 27/10/2026. Les comportements sont ceux **implémentés**, pas souhaités.
> Chaque module se termine par **Écarts & points ouverts** : bugs ou dettes à corriger avant (ou pendant) le clonage.

## Index

| Fichier | Contenu |
|---|---|
| [extraction_guide.md](extraction_guide.md) | **Point d'entrée du clonage** : inventaire fichier par fichier (garder / adapter / supprimer), points de couplage, checklist |
| [api_core_module.md](api_core_module.md) | Architecture API, conventions (réponses, erreurs, codes HTTP), sécurité, socle `core-php` |
| [front_core_module.md](front_core_module.md) | Architecture front : client HTTP, erreurs, stores, hooks, utils, router, layouts |
| [design_system_module.md](design_system_module.md) | Design system `ui/` : thème, tokens, catalogue de composants, règles de contribution |
| [auth_module.md](auth_module.md) | Inscription, vérification e-mail, connexion (mot de passe / code), mot de passe oublié, JWT, rôles |
| [account_module.md](account_module.md) | Profil, avatar, changement d'e-mail / mot de passe, suppression de compte |
| [mailer_module.md](mailer_module.md) | Envoi d'e-mails : DTO → dispatcher → handler → template Twig |
| [email_preview_module.md](email_preview_module.md) | Prévisualisation admin des e-mails avec données factices |
| [log_module.md](log_module.md) | Journalisation JSON et consultation admin des logs |
| [infrastructure_module.md](infrastructure_module.md) | Variables d'environnement, installation, déploiement, health-check, tests, outillage |

## Structure d'un fichier module

1. **Objet** — rôle et périmètre
2. **Règles métier** — identifiants `RG-<MODULE>-NN`, réutilisables dans tickets et tests
3. **Modèle de données**
4. **API** — endpoints, payloads, réponses, erreurs
5. **Frontend** — routes, écrans, état
6. **Écarts & points ouverts**
7. **Sources**

## Écarts prioritaires du socle

| # | Module | Constat | Impact |
|---|---|---|---|
| 1 | auth | La regex du mot de passe de l'entité `User` ne contrôle pas la longueur | Inscription / création admin acceptent < 8 caractères côté API |
| 2 | auth / account | Le JWT identifie l'utilisateur par `username` | Probable 401 juste après un changement de nom d'utilisateur (à confirmer) |
| 3 | auth | Pas de limitation de débit sur `POST /auth/login` | Force brute possible sur les mots de passe |
| 4 | auth | Déconnexion purement côté client, pas de révocation ni de refresh token | Un JWT volé reste valide jusqu'à expiration |
| 5 | infra | `migrations/` est dans `.gitignore` | `deploy-base.sh --migrations` ne trouve aucune migration |
| 6 | front | `VITE_API_URL` de `.env.example` n'inclut pas le préfixe `/api` | Tous les appels échouent en 404 si copié tel quel |
| 7 | account | `isVerified` / `hasJournalPasscode` attendus par le type `User` front mais non sérialisés | Valeurs toujours `undefined` côté front |
