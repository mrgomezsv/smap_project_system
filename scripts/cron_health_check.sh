#!/bin/bash
# ============================================================
# CRON ALERTAS: Monitoreo de salud BD + Redis
# Se ejecuta cada 5 minutos. Alerta si:
#   - slow queries (24h) > 100
#   - Redis caído (enabled pero disconnected)
#   - DB latency > 500ms
#
# USO: configurar en cron del VPS
#   */5 * * * * /opt/kidsfun/scripts/cron_health_check.sh >> /var/log/kidsfun/cron.log 2>&1
#
# ALERTAS: enviar por SMTP si ADMIN_NOTIFY_EMAIL está configurado.
# ============================================================

set -e

API_URL="${API_URL:-http://localhost:3001}"
ADMIN_EMAIL="${ADMIN_NOTIFY_EMAIL:-${SMTP_FROM:-info@kidsfunyfiestasinfantiles.com}}"
LOG_PREFIX="[$(date '+%Y-%m-%d %H:%M:%S')] cron_health_check"

# 1. Health check combinado
HEALTH=$(curl -fsS "$API_URL/api/dashboard/health" 2>/dev/null) || {
  echo "$LOG_PREFIX ERROR: API no responde en $API_URL"
  exit 1
}

DB_OK=$(echo "$HEALTH" | jq -r '.database.ok')
DB_LATENCY=$(echo "$HEALTH" | jq -r '.database.latency_ms')
REDIS_ENABLED=$(echo "$HEALTH" | jq -r '.redis.enabled')
REDIS_CONNECTED=$(echo "$HEALTH" | jq -r '.redis.connected')

ALERTS=()

if [ "$DB_OK" = "false" ]; then
  ALERTS+=("🔴 BD no responde")
fi

if [ "$DB_LATENCY" -gt 500 ]; then
  ALERTS+=("🟡 Latencia BD alta: ${DB_LATENCY}ms")
fi

if [ "$REDIS_ENABLED" = "true" ] && [ "$REDIS_CONNECTED" = "false" ]; then
  ALERTS+=("🔴 Redis configurado pero desconectado")
fi

# 2. Slow queries
SLOW=$(curl -fsS "$API_URL/api/dashboard/slow-queries" 2>/dev/null) || true
if [ -n "$SLOW" ]; then
  SLOW_COUNT=$(echo "$SLOW" | jq -r '.total_24h')
  if [ "$SLOW_COUNT" -gt 100 ]; then
    ALERTS+=("🟡 Slow queries 24h: $SLOW_COUNT (umbral: 100)")
  fi
fi

# 3. Emitir alertas
if [ ${#ALERTS[@]} -gt 0 ]; then
  MSG="[Kidsfun] Alerta de salud: ${ALERTS[*]}"
  echo "$LOG_PREFIX ALERT: $MSG"

  # Enviar por SMTP si está configurado (opcional)
  if [ -n "$ADMIN_EMAIL" ] && command -v mail >/dev/null 2>&1; then
    echo -e "Subject: [Kidsfun] Alerta de salud BD\n\n$MSG" | mail -s "[Kidsfun] Alerta de salud BD" "$ADMIN_EMAIL" || true
  fi
else
  echo "$LOG_PREFIX OK: sin alertas"
fi
