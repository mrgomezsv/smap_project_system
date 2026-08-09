#!/bin/bash
# ============================================================
# DEPLOY CRON JOBS AL VPS
# Sube los scripts de cron al VPS y los instala.
#
# USO:
#   # Opción 1: con SSH key (recomendado)
#   VPS_HOST=vps.example.com VPS_USER=root \
#     bash scripts/deploy_vps.sh
#
#   # Opción 2: con password (requiere sshpass)
#   VPS_HOST=vps.example.com VPS_USER=root VPS_PASSWORD=xxx \
#     bash scripts/deploy_vps.sh
#
# VARIABLES DE ENTORNO:
#   VPS_HOST       - Hostname o IP del VPS (requerido)
#   VPS_USER       - Usuario SSH (default: root)
#   VPS_PORT       - Puerto SSH (default: 22)
#   VPS_PATH       - Path remoto para scripts (default: /opt/kidsfun/scripts)
#   VPS_LOG_PATH   - Path remoto para logs (default: /var/log/kidsfun)
#   VPS_PASSWORD   - Password SSH (si no hay SSH key)
#   SSH_KEY        - Path a SSH key privada (default: ~/.ssh/id_rsa)
# ============================================================

set -e

# ============================================================
# CONFIGURACIÓN
# ============================================================
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

VPS_HOST="${VPS_HOST:-}"
VPS_USER="${VPS_USER:-root}"
VPS_PORT="${VPS_PORT:-22}"
VPS_PATH="${VPS_PATH:-/opt/kidsfun/scripts}"
VPS_LOG_PATH="${VPS_LOG_PATH:-/var/log/kidsfun}"
SSH_KEY="${SSH_KEY:-$HOME/.ssh/id_rsa}"
VPS_PASSWORD="${VPS_PASSWORD:-}"

# Scripts que se suben al VPS
SCRIPTS=(
  "cron_expire_waivers.sh"
  "cron_backup_monthly.sh"
  "cron_health_check.sh"
  "install_cron.sh"
)

# ============================================================
# VALIDACIONES
# ============================================================
if [ -z "$VPS_HOST" ]; then
  echo "❌ ERROR: VPS_HOST no configurado."
  echo ""
  echo "Uso:"
  echo "  VPS_HOST=vps.example.com VPS_USER=root bash $0"
  echo "  VPS_HOST=vps.example.com VPS_PASSWORD=xxx bash $0"
  exit 1
fi

echo "╔════════════════════════════════════════════════════╗"
echo "║  DEPLOY CRON JOBS — Kidsfun                        ║"
echo "╚════════════════════════════════════════════════════╝"
echo ""
echo "VPS:        $VPS_USER@$VPS_HOST:$VPS_PORT"
echo "Path VPS:   $VPS_PATH"
echo "Logs VPS:   $VPS_LOG_PATH"
echo "SSH key:    ${SSH_KEY:-ninguna}"
echo ""

# ============================================================
# MÉTODO DE AUTENTICACIÓN
# ============================================================
SSH_CMD="ssh -p $VPS_PORT -o StrictHostKeyChecking=accept-new"
SCP_CMD="scp -P $VPS_PORT -o StrictHostKeyChecking=accept-new"

if [ -n "$VPS_PASSWORD" ]; then
  if ! command -v sshpass >/dev/null 2>&1; then
    echo "❌ ERROR: VPS_PASSWORD requiere sshpass. Instala con: brew install sshpass"
    exit 1
  fi
  SSH_CMD="sshpass -p '$VPS_PASSWORD' $SSH_CMD"
  SCP_CMD="sshpass -p '$VPS_PASSWORD' $SCP_CMD"
  echo "🔐 Auth: password (sshpass)"
elif [ -f "$SSH_KEY" ]; then
  SSH_CMD="$SSH_CMD -i $SSH_KEY"
  SCP_CMD="$SCP_CMD -i $SSH_KEY"
  echo "🔑 Auth: SSH key ($SSH_KEY)"
else
  echo "⚠️  No hay SSH_KEY ni VPS_PASSWORD. Intentando auth por agente SSH..."
fi
echo ""

# ============================================================
# PASO 1: Verificar conexión
# ============================================================
echo "📡 [1/4] Verificando conexión SSH..."
if ! $SSH_CMD "$VPS_USER@$VPS_HOST" "echo OK" >/dev/null 2>&1; then
  echo "❌ ERROR: No se pudo conectar a $VPS_USER@$VPS_HOST"
  exit 1
fi
echo "✅ Conexión OK"
echo ""

# ============================================================
# PASO 2: Crear directorios en VPS
# ============================================================
echo "📂 [2/4] Creando directorios en VPS..."
$SSH_CMD "$VPS_USER@$VPS_HOST" "mkdir -p $VPS_PATH $VPS_LOG_PATH && chmod 755 $VPS_PATH $VPS_LOG_PATH"
echo "✅ Directorios: $VPS_PATH y $VPS_LOG_PATH"
echo ""

# ============================================================
# PASO 3: Subir scripts
# ============================================================
echo "📤 [3/4] Subiendo scripts al VPS..."
for script in "${SCRIPTS[@]}"; do
  SRC="$SCRIPT_DIR/$script"
  if [ ! -f "$SRC" ]; then
    echo "  ⚠️  $script no existe localmente, saltando"
    continue
  fi
  echo "  → $script"
  $SCP_CMD "$SRC" "$VPS_USER@$VPS_HOST:$VPS_PATH/$script" >/dev/null
done

# Hacer ejecutables
$SSH_CMD "$VPS_USER@$VPS_HOST" "chmod +x $VPS_PATH/*.sh"
echo "✅ Scripts subidos y permisos aplicados"
echo ""

# ============================================================
# PASO 4: Instalar cron
# ============================================================
echo "⚙️  [4/4] Instalando cron jobs..."
echo ""

# Exportar paths para que install_cron.sh los use
$SSH_CMD "$VPS_USER@$VPS_HOST" \
  "SCRIPTS_PATH=$VPS_PATH LOG_DIR=$VPS_LOG_PATH bash $VPS_PATH/install_cron.sh"

echo ""

# ============================================================
# PASO 5: Verificación final
# ============================================================
echo "🔍 Verificación final..."
echo ""
echo "Crontab activo:"
$SSH_CMD "$VPS_USER@$VPS_HOST" "crontab -l | grep -A 10 'Kidsfun cron jobs'"

echo ""
echo "✅ Deploy completo!"
echo ""
echo "📋 Próximos pasos en el VPS:"
echo "   1. Esperar ~30 seg y verificar logs:   tail -f $VPS_LOG_PATH/cron.log"
echo "   2. Probar manualmente:                  bash $VPS_PATH/cron_expire_waivers.sh"
echo "   3. Verificar health check (5 min):      tail -f $VPS_LOG_PATH/cron.log"
echo ""
echo "🗑️  Para desinstalar en VPS:"
echo "   crontab -e   # borrar bloque '# === Kidsfun cron jobs'"
