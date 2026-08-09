#!/bin/bash
# ============================================================
# COMMITS INTEGRALES — Plan completo Fases A-E + R2 + R3
# Genera ~35 commits atómicos siguiendo COMMIT_STANDARDS.md
#
# USO:
#   bash scripts/commit_r3.sh
#
# ORDEN DE EJECUCIÓN:
#   1. Commits de trabajo previo (Fases A-E + R2) por archivo
#   2. Commits específicos de R3 (los más nuevos)
#   3. Commit del script generador de commits
#
# IMPORTANTE:
#   - Rama produccion2027 local (NO hace push).
#   - set -e: aborta si algún commit falla.
#   - Skip automático si no hay cambios para commitear.
# ============================================================

set -e

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_DIR"

if [ ! -d ".git" ]; then
  echo "❌ ERROR: No es un repositorio git"
  exit 1
fi

CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
echo "📍 Rama actual: $CURRENT_BRANCH"
echo ""

# Advertencia si hay cambios sin commitear
if [ -n "$(git status --porcelain)" ]; then
  echo "ℹ️  Cambios pendientes detectados. El script los va a procesar en orden."
fi

# ============================================================
# FUNCIÓN AUXILIAR
# ============================================================
do_commit() {
  local message="$1"
  shift
  echo ""
  echo "📦 $message"
  git add "$@" 2>/dev/null || true
  if git diff --cached --quiet; then
    echo "  ⏭️  Sin cambios para commitear, saltando"
    return 0
  fi
  git commit -m "$message" 2>&1 | tail -1
  echo "  ✅ OK"
}

# ============================================================
# FASE 1: Trabajo previo (Fases A-E + R2)
# ============================================================
echo "═══════════════════════════════════════════════════════════"
echo " FASE 1: Commits de trabajo previo (A-E + R2)"
echo "═══════════════════════════════════════════════════════════"

# === Migraciones Prisma (Fase A baseline + A2 índices) ===
do_commit "CHORE: Agregar migración Prisma baseline inicial (Fase A)" \
  apps/api/prisma/migrations/20260808160000_init_baseline/

do_commit "PERF: Agregar 38 índices optimizados (Fase A2)" \
  apps/api/prisma/migrations/20260808160100_add_indexes_a2/

do_commit "PERF: Agregar 5 CHECK constraints de integridad (Fase E1)" \
  apps/api/prisma/migrations/20260808162300_check_constraints_e1/

do_commit "CHORE: Crear tablas nuevas Firebase, Translation, Push, Audit (Fase D)" \
  apps/api/prisma/migrations/20260808162800_new_tables_d1_d6_d7_d8/

do_commit "PERF: Convertir Event.partners a CHECK enum (Fase D5)" \
  apps/api/prisma/migrations/20260808163000_event_partners_enum_d5/

do_commit "CHORE: Agregar columna user_id_int a 3 tablas (Fase D2 safe)" \
  apps/api/prisma/migrations/20260808163200_user_id_int_d2_safe/

do_commit "PERF: DROP 4 índices redundantes en chat_message" \
  apps/api/prisma/migrations/20260808163300_drop_redundant_indexes/

do_commit "PERF: Tuning runtime MariaDB (tmp_table_size, buffer pool)" \
  apps/api/prisma/migrations/20260808163400_runtime_tuning/

do_commit "PERF: Agregar índice client_name en rental_contract" \
  apps/api/prisma/migrations/20260808163500_add_contract_client_name_idx/

do_commit "CHORE: Crear tabla product_image con backfill de 241 imágenes" \
  apps/api/prisma/migrations/20260808163500_product_image_d3_safe/

do_commit "CHORE: Crear tabla contract_safety_item (Fase D4)" \
  apps/api/prisma/migrations/20260808163700_contract_safety_d4/

# === Servicios backend (Fases B, C, E) ===
do_commit "PERF: Reescribir metrics.service con 8 agregaciones SQL (Fase B1)" \
  apps/api/src/metrics/metrics.service.ts

do_commit "PERF: Tunear PrismaClient con pool, log y slow query" \
  apps/api/src/prisma/prisma.service.ts

do_commit "PERF: Agregar paginación cursor a chat.service (Fase B6)" \
  apps/api/src/chat/chat.service.ts

do_commit "PERF: Simplificar deleteMany y agregar P2002 catch en waivers" \
  apps/api/src/waivers/waivers.controller.ts \
  apps/api/src/waivers/waivers.service.ts

do_commit "PERF: Agregar paginación cursor a comments.service" \
  apps/api/src/comments/comments.service.ts

do_commit "PERF: Optimizar queries en products.service y products.controller" \
  apps/api/src/products/products.controller.ts \
  apps/api/src/products/products.service.ts

do_commit "PERF: Optimizar findAll en events.service" \
  apps/api/src/events/events.service.ts

# === Módulo Redis (Fase C) ===
do_commit "FEAT: Crear módulo Redis con servicio singleton y fallback" \
  apps/api/src/redis/

do_commit "PERF: Migrar CacheInterceptor a Redis distribuido (Fase C)" \
  apps/api/src/common/interceptors/cache.interceptor.ts

