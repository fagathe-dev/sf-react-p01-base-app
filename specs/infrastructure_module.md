# Module Infrastructure

## 1. Objet

Configuration des environnements, installation locale, déploiement, supervision et outillage du socle.

## 2. Variables d'environnement

### API (`api/.env`, surchargé par `api/.env.local` — non versionnés)

| Variable | Obligatoire | Rôle |
|---|---|---|
| `APP_ENV`, `APP_SECRET` | oui | Environnement Symfony, secret applicatif |
| `APP_SHARE_DIR` | — | Répertoire partagé Symfony |
| `DATABASE_URL` | oui | Connexion MySQL / MariaDB |
| `JWT_SECRET_KEY`, `JWT_PUBLIC_KEY`, `JWT_PASSPHRASE` | oui | Clés RS256 (`config/jwt/*.pem`) |
| `JWT_TOKEN_TTL` | oui | Durée de vie du JWT en secondes |
| `CORS_ALLOW_ORIGIN` | oui | Regex des origines autorisées (ex. `^https?://localhost(:[0-9]+)?$`) |
| `DEFAULT_URI` | oui | URL publique de l'API (URL des fichiers uploadés, logo des e-mails) |
| `FRONTEND_URL` | recommandé | Base des liens envoyés par e-mail (à défaut : origine de la requête) |
| `MAILER_DSN` | oui | Transport e-mail |
| `DEFAULT_EMAIL_SENDER`, `APP_NAME` | recommandé | Expéditeur et nom affiché |
| `LOGO_PATH`, `SUPPORT_EMAIL` | — | Logo (défaut `images/logo.webp`) et contact support des e-mails |

### Front (`frontend/.env*`)

| Variable | Rôle |
|---|---|
| `VITE_API_URL` | URL de l'API **avec le préfixe `/api`** (ex. `http://localhost:8000/api`, en prod `https://<domaine>/api`) |

## 3. Installation locale

```bash
# API
cd api
composer install                       # nécessite l'accès au dépôt privé fagathe-dev/core-php
php bin/console lexik:jwt:generate-keypair
php bin/console doctrine:database:create
php bin/console make:migration && php bin/console doctrine:migrations:migrate
php bin/console doctrine:fixtures:load  # testuser / admin — mot de passe Password123!
symfony serve                          # ou serveur PHP équivalent

# Front
cd frontend
cp .env.example .env.local             # puis corriger VITE_API_URL (préfixe /api)
npm ci
npm run dev                            # http://localhost:5173
```

Comptes de fixtures (`src/DataFixtures/AppFixtures.php`) — 23 à 45 utilisateurs :
- `test@example.com` / `testuser` (`ROLE_USER`), code secret du journal : `0000`
- compte admin (`admin`, `ROLE_ADMIN`) : e-mail lu dans **`FIXTURES_ADMIN_EMAIL`** (déclarée vide dans `.env`, valeur réelle dans `.env.local`), `admin@example.com` à défaut ; code `0000`, protection du journal désactivée.
- Protection des contenus privés (`journalLockEnabled`) : désactivée pour ~80 % des autres comptes (`random_choices([false, true], [80, 20])` de core-php).
- Par utilisateur : 5–8 tags de tâches (dont 1–2 jamais utilisés, pour vérifier le filtre), 19–31 tâches (échéances variées, 1–4 commentaires, pièces jointes Markdown réelles écrites dans `public/uploads/todos/<userId>/`), 5–8 tags de journal, 19–31 posts Markdown (~30 % privés ; épinglés, enregistrés, 3 souvenirs datés du même jour il y a 1 et 2 ans, 1–4 suites pour ~30 % des posts, lieux).
- Mot de passe commun : `Password123!`. Les domaines `example.com` étant refusés par le contrôle de délivrabilité, désactiver `core_php.email.check_deliverability` en dev pour tester les e-mails ([mailer_module.md](mailer_module.md)).

### Vérifier sans toucher à sa base de dev

L'environnement `test` ne charge pas `.env.local` : il utilise la `DATABASE_URL` de `.env` avec le suffixe `_test` (`doctrine.yaml`).

```bash
APP_ENV=test php bin/console doctrine:database:create --if-not-exists
APP_ENV=test php bin/console doctrine:schema:create
APP_ENV=test php bin/console doctrine:fixtures:load -n
APP_ENV=test php bin/console doctrine:schema:validate
```

### Migration Journal v2

Passage d'une base existante (ancien journal par blocs + module Notes) au nouveau schéma, **avec reprise des données**. Scripts dans `api/migrations/`, à exécuter dans l'ordre sur une base sauvegardée :

| Script | Rôle |
|---|---|
| `migration_01_backup_tmp.sql` | Crée `bloc_content` vide si la base ne l'a jamais eue ; copie `entry`, `bloc_content`, `entry_media`, `location`, `note`, `note_file` dans des tables `*_tmp` ; prépare la correspondance Tag → JournalTag (slug translittéré, un enregistrement par tag) |
| `migration_02_schema.sql` | Supprime les tables Notes et de l'ancien journal ; ajoute `user.journal_lock_enabled` (`0` par défaut) ; crée `journal_location`, `journal_tag`, `journal_post`, `journal_post_tag`, `journal_media` avec **le DDL exact de Doctrine** (noms d'index et de clés étrangères) |
| `migration_03_restore_and_cleanup.sql` | `group_concat_max_len` relevé ; entrées → posts **privés** (titre `##`, ancien `content`, blocs texte / citation / image / galerie / vidéo en Markdown), tags (`-2`, `-3` sur les slugs homonymes), médias et lieux repris ; contrôle d'intégrité, puis purge des `*_tmp` |

