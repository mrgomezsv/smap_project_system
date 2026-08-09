#!/bin/bash
# ============================================================
# CRON JOB: expirar waivers vencidos
# Cambia status de ACTIVE a INACTIVE para waivers con expires_at < NOW().
#
# Seguridad:
# - Solo modifica status (campo escalar), nunca toca datos.
# - Filtro WHERE explícito: solo waivers vencidos Y aún activos.
# - Registra conteos antes/después para auditoría.
# - Idempotente: ejecutar múltiples veces es seguro.
#
# Cron sugerido (todos los días a las 00:30):
#   30 0 * * * /opt/kidsfun/scripts/cron_expire_waivers.sh >> /var/log/kidsfun/cron.log 2>&1
# ============================================================

set -e

DB_CONTAINER="${DB_CONTAINER:-proyecto_kidsfun-db-1}"
DB_NAME="${DB_NAME:-smap_kf}"
DB_USER="${DB_USER:-mrgomez}"
DB_PASS="${DB_PASS:-Karin2100}"

LOG_PREFIX="[$(date '+%Y-%m-%d %H:%M:%S')] cron_expire_waivers"

# 1. Contar waivers que se van a expirar (auditoría pre)
if ! TO_EXPIRE=$(docker exec "$DB_CONTAINER" mysql -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -sN -e \
  "SELECT COUNT(*) FROM waiver_v2_waiverqr WHERE status='ACTIVE' AND expires_at < NOW();" 2>/dev/null); then
  echo "$LOG_PREFIX ERROR: no se pudo conectar a la BD"
  exit 1
fi

if [ "$TO_EXPIRE" = "0" ]; then
  echo "$LOG_PREFIX OK: 0 waivers a expirar (nada que hacer)"
  exit 0
fi

# 2. Aplicar UPDATE en batches (evitar lock largo en tablas grandes)
BATCH_SIZE=500
TOTAL_UPDATED=0
BATCH_NUM=0

while true; do
  BATCH_NUM=$((BATCH_NUM + 1))
  UPDATED=$(docker exec "$DB_CONTAINER" mysql -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -sN -e \
    "UPDATE waiver_v2_waiverqr
       SET status='INACTIVE'
     WHERE status='ACTIVE' AND expires_at < NOW()
     LIMIT $BATCH_SIZE;
     SELECT ROW_COUNT();" 2>/dev/null | tail -1)

  if [ -z "$UPDATED" ] || [ "$UPDATED" = "0" ]; then
    break
  fi
  TOTAL_UPDATED=$((TOTAL_UPDATED + UPDATED))

  if [ "$UPDATED" -lt "$BATCH_SIZE" ]; then
    break
  fi
done

echo "$LOG_PREFIX OK: $TOTAL_UPDATED waivers expirados ($BATCH_NUM batches)"

# 3. Verificación post
REMAINING=$(docker exec "$DB_CONTAINER" mysql -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -sN -e \
  "SELECT COUNT(*) FROM waiver_v2_waiverqr WHERE status='ACTIVE' AND expires_at < NOW();" 2>/dev/null)

if [ "$REMAINING" != "0" ]; then
  echo "$LOG_PREFIX WARN: aún quedan $REMAINING waivers activos vencidos (revisar)"
  exit 2
fi

exit 0