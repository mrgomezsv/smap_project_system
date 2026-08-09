#!/bin/bash
# ============================================================
# CRON JOB: backup mensual completo de la BD
# Retención: 6 meses (los más viejos se eliminan automáticamente).
# Comprime con gzip para ahorrar espacio.
# ============================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKUP_RETENTION_DAYS=180
BACKUP_DIR="${BACKUP_DIR:-/opt/kidsfun/backups}"

# Reutilizar backup_db.sh con label "monthly_<YYYYMM>"
MONTHLY_LABEL="monthly_$(date +%Y%m)"
bash "$SCRIPT_DIR/backup_db.sh" "$MONTHLY_LABEL"

# Limpiar backups mensuales más viejos que retención
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Limpiando backups mensuales > ${BACKUP_RETENTION_DAYS} días..."
find "$BACKUP_DIR" -name "smap_kf_monthly_*.sql.gz" -mtime +$BACKUP_RETENTION_DAYS -delete -print
echo "[$(date '+%Y-%m-%d %H:%M:%S')] OK"
