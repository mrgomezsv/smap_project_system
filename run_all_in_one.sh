#!/bin/bash
# ============================================================================
# run_all_in_one.sh
# Script TODO-EN-UNO para correr smap_project_system en local (macOS).
# Hace, en orden, todo lo necesario desde cero:
#   1. Verifica Docker, Homebrew (arm64) y Python 3
#   2. Levanta MariaDB en Docker (puerto 3307) si no está corriendo
#   3. Crea/usa el venv e instala requirements.txt
#   4. Genera .env.local (con defaults locales) si no existe
#   5. Genera .env.dev apuntando a 127.0.0.1:3307
#   6. Opcionalmente restaura ~/smap_kf_backup.dump en MariaDB
#   7. Ejecuta las migraciones de Django
#   8. Arranca el servidor de desarrollo en http://127.0.0.1:8000
#
# Uso:
#   ./run_all_in_one.sh                 # modo normal
#   ./run_all_in_one.sh --restore-dump  # además restaura ~/smap_kf_backup.dump
#   ./run_all_in_one.sh --no-server     # solo prepara entorno (BD + venv + migrate)
#   ./run_all_in_one.sh --stop          # detiene BD y sale
# ============================================================================

set -e

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"

# ----------------------------------------------------------------------------
# Configuración (puedes editar estos valores si lo necesitas)
# ----------------------------------------------------------------------------
DB_PORT_LOCAL=3307
DB_NAME=smap_kf
DB_USER=mrgomez
DB_PASSWORD=Karin2100
DB_ROOT_PASSWORD=root_password

DUMP_PATH="$PROJECT_DIR/backups/smap_kf_backup_20260719_003631.sql.gz"   # ruta por defecto del backup

# ----------------------------------------------------------------------------
# Helpers
# ----------------------------------------------------------------------------
log()   { printf "\033[1;36m▶ %s\033[0m\n" "$*"; }
ok()    { printf "\033[1;32m✔ %s\033[0m\n" "$*"; }
warn()  { printf "\033[1;33m⚠ %s\033[0m\n" "$*"; }
err()   { printf "\033[1;31m✖ %s\033[0m\n" "$*"; }

# Detecta si este script fue quien levantó el contenedor de BD,
# para poder bajarlo limpiamente al salir con Ctrl+C.
WE_STARTED_DB=0

cleanup() {
  echo
  log "Deteniendo..."
  if [[ $WE_STARTED_DB -eq 1 ]]; then
    log "Apagando contenedor de MariaDB (lo iniciamos nosotros)..."
    docker compose stop db >/dev/null 2>&1 || true
  fi
  ok "Listo."
}
trap cleanup EXIT INT TERM

# ----------------------------------------------------------------------------
# Parseo de argumentos
# ----------------------------------------------------------------------------
RESTORE_DUMP=0
RUN_SERVER=1
STOP_ONLY=0
for arg in "$@"; do
  case "$arg" in
    --restore-dump) RESTORE_DUMP=1 ;;
    --no-server)    RUN_SERVER=0 ;;
    --stop)         STOP_ONLY=1 ;;
    -h|--help)
      sed -n '3,20p' "$0"; exit 0 ;;
    *) err "Argumento desconocido: $arg"; exit 1 ;;
  esac
done

# ----------------------------------------------------------------------------
# 0. Modo --stop
# ----------------------------------------------------------------------------
if [[ $STOP_ONLY -eq 1 ]]; then
  log "Deteniendo contenedores del proyecto..."
  docker compose down
  ok "Contenedores detenidos."
  exit 0
fi

# ----------------------------------------------------------------------------
# 1. Verificar prerequisitos
# ----------------------------------------------------------------------------
log "Verificando prerequisitos..."

if ! command -v docker >/dev/null 2>&1; then
  err "Docker no está instalado. Instala Docker Desktop y vuelve a intentar."
  exit 1
fi
if ! docker info >/dev/null 2>&1; then
  err "Docker no está corriendo. Inicia Docker Desktop e intenta de nuevo."
  exit 1
fi
ok "Docker OK"

if ! command -v python3 >/dev/null 2>&1; then
  err "Python 3 no está instalado."
  exit 1
fi
ok "Python $(python3 --version) OK"

# arm64 necesita mariadb-connector-c de Homebrew para compilar mysqlclient
if [[ $(uname -m) == "arm64" ]]; then
  if [[ ! -d "/opt/homebrew/opt/mariadb-connector-c" ]]; then
    warn "En Apple Silicon falta mariadb-connector-c (necesario para mysqlclient)."
    warn "Intentando instalarlo automáticamente con Homebrew..."
    if command -v brew >/dev/null 2>&1; then
      brew install mariadb-connector-c || {
        err "Falló la instalación automática. Ejecuta manualmente: brew install mariadb-connector-c"
        exit 1
      }
    else
      err "Homebrew no está instalado. Instálalo desde https://brew.sh y luego: brew install mariadb-connector-c"
      exit 1
    fi
  fi
  export LDFLAGS="-L/opt/homebrew/opt/mariadb-connector-c/lib"
  export CPPFLAGS="-I/opt/homebrew/opt/mariadb-connector-c/include"
  ok "mariadb-connector-c listo (arm64)"
fi

# ----------------------------------------------------------------------------
# 2. Generar .env.local ANTES de levantar docker compose
#    (docker compose valida todos los env_file referenciados, incluso si solo
#     arrancas el servicio `db`)
# ----------------------------------------------------------------------------
if [[ ! -f ".env.local" ]]; then
  log "Creando .env.local con valores locales por defecto..."
  cat > .env.local <<EOF
