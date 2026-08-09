#!/bin/bash
# ============================================================
# VALIDACIÓN PRE-CAMBIO
# Captura estado actual de TODAS las tablas antes de cualquier
# operación. Guarda conteos + MD5(ids) + muestra para auditoría.
#
# Usa docker exec para evitar problemas de auth plugin
# (mysql_native_password no soportado en MySQL Client 9.x).
# ============================================================

set -e

DB_NAME="${DB_NAME:-smap_kf}"
DB_USER="${DB_USER:-mrgomez}"
DB_PASS="${DB_PASS:-Karin2100}"
DB_CONTAINER="${DB_CONTAINER:-proyecto_kidsfun-db-1}"
LABEL="${1:-pre}"
OUT="backups/validations/${LABEL}_$(date +%Y%m%d_%H%M%S).txt"

mkdir -p backups/validations

# Tablas administradas por Prisma (16 modelos del schema)
PRISMA_TABLES=(
  auth_user
  t_app_product_product
  t_app_event
  t_app_product_like
  t_app_product_comment
  t_app_product_comment_reply
  waiver_v2_waiverqr
  waiver_v2_waiverdata
  waiver_v2_waiverscan
  waiver_v2_waiverdocument
  t_app_chat_administrator
  t_app_chat_room
  t_app_chat_message
  t_app_contact_message
  t_app_product_waivervalidator
  t_app_rental_contract
)

# Tablas NO en Prisma (legacy Django / huérfanas) - SOLO AUDITORÍA
LEGACY_TABLES=(
  alembic_version
  api_product
  api_waiver_waiver
  api_waiver_waiverdata
  api_waiver_waiverqr
  commentaries
  social_auth_association
  social_auth_code
  social_auth_nonce
  social_auth_partial
  social_auth_usersocialauth
  t_app_commentary
  t_app_contact
  t_app_event_attendance
  t_app_like
  t_app_product_waiverdata
  t_app_purchase_ticket
  t_app_ticket
  t_app_ticket_purchase
  t_app_ticket_type
  auth_group
  auth_group_permissions
  auth_permission
  auth_user_groups
  auth_user_user_permissions
  django_admin_log
  django_content_type
  django_migrations
  django_session
  likes
)

echo "============================================================" > "$OUT"
echo " VALIDACIÓN $LABEL - $(date)" >> "$OUT"
echo " DB: $DB_NAME en container: $DB_CONTAINER" >> "$OUT"
echo "============================================================" >> "$OUT"
echo "" >> "$OUT"

mysql_q() {
  docker exec "$DB_CONTAINER" mysql -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -sN -e "$1" 2>/dev/null
}

validate_table() {
  local table=$1
  local count checksum

  count=$(mysql_q "SELECT COUNT(*) FROM \`$table\`;")
  checksum=$(mysql_q "SELECT MD5(GROUP_CONCAT(id ORDER BY id SEPARATOR '|')) FROM \`$table\`;" 2>/dev/null || echo "N/A")

  printf "  %-35s count=%-5s md5=%s\n" "$table" "$count" "$checksum" >> "$OUT"

  if [ "$count" != "0" ] && [ -n "$count" ]; then
    echo "    --- muestra (3 filas) ---" >> "$OUT"
    docker exec "$DB_CONTAINER" mysql -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" \
      -e "SELECT * FROM \`$table\` LIMIT 3\\G" 2>/dev/null >> "$OUT"
  fi
}

echo "[SECCIÓN A] TABLAS ADMINISTRADAS POR PRISMA (16 modelos)" >> "$OUT"
echo "" >> "$OUT"
for t in "${PRISMA_TABLES[@]}"; do
  validate_table "$t"
done

echo "" >> "$OUT"
echo "[SECCIÓN B] TABLAS LEGACY / NO EN PRISMA (SOLO AUDITORÍA)" >> "$OUT"
echo "  ⚠️  Estas tablas NO deben ser tocadas por Prisma." >> "$OUT"
echo "" >> "$OUT"
for t in "${LEGACY_TABLES[@]}"; do
  validate_table "$t"
done

echo "" >> "$OUT"
echo "============================================================" >> "$OUT"
echo " Hash global (basado en COUNT(*), no estimaciones)" >> "$OUT"
echo "============================================================" >> "$OUT"

ALL_TABLES=("${PRISMA_TABLES[@]}" "${LEGACY_TABLES[@]}")
GLOBAL_PARTS=""
for t in "${ALL_TABLES[@]}"; do
  cnt=$(mysql_q "SELECT COUNT(*) FROM \`$t\`;")
  GLOBAL_PARTS="${GLOBAL_PARTS}${t}=${cnt}|"
done
PRISMA_MIG_COUNT=$(mysql_q "SELECT COUNT(*) FROM _prisma_migrations;")
GLOBAL_PARTS="${GLOBAL_PARTS}_prisma_migrations=${PRISMA_MIG_COUNT}|"

GLOBAL_HASH=$(echo -n "$GLOBAL_PARTS" | md5sum | awk '{print $1}')
echo "GLOBAL: $GLOBAL_HASH" >> "$OUT"

echo "" >> "$OUT"
echo "============================================================" >> "$OUT"
echo " Resumen" >> "$OUT"
echo "============================================================" >> "$OUT"
TOTAL_ROWS=$(mysql_q "SELECT SUM(IFNULL(table_rows,0)) FROM information_schema.tables WHERE table_schema='$DB_NAME';")
TOTAL_TABLES=$(mysql_q "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='$DB_NAME';")
echo "Total tablas: $TOTAL_TABLES" >> "$OUT"
echo "Total filas (aprox): $TOTAL_ROWS" >> "$OUT"
echo "DB size:" >> "$OUT"
docker exec "$DB_CONTAINER" mysql -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "
  SELECT 
    ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS total_mb
  FROM information_schema.tables 
  WHERE table_schema='$DB_NAME';" 2>/dev/null >> "$OUT"

echo ""
echo "✅ Validación $LABEL guardada en: $OUT"
echo ""
cat "$OUT"