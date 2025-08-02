#!/bin/bash

# Script de despliegue para Kidsfun System
# Autor: Sistema de Despliegue Automatizado
# Fecha: $(date)

set -e  # Salir si hay algún error

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para imprimir mensajes con colores
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Función para crear backup de la base de datos
backup_database() {
    print_status "Creando backup de la base de datos..."
    
    # Crear directorio de backups si no existe
    mkdir -p backups
    
    # Nombre del archivo de backup con timestamp
    BACKUP_FILE="backups/backup_$(date +%Y%m%d_%H%M%S).sql"
    
    # Variables de base de datos desde .env o por defecto
    DB_NAME=${DB_NAME:-"smap_kf"}
    DB_USER=${DB_USER:-"mrgomez"}
    DB_HOST=${DB_HOST:-"82.165.210.146"}
    DB_PORT=${DB_PORT:-"5432"}
    
    # Crear backup
    if pg_dump -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME > "$BACKUP_FILE" 2>/dev/null; then
        print_success "Backup creado exitosamente: $BACKUP_FILE"
    else
        print_warning "No se pudo crear backup de la base de datos. Continuando..."
    fi
}

# Función para actualizar el repositorio
update_repository() {
    print_status "Actualizando repositorio desde Git..."
    
    # Verificar si hay cambios sin commitear
    if ! git diff-index --quiet HEAD --; then
        print_warning "Hay cambios sin commitear. Creando commit automático..."
        git add .
        git commit -m "Auto-commit antes del despliegue - $(date)"
    fi
    
    # Obtener cambios del repositorio remoto
    git fetch origin
    
    # Verificar si hay cambios remotos
    if git rev-list HEAD...origin/main --count > /dev/null 2>&1; then
        LOCAL_COMMITS=$(git rev-list HEAD...origin/main --count 2>/dev/null | head -1)
        REMOTE_COMMITS=$(git rev-list origin/main...HEAD --count 2>/dev/null | head -1)
        
        if [ "$REMOTE_COMMITS" -gt 0 ]; then
            print_status "Hay $REMOTE_COMMITS commits remotos. Actualizando..."
            git pull origin main
            print_success "Repositorio actualizado exitosamente"
        else
            print_success "El repositorio ya está actualizado"
        fi
    else
        print_success "No hay cambios remotos para actualizar"
    fi
}

# Función para instalar/actualizar dependencias
install_dependencies() {
    print_status "Instalando/actualizando dependencias de Python..."
    
    # Verificar si existe el entorno virtual
    if [ ! -d "venv" ]; then
        print_status "Creando entorno virtual..."
        python3 -m venv venv
    fi
    
    # Activar entorno virtual
    source venv/bin/activate
    
    # Actualizar pip
    pip install --upgrade pip
    
    # Instalar dependencias
    if [ -f "requirements.txt" ]; then
        pip install -r requirements.txt
    else
        print_warning "No se encontró requirements.txt. Instalando dependencias básicas..."
        pip install django djangorestframework django-cors-headers psycopg2-binary python-dotenv pillow firebase-admin
    fi
    
    print_success "Dependencias instaladas correctamente"
}

