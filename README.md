# Room Planner
A minimal JS app using module imports without any frameworks or build steps.

## Run
```
docker compose up -d --build
```
Serves on port 7744. Composer dependencies install on container start.

## State
- `data/` - app state (feedback log)
- `prod.env` - optional SMTP settings for feedback emails

## Backup / Restore
- `bin/backup.sh` - copies `data/` and `prod.env` to a timestamped backup dir (`--help` for options)
- `bin/restore.sh <backup-dir>` - restores a backup and verifies the app comes up
- Schedule: `sudo cp deploy/room-planner-backup /etc/cron.d/room-planner-backup`

## Licence
NONE.