# Django
DJANGO_SECRET_KEY=django-insecure-local-dev-key-$(date +%s)
DEBUG=True

# Base de datos (MariaDB local en Docker)
DB_ENGINE=django.db.backends.mysql
DB_NAME=$DB_NAME
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASSWORD
DB_HOST=127.0.0.1
DB_PORT=$DB_PORT_LOCAL

# Email (deja el password vacío en dev; el envío solo se logueará si activas console backend)
EMAIL_HOST_USER=kidsfun.developer@gmail.com
EMAIL_HOST_PASSWORD=
DEFAULT_FROM_EMAIL=kidsfun.developer@gmail.com

# Firebase (opcional en dev; comenta si no lo necesitas)
# FIREBASE_CREDENTIALS_PATH=credentials/smap-kf-firebase-adminsdk-xqq0l-dc3c83c990.json
EOF
  ok ".env.local creado."
else
  ok ".env.local ya existe, lo respeto."
fi

# ----------------------------------------------------------------------------
# 3. Levantar MariaDB en Docker
# ----------------------------------------------------------------------------
log "Verificando MariaDB en puerto $DB_PORT_LOCAL..."
if lsof -Pi :$DB_PORT_LOCAL -sTCP:LISTEN -t >/dev/null 2>&1; then
  ok "Algo ya escucha en :$DB_PORT_LOCAL (BD probablemente activa)."
else
  log "Levantando MariaDB con docker compose..."
  docker compose up -d db
  WE_STARTED_DB=1

  log "Esperando a que MariaDB acepte conexiones..."
  for i in {1..40}; do
    if docker exec "$(docker compose ps -q db)" \
         mariadb -uroot -p"$DB_ROOT_PASSWORD" -e "SELECT 1" >/dev/null 2>&1; then
      ok "MariaDB lista."
      break
    fi
    sleep 1
    if [[ $i -eq 40 ]]; then
      err "MariaDB no respondió en 40s. Revisa con: docker compose logs db"
      exit 1
    fi
  done
fi

# ----------------------------------------------------------------------------
# 4. venv + dependencias
# ----------------------------------------------------------------------------
if [[ ! -f "venv/bin/activate" ]]; then
  log "Creando entorno virtual venv/..."
  rm -rf venv
  python3 -m venv venv
fi
# shellcheck disable=SC1091
source venv/bin/activate

log "Actualizando pip e instalando requirements.txt..."
./venv/bin/python -m pip install --upgrade pip >/dev/null
./venv/bin/python -m pip install -r requirements.txt
ok "Dependencias instaladas."

# ----------------------------------------------------------------------------
# 5. Generar .env.dev apuntando a localhost:3307 (lo que usa Django al correr)
# ----------------------------------------------------------------------------
log "Generando .env.dev desde .env.local..."
if [[ ! -f ".env.dev" ]]; then
  cp .env.local .env.dev
  sed -i '' 's/^DB_HOST=.*/DB_HOST=127.0.0.1/' .env.dev
  sed -i '' 's/^DB_PORT=.*/DB_PORT='"$DB_PORT_LOCAL"'/' .env.dev
  ok ".env.dev listo (DB_HOST=127.0.0.1, DB_PORT=$DB_PORT_LOCAL)."
else
  ok ".env.dev ya existe, lo respeto."
fi

export ENV_FILE=.env.dev

# ----------------------------------------------------------------------------
# 6. Restaurar dump si se pidió
# ----------------------------------------------------------------------------
# (numeración ajustada tras mover la creación de .env.local arriba)
if [[ $RESTORE_DUMP -eq 1 ]]; then
  if [[ ! -f "$DUMP_PATH" ]]; then
    err "No se encontró el dump en: $DUMP_PATH"
    err "Bájalo primero con:"
    err "    scp root@82.165.210.146:/root/smap_kf_backup.dump $DUMP_PATH"
    exit 1
  fi
  log "Restaurando dump $DUMP_PATH en MariaDB..."
  DB_CONTAINER=$(docker compose ps -q db)
  case "$DUMP_PATH" in
    *.gz)
      gunzip -c "$DUMP_PATH" | docker exec -i "$DB_CONTAINER" \
        mariadb --binary-mode=1 -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME"
      ;;
    *)
      docker exec -i "$DB_CONTAINER" \
        mariadb --binary-mode=1 -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < "$DUMP_PATH"
      ;;
  esac
  ok "Dump restaurado."
fi

# ----------------------------------------------------------------------------
# 7. Migraciones
# ----------------------------------------------------------------------------
# (numeración ajustada tras mover la creación de .env.local arriba)
log "Ejecutando migraciones..."
./venv/bin/python manage.py migrate --noinput
ok "Migraciones aplicadas."

# ----------------------------------------------------------------------------
# 8. Servidor de desarrollo
# ----------------------------------------------------------------------------
# (numeración ajustada tras mover la creación de .env.local arriba)
if [[ $RUN_SERVER -eq 0 ]]; then
  ok "Entorno preparado. BD activa, dependencias instaladas, migraciones aplicadas."
  ok "Para arrancar el server cuando quieras:"
  echo "    cd '$PROJECT_DIR' && source venv/bin/activate && export ENV_FILE=.env.dev && python manage.py runserver"
  exit 0
fi

log "Arrancando servidor en http://127.0.0.1:8000  (Ctrl+C para detener)"
echo
./venv/bin/python manage.py runserver