Après les trois scripts, `doctrine:schema:validate` est vert. Vérifier le contrôle d'intégrité de l'étape 3 **avant** sa section de purge. Les fichiers des médias migrés restent dans `uploads/entries/…`, ceux des notes dans `uploads/notes/…` (à supprimer à la main si souhaité).

> Les mêmes scripts sont aussi dans `tmp/` à la racine (copie de travail, non versionnée). Ils ont été validés sur le schéma de prod (`tmp/model_donnees_source.sql`) sous MySQL 8.4 et MariaDB 11.4. Après exécution, marquer la migration Doctrine complète comme jouée : `php bin/console doctrine:migrations:version 'DoctrineMigrations\Version20261122093344' --add --no-interaction`.

## 4. Hébergement & déploiement

### Topologie (Apache, mutualisé)
```
<APP_DIR>/
├── api/               # Symfony ; public/ = racine web de l'API
└── frontend/dist/     # racine web du site
    └── api → ../../api/public   (lien symbolique créé au déploiement)
```
`frontend/public/.htaccess` : redirection HTTPS, transmission de l'en-tête `Authorization`, routage `/api/*` vers `api/index.php` via le lien symbolique, fallback SPA vers `index.html`, en-têtes `nosniff` / `SAMEORIGIN`, cache long des assets et `no-cache` sur `index.html`.
`api/public/.htaccess` : front controller Symfony + transmission de `Authorization`.

### `deploy-base.sh`

```bash
./deploy-base.sh [--project=api|frontend] [--migrations]
```

| Étape | Action |
|---|---|
| 1 | `git clone --depth 1` de `GIT_BRANCH` dans `<APP_DIR>_tmp` |
| 2 – API | Recopie `.env.local`, `public/uploads/`, `config/jwt/` depuis la prod ; `composer install --no-dev --no-scripts` |
| 2 – Front | Recopie `.env*` et `.htaccess` ; `npm ci && npm run build` ; création du lien `dist/api` |
| 3 | Bascule atomique par renommage de dossier (`swap_dir`) |
| 4 – API | `composer dump-autoload --optimize --classmap-authoritative`, migrations si `--migrations`, `cache:clear --env=prod` |

Le dossier temporaire est supprimé en sortie (succès ou échec) ; le script s'arrête à la première erreur (`set -euo pipefail`).

## 5. Supervision — `GET /api/health-check` (public)

| Champ | Contenu |
|---|---|
| `status` | `ok` (200) ou `degraded` (**503**) |
| `checks.database` | `status` (`healthy`/`unhealthy`) via `SELECT 1`, `latency_ms` |
| `checks.storage.var_writable` | `var/` accessible en écriture |
| `system` | `php_version`, `environment`, `memory_usage_mb`, `response_ms` |
| `service`, `version`, `timestamp` | Identité du service (en dur : `base-api`, `1.0.0`) |

## 6. Tâches planifiées à prévoir

| Commande | Fréquence conseillée | Rôle |
|---|---|---|
| `php bin/console core-php:log-file-rotation` | quotidienne | Purge des logs > 30 jours |
| Purge des `UserRequest` utilisées / expirées | à créer | La table grossit indéfiniment |

## 7. Outillage

| Outil | Commande |
|---|---|
| Lint front | `npm run lint` |
| Tests front | `npm test` (Vitest) — lancé par Husky en `pre-commit` (`npm --prefix frontend run test`) |
| Build front | `npm run build` (`tsc -b && vite build`) |
| Style | `.editorconfig` racine, Prettier (simple quotes, 120 colonnes, LF) |
| Tests API | aucun test PHPUnit (`tests/` absent) ; la migration v2 a été validée par un test HTTP de bout en bout et un banc d'essai des scripts SQL sur la base `test` |

## 8. Écarts & points ouverts

- **`/migrations/` est ignoré par Git** : le clone de déploiement ne contient aucune migration, `--migrations` est sans effet, et les scripts SQL de la migration Journal v2 ne sont pas versionnés. Versionner les migrations (ou au moins `!/migrations/*.sql`).
- `frontend/.env.example` : `VITE_API_URL` sans `/api`.
- `api/.env.dev` versionné contient un `APP_SECRET` : à régénérer par projet.
- Aucun test automatisé côté API ; pas de CI.
- `deploy-base.sh` ne vérifie pas le health-check après bascule et ne prévoit pas de retour arrière.
- Version et nom du service du health-check codés en dur.

## 9. Sources

`api/.env*`, `api/config/**`, `api/public/.htaccess`, `api/src/Controller/HealthCheckController.php`, `frontend/.env.example`, `frontend/public/.htaccess`, `frontend/{package.json,vite.config.ts}`, `frontend/.husky/pre-commit`, `deploy-base.sh`, `vendor/fagathe-dev/core-php/config/my_logger.yaml`.