# Función para configurar variables de entorno
setup_environment() {
    print_status "Configurando variables de entorno..."
    
    # Verificar si existe .env
    if [ ! -f ".env" ]; then
        print_warning "No se encontró archivo .env. Creando desde ejemplo..."
        if [ -f "env.example" ]; then
            cp env.example .env
            print_warning "Archivo .env creado desde ejemplo. Por favor, configura las variables necesarias."
        else
            print_warning "Creando archivo .env básico..."
            cat > .env << EOF
# Configuración de Django
DJANGO_SECRET_KEY=django-insecure-(y@^qkirxh^6wd9#913ts$a!3j@!gfrnsv-lj@_%$+%$iml*k2
DEBUG=False

# Configuración de Base de Datos
DB_NAME=smap_kf
DB_USER=mrgomez
DB_PASSWORD=Karin2100
DB_HOST=82.165.210.146
DB_PORT=5432

# Configuración de Email
EMAIL_HOST_USER=kidsfun.developer@gmail.com
EMAIL_HOST_PASSWORD=Karin2100
DEFAULT_FROM_EMAIL=kidsfun.developer@gmail.com
EOF
        fi
    fi
    
    # Cargar variables de entorno
    if [ -f ".env" ]; then
        export $(cat .env | grep -v '^#' | xargs)
    fi
    
    print_success "Variables de entorno configuradas"
}

# Función para ejecutar migraciones
run_migrations() {
    print_status "Ejecutando migraciones de Django..."
    
    # Activar entorno virtual
    source venv/bin/activate
    
    # Ejecutar migraciones
    python manage.py makemigrations
    python manage.py migrate
    
    print_success "Migraciones ejecutadas correctamente"
}

# Función para recolectar archivos estáticos
collect_static() {
    print_status "Recolectando archivos estáticos..."
    
    # Activar entorno virtual
    source venv/bin/activate
    
    # Crear directorio de logs si no existe
    mkdir -p logs
    
    # Recolectar archivos estáticos
    python manage.py collectstatic --noinput
    
    print_success "Archivos estáticos recolectados"
}

# Función para verificar permisos
check_permissions() {
    print_status "Verificando permisos de archivos..."
    
    # Dar permisos de ejecución al script
    chmod +x deploy.sh
    
    # Verificar permisos de directorios importantes
    chmod 755 staticfiles/
    chmod 755 media/
    chmod 755 logs/
    
    print_success "Permisos verificados"
}

# Función para reiniciar servicios
restart_services() {
    print_status "Reiniciando servicios..."
    
    # Intentar reiniciar servicios comunes (ajustar según el servidor)
    if command -v systemctl &> /dev/null; then
        # Para sistemas con systemd
        if systemctl is-active --quiet nginx; then
            sudo systemctl restart nginx
            print_success "Nginx reiniciado"
        fi
        
        if systemctl is-active --quiet gunicorn; then
            sudo systemctl restart gunicorn
            print_success "Gunicorn reiniciado"
        fi
    elif command -v service &> /dev/null; then
        # Para sistemas con service
        if service nginx status &> /dev/null; then
            sudo service nginx restart
            print_success "Nginx reiniciado"
        fi
    fi
    
    print_success "Servicios reiniciados"
}

# Función para verificar el estado del despliegue
check_deployment() {
    print_status "Verificando estado del despliegue..."
    
    # Activar entorno virtual
    source venv/bin/activate
    
    # Verificar que Django puede conectarse a la base de datos
    if python manage.py check --database default; then
        print_success "Conexión a base de datos verificada"
    else
        print_error "Error al conectar con la base de datos"
        exit 1
    fi
    
    # Verificar configuración de Django
    if python manage.py check; then
        print_success "Configuración de Django verificada"
    else
        print_error "Error en la configuración de Django"
        exit 1
    fi
    
    print_success "Despliegue verificado correctamente"
}

# Función principal
main() {
    echo "=========================================="
    echo "🚀 DESPLIEGUE DE KIDSFUN SYSTEM"
    echo "=========================================="
    echo "Fecha: $(date)"
    echo "Directorio: $(pwd)"
    echo "=========================================="
    
    # Verificar que estamos en el directorio correcto
    if [ ! -f "manage.py" ]; then
        print_error "No se encontró manage.py. Asegúrate de estar en el directorio del proyecto Django."
        exit 1
    fi
    
    # Ejecutar pasos del despliegue
    backup_database
    update_repository
    install_dependencies
    setup_environment
    run_migrations
    collect_static
    check_permissions
    restart_services
    check_deployment
    
    echo "=========================================="
    print_success "🎉 DESPLIEGUE COMPLETADO EXITOSAMENTE"
    echo "=========================================="
    echo "El proyecto está listo para producción"
    echo "URL: https://kidsfunyfiestasinfantiles.com"
    echo "=========================================="
}

# Ejecutar función principal
main "$@" 