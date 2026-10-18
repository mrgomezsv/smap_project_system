#!/bin/sh
set -e

echo "🔄 Ejecutando parches SQL de migraciones si faltan tablas o columnas..."
npx prisma db execute --file ./prisma/migrations/20260809120000_clients_unified_g1/migration.sql --schema ./prisma/schema.prisma || true
npx prisma db execute --file ./prisma/migrations/20260809130000_contracts_crm_phase1/migration.sql --schema ./prisma/schema.prisma || true
npx prisma db execute --file ./prisma/migrations/20260809140000_add_contract_safety_checklist_and_signature_image/migration.sql --schema ./prisma/schema.prisma || true
npx prisma db execute --file ./prisma/migrations/20260816213000_add_category_table/migration.sql --schema ./prisma/schema.prisma || true
npx prisma db execute --file ./prisma/migrations/20260906210000_drop_chk_event_partners_enum/migration.sql --schema ./prisma/schema.prisma || true

echo "🔄 Marcar migraciones en Prisma como aplicadas..."
npx prisma migrate resolve --applied 20260808162300_check_constraints_e1 || true
npx prisma migrate resolve --applied 20260808163000_event_partners_enum_d5 || true
npx prisma migrate resolve --applied 20260809120000_clients_unified_g1 || true
npx prisma migrate resolve --applied 20260809130000_contracts_crm_phase1 || true
npx prisma migrate resolve --applied 20260809140000_add_contract_safety_checklist_and_signature_image || true
npx prisma migrate resolve --applied 20260816213000_add_category_table || true
npx prisma migrate resolve --applied 20260906210000_drop_chk_event_partners_enum || true

echo "🔄 Ejecutando prisma migrate deploy..."
# Si una migración falla se avisa con claridad en los logs. Por defecto la API
# arranca igual (como antes) para no tumbar producción; con
# MIGRATIONS_STRICT=true el contenedor se detiene ante cualquier fallo.
# Diagnóstico: npx prisma migrate status
if ! npx prisma migrate deploy; then
  echo "❌❌❌ FALLÓ 'prisma migrate deploy'. Revisa con: npx prisma migrate status"
  if [ "$MIGRATIONS_STRICT" = "true" ]; then
    echo "MIGRATIONS_STRICT=true: deteniendo el arranque."
    exit 1
  fi
  echo "⚠️ Continuando el arranque (MIGRATIONS_STRICT no está activo)."
fi

echo "🚀 Iniciando servidor NestJS..."
exec node dist/main.js
