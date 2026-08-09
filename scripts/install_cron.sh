#!/bin/bash
# ============================================================
# INSTALADOR DE CRON JOBS
# Configura las tareas programadas para:
#   - Expirar waivers diariamente (00:30)
#   - Backup mensual de BD (día 1 a las 03:00)
#
# USO:
#   sudo bash scripts/install_cron.sh
#
# SEGURIDAD:
#   - Solo agrega entradas específicas a crontab (no sobrescribe).
#   - Marca con comentario identificable para poder remover después.
# ============================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
LOG_DIR="${LOG_DIR:-/var/log/kidsfun}"
SCRIPTS_PATH="${SCRIPTS_PATH:-/opt/kidsfun/scripts}"

# Detectar usuario actual (no root si es posible)
if [ -n "$SUDO_USER" ]; then
  CRON_USER="$SUDO_USER"
else
  CRON_USER="$(whoami)"
fi

mkdir -p "$LOG_DIR"

CRON_ENTRIES=$(cat <<EOF
# === Kidsfun cron jobs (gestionados por install_cron.sh) ===
SHELL=/bin/bash
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin

# Expirar waivers diariamente a las 00:30
30 0 * * * $SCRIPTS_PATH/cron_expire_waivers.sh >> $LOG_DIR/cron.log 2>&1

# Backup mensual completo de BD (día 1 a las 03:00)
0 3 1 * * $SCRIPTS_PATH/cron_backup_monthly.sh >> $LOG_DIR/cron.log 2>&1

# Health check cada 5 minutos (BD + Redis + slow queries)
*/5 * * * * $SCRIPTS_PATH/cron_health_check.sh >> $LOG_DIR/cron.log 2>&1
EOF
)

# Backup del crontab actual
echo "� Backup del crontab actual..."
crontab -l -u "$CRON_USER" 2>/dev/null > /tmp/crontab.backup.$(date +%s).txt || true

# Verificar si ya están instaladas
if crontab -l -u "$CRON_USER" 2>/dev/null | grep -q "Kidsfun cron jobs"; then
  echo "⚠️  Las entradas de Kidsfun ya están en el crontab. No se agregan de nuevo."
  echo "Para reinstalar, primero ejecuta: crontab -e y borra el bloque '# === Kidsfun cron jobs'"
  exit 0
fi

# Agregar nuevas entradas al crontab
echo "➕ Agregando entradas de cron para Kidsfun..."
(
  crontab -l -u "$CRON_USER" 2>/dev/null
  echo ""
  echo "$CRON_ENTRIES"
) | crontab -u "$CRON_USER" -

echo "✅ Instalación completa. Entradas agregadas:"
crontab -l -u "$CRON_USER" | grep -A 5 "Kidsfun cron jobs"

echo ""
echo "📋 Resumen:"
echo "   - Waivers expirados: diariamente a las 00:30"
echo "   - Backup mensual:    día 1 a las 03:00"
echo "   - Health check:      cada 5 minutos (BD + Redis + slow queries)"
echo "   - Logs en:           $LOG_DIR/cron.log"
echo ""
echo "🔍 Para verificar:   crontab -l -u $CRON_USER"
echo "🗑️  Para desinstalar: crontab -e y borrar el bloque '# === Kidsfun cron jobs'"
