#!/bin/bash
# ============================================================
# VALIDACIÓN POST-CAMBIO
# Compara el estado actual contra el archivo PRE más reciente.
# Si hay MISMATCH, sale con código 1 (no proceder a commit).
# ============================================================

set -e

DB_NAME="${DB_NAME:-smap_kf}"
DB_USER="${DB_USER:-mrgomez}"
DB_PASS="${DB_PASS:-Karin2100}"
DB_CONTAINER="${DB_CONTAINER:-proyecto_kidsfun-db-1}"
LABEL="${1:-post}"

# Buscar el archivo PRE más reciente
PRE_FILE=$(ls -t backups/validations/PRE_*.txt 2>/dev/null | head -1)
if [ -z "$PRE_FILE" ]; then
  PRE_FILE=$(ls -t backups/validations/pre_*.txt 2>/dev/null | head -1)
fi

if [ -z "$PRE_FILE" ]; then
  echo "❌ ERROR: No existe archivo de validación previa (PRE_*.txt o pre_*.txt en backups/validations/)"
  exit 1
fi

OUT="backups/validations/${LABEL}_$(date +%Y%m%d_%H%M%S).txt"
mkdir -p backups/validations

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
echo " Comparando contra: $PRE_FILE" >> "$OUT"
echo "============================================================" >> "$OUT"
echo "" >> "$OUT"

mysql_q() {
  docker exec "$DB_CONTAINER" mysql -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -sN -e "$1" 2>/dev/null
}

EXIT_CODE=0

check_table() {
  local table=$1
  local pre_count pre_md5
  local line

  # Extraer del archivo pre (línea que empieza con el nombre)
  line=$(grep -E "^  ${table} +count=" "$PRE_FILE" | head -1)
  if [ -z "$line" ]; then
    printf "  %-35s ⚠️  no estaba en PRE\n" "$table" >> "$OUT"
    return
  fi

  pre_count=$(echo "$line" | sed -E 's/.*count=([0-9]+).*/\1/')
  pre_md5=$(echo "$line" | sed -E 's/.*md5=([a-f0-9]+|NULL|N\/A)/\1/')

  local post_count post_md5
  post_count=$(mysql_q "SELECT COUNT(*) FROM \`$table\`;")
  post_md5=$(mysql_q "SELECT MD5(GROUP_CONCAT(id ORDER BY id SEPARATOR '|')) FROM \`$table\`;" 2>/dev/null || echo "N/A")

  local status="✅"
  if [ "$pre_count" != "$post_count" ]; then
    status="🚨 COUNT MISMATCH"
    EXIT_CODE=1
  elif [ "$pre_md5" != "$post_md5" ] && [ "$pre_md5" != "NULL" ] && [ "$pre_md5" != "N/A" ]; then
    status="🚨 MD5 MISMATCH"
    EXIT_CODE=1
  fi

  printf "  %-35s pre=%-5s post=%-5s pre_md5=%s post_md5=%s %s\n" \
    "$table" "$pre_count" "$post_count" "$pre_md5" "$post_md5" "$status" >> "$OUT"
}

echo "[SECCIÓN A] TABLAS ADMINISTRADAS POR PRISMA" >> "$OUT"
echo "" >> "$OUT"
for t in "${PRISMA_TABLES[@]}"; do
  check_table "$t"
done

echo "" >> "$OUT"
echo "[SECCIÓN B] TABLAS LEGACY (no en Prisma)" >> "$OUT"
echo "" >> "$OUT"
for t in "${LEGACY_TABLES[@]}"; do
  check_table "$t"
done

echo "" >> "$OUT"
echo "============================================================" >> "$OUT"
echo " Hash global post-cambio (basado en COUNT(*), no estimaciones)" >> "$OUT"
echo "============================================================" >> "$OUT"

# Construir hash con COUNT(*) exacto por tabla (no table_rows que es estimado)
ALL_TABLES=("${PRISMA_TABLES[@]}" "${LEGACY_TABLES[@]}")
GLOBAL_PARTS=""
for t in "${ALL_TABLES[@]}"; do
  cnt=$(mysql_q "SELECT COUNT(*) FROM \`$t\`;")
  GLOBAL_PARTS="${GLOBAL_PARTS}${t}=${cnt}|"
done
# Añadir _prisma_migrations explícitamente (tabla interna)
PRISMA_MIG_COUNT=$(mysql_q "SELECT COUNT(*) FROM _prisma_migrations;")
GLOBAL_PARTS="${GLOBAL_PARTS}_prisma_migrations=${PRISMA_MIG_COUNT}|"

GLOBAL_HASH_POST=$(echo -n "$GLOBAL_PARTS" | md5sum | awk '{print $1}')
GLOBAL_HASH_PRE=$(grep "^GLOBAL:" "$PRE_FILE" | awk '{print $2}')
if [ "$GLOBAL_HASH_PRE" = "$GLOBAL_HASH_POST" ]; then
  echo "GLOBAL: $GLOBAL_HASH_POST ✅ coincide" >> "$OUT"
else
  echo "GLOBAL: pre=$GLOBAL_HASH_PRE post=$GLOBAL_HASH_POST 🚨 MISMATCH" >> "$OUT"
  EXIT_CODE=1
fi

echo ""
echo "============================================================"
echo " Resultado validación $LABEL"
echo "============================================================"
cat "$OUT"
echo ""
if [ $EXIT_CODE -eq 0 ]; then
  echo "✅ TODAS LAS TABLAS CONSISTENTES — SE PUEDE PROCEDER"
else
  echo "🚨 HAY DIFERENCIAS — NO PROCEDER — REVISAR INMEDIATAMENTE"
  echo "   Restaurar backup: gunzip -c backups/smap_kf_pre_*.sql.gz | docker exec -i $DB_CONTAINER mysql -u $DB_USER -p\$DB_PASS $DB_NAME"
fi
exit $EXIT_CODE