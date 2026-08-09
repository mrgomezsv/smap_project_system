#!/bin/bash
# ============================================================
# BACKUP COMPLETO DE BD
# mysqldump con verificación de integridad.
# ============================================================

set -e

DB_NAME="${DB_NAME:-smap_kf}"
DB_USER="${DB_USER:-mrgomez}"
DB_PASS="${DB_PASS:-Karin2100}"
DB_CONTAINER="${DB_CONTAINER:-proyecto_kidsfun-db-1}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LABEL="${1:-manual}"
BACKUP_DIR="backups"
BACKUP_FILE="${BACKUP_DIR}/smap_kf_${LABEL}_${TIMESTAMP}.sql.gz"

mkdir -p "$BACKUP_DIR"

echo "🔄 Creando backup: $BACKUP_FILE"
docker exec "$DB_CONTAINER" mysqldump \
  -u "$DB_USER" -p"$DB_PASS" \
  --single-transaction \
  --quick \
  --routines \
  --triggers \
  --events \
  --hex-blob \
  --default-character-set=utf8mb4 \
  --add-drop-database \
  --databases "$DB_NAME" 2>/dev/null | gzip > "$BACKUP_FILE"

if [ ! -s "$BACKUP_FILE" ]; then
  echo "❌ ERROR: backup vacío"
  exit 1
fi

if ! gunzip -t "$BACKUP_FILE" 2>/dev/null; then
  echo "❌ ERROR: backup corrupto"
  exit 1
fi

SIZE=$(ls -lh "$BACKUP_FILE" | awk '{print $5}')
TABLE_COUNT=$(gunzip -c "$BACKUP_FILE" | grep -c "^CREATE TABLE")

echo "✅ Backup OK"
echo "   Archivo: $BACKUP_FILE"
echo "   Tamaño:  $SIZE"
echo "   Tablas:  $TABLE_COUNT"