do_commit "CHORE: Registrar RedisModule y DashboardModule en app" \
  apps/api/src/app.module.ts

# === Docker y package.json ===
do_commit "BUILD: Agregar Redis y tuning MariaDB a docker-compose" \
  docker-compose.yml

do_commit "BUILD: Agregar dependencias Redis e ioredis" \
  apps/api/package.json \
  pnpm-lock.yaml

# === Scripts operativos ===
do_commit "CHORE: Crear script de backup de BD con verificación gzip" \
  scripts/backup_db.sh

do_commit "CHORE: Crear scripts de validación pre y post cambio" \
  scripts/validate_pre.sh \
  scripts/validate_post.sh

do_commit "CHORE: Crear script de expiración de waivers" \
  scripts/cron_expire_waivers.sh

# === Tests ===
do_commit "TEST: Agregar smoke test con k6 en test/load" \
  apps/api/test/load/

# === Documentación ===
do_commit "DOCS: Crear plan completo de optimización de BD" \
  docs/PLAN_OPTIMIZACION_BD.md

do_commit "DOCS: Crear protocolo de seguridad para cambios BD" \
  docs/PROTOCOLO_SEGURIDAD_BD.md

do_commit "DOCS: Crear guía de optimización SQL para devs" \
  docs/SQL_OPTIMIZATION.md

# ============================================================
# FASE 2: R3 — Schema drift + mejoras
# ============================================================
echo ""
echo "═══════════════════════════════════════════════════════════"
echo " FASE 2: Commits específicos de Revisión 3"
echo "═══════════════════════════════════════════════════════════"

# === R3 Fase 0: Schema drift ===
do_commit "PERF: Agregar 6 modelos faltantes y columnas user_id_int al schema" \
  apps/api/prisma/schema.prisma

# === R3 F1: FULLTEXT ===
do_commit "PERF: Crear migración con 8 FULLTEXT indexes para búsquedas admin" \
  apps/api/prisma/migrations/20260808230000_fulltext_indexes_f1/

do_commit "PERF: Habilitar FULLTEXT en products.service para búsquedas largas" \
  apps/api/src/products/products.service.ts

do_commit "PERF: Habilitar FULLTEXT en contracts.service" \
  apps/api/src/contracts/contracts.service.ts

do_commit "PERF: Habilitar FULLTEXT en events.service" \
  apps/api/src/events/events.service.ts

do_commit "PERF: Habilitar FULLTEXT en comments.service" \
  apps/api/src/comments/comments.service.ts

do_commit "PERF: Habilitar FULLTEXT en waivers.service" \
  apps/api/src/waivers/waivers.service.ts

# === R3 F6: Cursor pagination ===
do_commit "FEAT: Implementar cursor pagination keyset en contracts admin" \
  apps/api/src/contracts/contracts.service.ts

do_commit "FEAT: Exponer parámetro cursor en controller de contracts" \
  apps/api/src/contracts/contracts.controller.ts

# === R3 F5: TranslationCache ===
do_commit "FEAT: Reescribir TranslationService con caché de 2 niveles" \
  apps/api/src/common/translation.service.ts

# === R3 F4: safetyChecklist dual-write ===
do_commit "PERF: Persistir safetyChecklist en tabla normalizada con dual-write" \
  apps/api/src/contracts/contracts.service.ts

# === R3 F7: Cron scripts nuevos ===
do_commit "CHORE: Crear script de backup mensual con retención de 6 meses" \
  scripts/cron_backup_monthly.sh

do_commit "CHORE: Crear instalador idempotente de cron jobs para VPS" \
  scripts/install_cron.sh

do_commit "CHORE: Crear script de health check periódico para BD y Redis" \
  scripts/cron_health_check.sh

do_commit "CHORE: Crear script deploy_vps para automatizar instalación remota" \
  scripts/deploy_vps.sh

# === R3 F8: Monitoring Redis ===
do_commit "FEAT: Agregar getStats al RedisService para monitoring" \
  apps/api/src/redis/redis.service.ts

do_commit "FEAT: Agregar endpoints redis-stats, slow-queries y health al dashboard" \
  apps/api/src/dashboard/dashboard.controller.ts

# === R3 F9: Documentación ===
do_commit "DOCS: Documentar Revisión 3 completa en RESUMEN_OPTIMIZACION_BD" \
  RESUMEN_OPTIMIZACION_BD.md

# === Script generador (este mismo) ===
do_commit "CHORE: Agregar script generador de commits atómicos R3" \
  scripts/commit_r3.sh

# ============================================================
# RESUMEN FINAL
# ============================================================
echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║  ✅ COMMITS COMPLETADOS                                   ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""
TOTAL=$(git rev-list --count HEAD)
echo "📊 Total commits en repo: $TOTAL"
echo ""
echo "📋 Últimos 50 commits:"
git log --oneline -50
echo ""
echo "📋 Estado actual:"
git status --short
echo ""
echo "💡 Próximos pasos:"
echo "   - Revisar: git log --stat -50"
echo "   - Si querés pushear: git push origin $CURRENT_BRANCH"
echo "   - Estándar del proyecto: NO pushear durante refactorización"
