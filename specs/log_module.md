# Module Log

## 1. Objet

Journalisation applicative en **fichiers JSON** (via `core-php`) et consultation de ces fichiers par les administrateurs depuis le back-office.

## 2. Règles métier

### Écriture
| ID | Règle |
|---|---|
| RG-LOG-01 | Toute classe utilisant `LoggerTrait` journalise via `generateLog(LoggerLevelEnum $level, array $content, array $context)`. |
| RG-LOG-02 | Fichier cible déduit de la classe : `<dernier segment du namespace en minuscules>/<ClassName en kebab-case>` (ex. `App\Service\AuthService` → `service/auth-service`), suffixé de la date : `logs/service/auth-service-27-10-2026.json`. |
| RG-LOG-03 | Niveaux : `debug`, `info`, `notice`, `warning`, `error`, `critical`. |
| RG-LOG-04 | Chaque entrée porte : `id` (`LOG_<YmdHis>_<uniqid>`), `level`, `timestamp`, `content` (données métier) et un `context` collecté automatiquement : `ip` (publique), `device`, `browser`, `url`, `method`, `uid` (identifiant de l'utilisateur connecté), `origin` (fichier). En CLI : `device = Terminal`, `browser = Console`, `method = CLI`. |
| RG-LOG-05 | Convention des services : `content.message` (texte), données utiles (`user_id`…), `exception` pour les erreurs (normalisée : classe, message, code, fichier, ligne, trace) ; `context.action` = identifiant stable `domaine.action.résultat` (ex. `account.delete.success`, `user.register.critical_error`). |
| RG-LOG-06 | Toute erreur 500 renvoyée par un service est journalisée en `critical` avec l'exception. |
| RG-LOG-07 | Une défaillance du logger n'interrompt jamais la requête (repli `error_log`). |
| RG-LOG-08 | Rétention : **30 jours** (`core_php.logger.retention_delay`), purge par `php bin/console core-php:log-file-rotation` (à planifier en cron). |

### Consultation
| ID | Règle |
|---|---|
| RG-LOG-10 | Réservée à `ROLE_ADMIN`. Lecture seule. |
| RG-LOG-11 | Les fichiers sont regroupés **par date** (la plus récente d'abord), puis en arborescence de dossiers (dossiers avant fichiers, ordre alphabétique). |
| RG-LOG-12 | Un fichier est désigné par sa date (`dd-mm-yyyy`) et son **chemin pointé** (`service.auth-service`). Les deux sont validés par regex (pas de traversée de répertoire). |
| RG-LOG-13 | Les entrées d'un fichier sont renvoyées de la plus récente à la plus ancienne. Formats lus : tableau JSON ou JSON Lines. |

## 3. API — `/api/admin/logs`

| Méthode | Route | Réponse |
|---|---|---|
| GET | `/admin/logs` | 200 `LogDate[]` (`[]` si le dossier n'existe pas) |
| GET | `/admin/logs/{date}/{filePath}` | 200 `LogEntry[]` · 404 `{ message: "Fichier de log introuvable." }` |

Contraintes de route : `date` = `\d{2}-\d{2}-\d{4}`, `filePath` = `[\w\-]+(\.[\w\-]+)*`.

```ts
interface LogDate { date: string; count: number; items: LogNode[] }
type LogNode =
  | { type: 'folder'; name: string; path: string; children: LogNode[] }
  | { type: 'file'; name: string; path: string };          // path = chemin pointé
interface LogEntry {
  id: string | number | null;
  level: 'debug' | 'info' | 'notice' | 'warning' | 'error' | 'critical' | null;
  timestamp: string | null;                                 // ISO 8601
  content: Record<string, unknown>;
  context: Record<string, unknown>;
}
```

## 4. Frontend

Route `/admin/logs` (`LogsPage`, gardes `ProtectedRoute` → `AdminRoute`).

| Zone | Comportement |
|---|---|
| Sélecteur de date | Alimenté par `GET /admin/logs` |
| `LogTree` | Arborescence des fichiers de la date ; clic → chargement du fichier |
| Filtres | Niveau (`all` + 6 niveaux) et recherche plein texte (insensible à la casse) sur `content` + `context` |
| `LogEntryItem` | Badge et icône par niveau, horodatage formaté, icône d'appareil, détail dépliable |
| `LogExceptionDetails` | Exception normalisée : classe, message, fichier:ligne, trace (frames applicatives mises en évidence), exceptions `previous` chaînées |
| Action | Rafraîchir le fichier courant |

Utilitaires testés : `pages/admin/components/logFormat.ts` (`LOG_LEVELS`, `LEVEL_VARIANTS`, `LEVEL_ICONS`, `formatLogTimestamp`, `formatLogDate`, `getDeviceIcon`, `isLogException`, `isAppFrame`…).

## 5. Écarts & points ouverts

- Le contexte stocke l'**IP publique** et l'identifiant utilisateur : données personnelles soumises au RGPD (durée de 30 jours à documenter côté projet).
- La rotation n'est pas planifiée par le déploiement : sans cron, les logs s'accumulent.
- Pas de pagination : un fichier volumineux est renvoyé intégralement.
- Les logs internes de Symfony (`var/log`) ne sont pas consultables via ce module.

## 6. Sources

API : `src/Controller/Admin/LogController.php`, `src/Service/LogService.php`, `vendor/fagathe-dev/core-php/src/{Logger/*,Trait/LoggerTrait.php,Command/LogFilesRotationCommand.php}`, `vendor/fagathe-dev/core-php/config/my_logger.yaml`.
Front : `src/pages/admin/{LogsPage.tsx,components/*}`, `src/services/log.api.ts`, `src/types/log.types.ts`.
