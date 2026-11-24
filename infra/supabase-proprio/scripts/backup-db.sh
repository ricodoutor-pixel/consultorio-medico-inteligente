#!/usr/bin/env bash
# Daily backup of our Supabase database to the VPS (the free plan has no automatic backup).
# Clinical data never goes to GitHub. Keeps the last 14 days.
# Cron on the VPS:  15 3 * * *  /opt/planta-y-raiz/infra/supabase-proprio/scripts/backup-db.sh >> /var/log/pyr-backup.log 2>&1
set -euo pipefail

HERE="$(cd "$(dirname "$0")/.." && pwd)"
# shellcheck disable=SC1091
set -a; . "$HERE/.env"; set +a
: "${SUPABASE_DB_URL:?SUPABASE_DB_URL missing in .env}"

DEST=/opt/backups/pyr
mkdir -p "$DEST"; chmod 700 "$DEST"
STAMP=$(date +%Y-%m-%d_%H%M)

run_dump() { docker run --rm postgres:17-alpine pg_dump "$SUPABASE_DB_URL" --no-owner --no-privileges "$@"; }

# public data + login accounts (with password hashes) + storage metadata
run_dump --schema=public --schema=auth --schema=storage | gzip > "$DEST/db_$STAMP.sql.gz"
chmod 600 "$DEST/db_$STAMP.sql.gz"

SIZE=$(stat -c %s "$DEST/db_$STAMP.sql.gz")
if [ "$SIZE" -lt 10000 ]; then
  echo "$(date) BACKUP SUSPEITO: só $SIZE bytes"; exit 1
fi
find "$DEST" -name 'db_*.sql.gz' -mtime +14 -delete
echo "$(date) backup ok: db_$STAMP.sql.gz ($SIZE bytes)"
