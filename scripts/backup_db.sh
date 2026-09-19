#!/bin/bash
# =============================================================================
# CloudOps — Database Backup Script
# =============================================================================
# Supports the DR RPO target of ≤ 15 minutes (DR_PLAYBOOK.md).
#
# Usage:
#   bash scripts/backup_db.sh
#
# Schedule (cron — every 15 minutes):
#   */15 * * * * /bin/bash /path/to/CloudOps/scripts/backup_db.sh
#
# Output:
#   backups/db_<YYYY-MM-DD_HH-MM-SS>.db
# =============================================================================

set -euo pipefail

# Resolve project root (script lives in <root>/scripts/)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Paths
DB_SOURCE="$PROJECT_ROOT/server/prisma/dev.db"
DB_WAL="$PROJECT_ROOT/server/prisma/dev.db-wal"
DB_SHM="$PROJECT_ROOT/server/prisma/dev.db-shm"
BACKUP_DIR="$PROJECT_ROOT/backups"

# Retention settings
MAX_HOURLY_BACKUPS=48   # 12 hours of 15-min backups
MAX_DAILY_BACKUPS=14    # 14-day history

# Timestamp for this backup
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
BACKUP_FILE="$BACKUP_DIR/db_${TIMESTAMP}.db"

# ---------------------------------------------------------------------------
# Preflight checks
# ---------------------------------------------------------------------------
if [ ! -f "$DB_SOURCE" ]; then
  echo "[backup] ❌ ERROR: Database file not found at $DB_SOURCE"
  exit 1
fi

# Create backup directory if it does not exist
mkdir -p "$BACKUP_DIR"

# ---------------------------------------------------------------------------
# Checkpoint the WAL before backup (flushes uncommitted transactions)
# Requires sqlite3 CLI to be installed
# ---------------------------------------------------------------------------
if command -v sqlite3 &>/dev/null; then
  sqlite3 "$DB_SOURCE" "PRAGMA wal_checkpoint(TRUNCATE);" > /dev/null 2>&1 || true
  echo "[backup] WAL checkpoint completed."
else
  echo "[backup] ⚠️  sqlite3 CLI not found — skipping WAL checkpoint (backup may miss last transactions)."
fi

# ---------------------------------------------------------------------------
# Copy database files
# ---------------------------------------------------------------------------
cp "$DB_SOURCE" "$BACKUP_FILE"

# Also copy WAL and SHM if they exist (in-progress transactions)
[ -f "$DB_WAL" ] && cp "$DB_WAL" "${BACKUP_FILE}-wal" || true
[ -f "$DB_SHM" ] && cp "$DB_SHM" "${BACKUP_FILE}-shm" || true

BACKUP_SIZE=$(du -sh "$BACKUP_FILE" | cut -f1)
echo "[backup] ✅ Backup created: $BACKUP_FILE ($BACKUP_SIZE)"

# ---------------------------------------------------------------------------
# Retention pruning — keep last MAX_HOURLY_BACKUPS files
# ---------------------------------------------------------------------------
BACKUP_COUNT=$(ls -1 "$BACKUP_DIR"/db_*.db 2>/dev/null | wc -l)
if [ "$BACKUP_COUNT" -gt "$MAX_HOURLY_BACKUPS" ]; then
  EXCESS=$(( BACKUP_COUNT - MAX_HOURLY_BACKUPS ))
  echo "[backup] Pruning $EXCESS old backup(s) (keeping last $MAX_HOURLY_BACKUPS)..."
  ls -1t "$BACKUP_DIR"/db_*.db | tail -n "$EXCESS" | xargs rm -f
  echo "[backup] Pruning complete."
fi

echo "[backup] 📦 Total backups: $(ls -1 "$BACKUP_DIR"/db_*.db 2>/dev/null | wc -l)"
echo "[backup] Done — $(date)"
