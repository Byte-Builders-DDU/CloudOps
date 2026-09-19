# Disaster Recovery Playbook — CloudOps Platform

> **Classification:** Engineering Reference Document  
> **Owner:** Engineer 1 (Platform Core)  
> **Last Updated:** Phase 2 / Release R2

---

## Overview

This playbook documents the CloudOps disaster recovery (DR) procedures. The targets defined in the PRD are:

| Metric | Target | Approach |
|--------|--------|----------|
| **RPO** (Recovery Point Objective) | ≤ 15 minutes | SQLite WAL + automated backup cron every 15 min |
| **RTO** (Recovery Time Objective) | ≤ 4 hours | Scripted restore + validation procedure |

---

## Architecture

```
SQLite Database (server/prisma/dev.db)
        │
        ├── WAL Mode (Write-Ahead Log enabled)
        │       └── Prevents data loss during concurrent writes
        │
        └── Scheduled Backup Cron (every 15 min)
                └── scripts/backup_db.sh → backups/db_<timestamp>.db
```

---

## RPO: Database Backup Strategy

### Automated Backup

The backup script `scripts/backup_db.sh` must be scheduled as a cron job on the host server.

**Setup (Linux/macOS):**
```bash
# Open crontab
crontab -e

# Add the following line (runs every 15 minutes)
*/15 * * * * /bin/bash /path/to/CloudOps/scripts/backup_db.sh >> /var/log/cloudops_backup.log 2>&1
```

**Setup (Windows Task Scheduler):**
```powershell
# Run in PowerShell as Administrator
$action = New-ScheduledTaskAction -Execute "bash" -Argument "-c '/path/to/scripts/backup_db.sh'"
$trigger = New-ScheduledTaskTrigger -RepetitionInterval (New-TimeSpan -Minutes 15) -Once -At (Get-Date)
Register-ScheduledTask -TaskName "CloudOps-DB-Backup" -Action $action -Trigger $trigger
```

### What Gets Backed Up

- `server/prisma/dev.db` — Main SQLite database
- `server/prisma/dev.db-wal` — Write-Ahead Log (uncommitted transactions)
- `server/prisma/dev.db-shm` — Shared memory file

### Backup Retention Policy

- Keep last **48 hourly backups** (= 12 hours of granular recovery points)
- Keep last **14 daily backups**
- Backups older than 14 days are automatically pruned by the backup script

---

## RTO: Restore Procedure

**Target: Full service restoration within 4 hours of incident declaration.**

### Step 1: Identify the Incident (~15 min)

- [ ] Confirm the database is corrupt or missing via `node server/restore_validate.js`
- [ ] Identify the latest clean backup in `backups/` directory
- [ ] Notify team on incident channel

### Step 2: Stop the Server (~5 min)

```bash
# Stop the Node.js process
pm2 stop cloudops-server
# OR
pkill -f "node src/server.js"
```

### Step 3: Restore the Database (~10 min)

```bash
# List available backups (newest first)
ls -lt backups/ | head -20

# Restore the chosen backup (replace <timestamp> with the backup filename)
cp backups/db_<timestamp>.db server/prisma/dev.db

# Verify the restore
node server/restore_validate.js
```

### Step 4: Verify Application Integrity (~15 min)

```bash
# Run restore validation — confirms row counts across all key tables
node server/restore_validate.js

# Run provider tests
cd server && node test_provider.js
```

### Step 5: Restart the Server (~5 min)

```bash
# Restart with production config
pm2 start cloudops-server
# OR
cd server && npm start
```

### Step 6: Smoke Test (~30 min)

- [ ] Confirm WebSocket live telemetry is broadcasting (`workspace:*:metrics` events)
- [ ] Confirm `/api/resources` returns data
- [ ] Confirm background worker is processing `QUEUED` operations
- [ ] Confirm audit logs are being written for new operations

### Total Estimated RTO: ~75 minutes (well within the 4-hour target)

---

## DR Drill Procedure

Run the following to simulate and validate DR readiness:

```bash
# 1. Create a fresh backup
bash scripts/backup_db.sh

# 2. Simulate corruption (ONLY IN DEV/STAGING)
# cp server/prisma/dev.db server/prisma/dev.db.original
# echo "CORRUPTED" > server/prisma/dev.db

# 3. Restore from backup
# cp backups/db_<latest>.db server/prisma/dev.db

# 4. Validate restore
node server/restore_validate.js
```

**Pass Criteria:**
- Backup script completes without error ✅
- Restore validation reports all table counts match expected minimums ✅
- Server restarts and serves the first API request within 4 hours ✅

---

## Escalation Contacts

| Role | Responsibility |
|------|---------------|
| Engineer 1 (Platform Core) | Database, Provider, Worker issues |
| Engineer 2 (API/Auth) | Authentication, Route failures |
| Engineer 3 (Frontend) | UI rendering, WebSocket connectivity |

---

## References

- [backup_db.sh](file:///d:/CloudOps/CloudOps/scripts/backup_db.sh) — Automated backup script
- [restore_validate.js](file:///d:/CloudOps/CloudOps/server/restore_validate.js) — Restore integrity validator
- PRD.md §9 — Non-Functional Requirements (RPO/RTO)
