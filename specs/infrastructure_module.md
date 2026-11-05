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

Comptes de fixtures : `test@example.com` / `testuser` (ROLE_USER) et `admin@example.com` / `admin` (ROLE_ADMIN). Les domaines `example.com` étant refusés par le contrôle de délivrabilité, désactiver `core_php.email.check_deliverability` en dev pour tester les e-mails ([mailer_module.md](mailer_module.md)).

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
| Tests API | aucun (`autoload-dev` déclare `tests/` mais le dossier n'existe pas) |

## 8. Écarts & points ouverts

- **`/migrations/` est ignoré par Git** : le clone de déploiement ne contient aucune migration, `--migrations` est sans effet. Versionner les migrations.
- `frontend/.env.example` : `VITE_API_URL` sans `/api`.
- `api/.env.dev` versionné contient un `APP_SECRET` : à régénérer par projet.
- Aucun test automatisé côté API ; pas de CI.
- `deploy-base.sh` ne vérifie pas le health-check après bascule et ne prévoit pas de retour arrière.
- Version et nom du service du health-check codés en dur.

## 9. Sources

`api/.env*`, `api/config/**`, `api/public/.htaccess`, `api/src/Controller/HealthCheckController.php`, `frontend/.env.example`, `frontend/public/.htaccess`, `frontend/{package.json,vite.config.ts}`, `frontend/.husky/pre-commit`, `deploy-base.sh`, `vendor/fagathe-dev/core-php/config/my_logger.yaml`.
