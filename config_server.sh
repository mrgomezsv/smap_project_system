#!/bin/bash

# Script de configuración personalizada para el servidor
# Autor: Sistema de Configuración Personalizada
# Fecha: $(date)

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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

# Función para obtener información del usuario
get_server_info() {
    echo "=========================================="
    echo "🔧 CONFIGURACIÓN PERSONALIZADA DEL SERVIDOR"
    echo "=========================================="
    echo ""
    
    # Información del servidor
    print_status "Detectando información del servidor..."
    SERVER_HOSTNAME=$(hostname)
    CURRENT_USER=$(whoami)
    CURRENT_DIR=$(pwd)
    
    echo "Hostname: $SERVER_HOSTNAME"
    echo "Usuario actual: $CURRENT_USER"
    echo "Directorio actual: $CURRENT_DIR"
    echo ""
    
    # Solicitar información adicional
    read -p "¿El dominio kidsfunyfiestasinfantiles.com ya está configurado? (y/n): " DOMAIN_CONFIGURED
    read -p "¿La base de datos PostgreSQL está en este servidor? (y/n): " DB_LOCAL
    read -p "¿Tienes acceso sudo/root? (y/n): " HAS_SUDO
    
    # Información de la base de datos
    if [ "$DB_LOCAL" = "n" ]; then
        read -p "IP del servidor de base de datos: " DB_HOST
        read -p "Puerto de la base de datos (default: 5432): " DB_PORT
        DB_PORT=${DB_PORT:-5432}
    else
        DB_HOST="localhost"
        DB_PORT="5432"
    fi
    
    read -p "Nombre de la base de datos (default: smap_kf): " DB_NAME
    DB_NAME=${DB_NAME:-smap_kf}
    read -p "Usuario de la base de datos (default: mrgomez): " DB_USER
    DB_USER=${DB_USER:-mrgomez}
    read -s -p "Contraseña de la base de datos: " DB_PASSWORD
    echo ""
    
    # Información del usuario de la aplicación
    read -p "Usuario para ejecutar la aplicación (default: $CURRENT_USER): " APP_USER
    APP_USER=${APP_USER:-$CURRENT_USER}
    
    # Información del dominio
    read -p "¿Quieres configurar SSL con Let's Encrypt? (y/n): " CONFIGURE_SSL
    if [ "$CONFIGURE_SSL" = "y" ]; then
        read -p "Email para certificados SSL: " SSL_EMAIL
    fi
    
    # Guardar configuración
    save_configuration
}

# Función para guardar la configuración
save_configuration() {
    print_status "Guardando configuración..."
    
    # Crear archivo de configuración
    cat > server_config.env << EOF
# Configuración del servidor
SERVER_HOSTNAME=$SERVER_HOSTNAME
CURRENT_USER=$CURRENT_USER
CURRENT_DIR=$CURRENT_DIR
APP_USER=$APP_USER

# Configuración del dominio
DOMAIN_CONFIGURED=$DOMAIN_CONFIGURED
CONFIGURE_SSL=$CONFIGURE_SSL
SSL_EMAIL=$SSL_EMAIL

# Configuración de la base de datos
DB_LOCAL=$DB_LOCAL
DB_HOST=$DB_HOST
DB_PORT=$DB_PORT
DB_NAME=$DB_NAME
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASSWORD

# Permisos
HAS_SUDO=$HAS_SUDO
EOF
    
    print_success "Configuración guardada en server_config.env"
}

# Función para actualizar scripts con la configuración
update_scripts() {
    print_status "Actualizando scripts con la configuración personalizada..."
    
    # Cargar configuración
    source server_config.env
    
    # Actualizar deploy.sh
    sed -i "s/DB_HOST=\${DB_HOST:-.*}/DB_HOST=\${DB_HOST:-$DB_HOST}/g" deploy.sh
    sed -i "s/DB_PORT=\${DB_PORT:-.*}/DB_PORT=\${DB_PORT:-$DB_PORT}/g" deploy.sh
    sed -i "s/DB_NAME=\${DB_NAME:-.*}/DB_NAME=\${DB_NAME:-$DB_NAME}/g" deploy.sh
    sed -i "s/DB_USER=\${DB_USER:-.*}/DB_USER=\${DB_USER:-$DB_USER}/g" deploy.sh
    
    # Actualizar setup_production.sh
    sed -i "s/USER=\$(whoami)/USER=$APP_USER/g" setup_production.sh
    
    # Actualizar monitor.sh
    sed -i "s/DB_HOST=\${DB_HOST:-.*}/DB_HOST=\${DB_HOST:-$DB_HOST}/g" monitor.sh
    sed -i "s/DB_PORT=\${DB_PORT:-.*}/DB_PORT=\${DB_PORT:-$DB_PORT}/g" monitor.sh
    sed -i "s/DB_NAME=\${DB_NAME:-.*}/DB_NAME=\${DB_NAME:-$DB_NAME}/g" monitor.sh
    sed -i "s/DB_USER=\${DB_USER:-.*}/DB_USER=\${DB_USER:-$DB_USER}/g" monitor.sh
    
    print_success "Scripts actualizados con la configuración personalizada"
}

# Función para crear archivo .env personalizado
create_env_file() {
    print_status "Creando archivo .env personalizado..."
    
    source server_config.env
    
    cat > .env << EOF
# Configuración de Django
DJANGO_SECRET_KEY=django-insecure-$(openssl rand -hex 32)
DEBUG=False

# Configuración de Base de Datos
DB_NAME=$DB_NAME
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASSWORD
DB_HOST=$DB_HOST
DB_PORT=$DB_PORT

# Configuración de Email
EMAIL_HOST_USER=kidsfun.developer@gmail.com
EMAIL_HOST_PASSWORD=Karin2100
DEFAULT_FROM_EMAIL=kidsfun.developer@gmail.com

# Configuración del servidor
ALLOWED_HOSTS=kidsfunyfiestasinfantiles.com,www.kidsfunyfiestasinfantiles.com,localhost,127.0.0.1
EOF
    
    print_success "Archivo .env creado con configuración personalizada"
}

# Función para mostrar resumen de configuración
show_summary() {
    echo ""
    echo "=========================================="
    echo "📋 RESUMEN DE CONFIGURACIÓN"
    echo "=========================================="
    echo "Servidor: $SERVER_HOSTNAME"
    echo "Usuario de la aplicación: $APP_USER"
    echo "Directorio del proyecto: $CURRENT_DIR"
    echo ""
    echo "Base de datos:"
    echo "  - Host: $DB_HOST:$DB_PORT"
    echo "  - Nombre: $DB_NAME"
    echo "  - Usuario: $DB_USER"
    echo ""
    echo "Dominio: kidsfunyfiestasinfantiles.com"
    echo "SSL: $CONFIGURE_SSL"
    echo "=========================================="
    echo ""
}

# Función para mostrar próximos pasos
show_next_steps() {
    echo "=========================================="
    echo "🚀 PRÓXIMOS PASOS"
    echo "=========================================="
    echo ""
    echo "1. Verificar que el dominio apunte a este servidor:"
    echo "   dig kidsfunyfiestasinfantiles.com"
    echo ""
    echo "2. Ejecutar configuración del servidor:"
    echo "   ./setup_production.sh"
    echo ""
    echo "3. Ejecutar despliegue:"
    echo "   ./deploy.sh"
    echo ""
    echo "4. Verificar monitoreo:"
    echo "   ./monitor.sh"
    echo ""
    echo "5. Verificar servicios:"
    echo "   sudo systemctl status kidsfun_gunicorn"
    echo "   sudo systemctl status nginx"
    echo ""
    echo "=========================================="
}

# Función principal
main() {
    echo "=========================================="
    echo "🔧 CONFIGURACIÓN PERSONALIZADA"
    echo "=========================================="
    echo "Este script te ayudará a configurar el servidor"
    echo "con la información específica de tu entorno."
    echo "=========================================="
    echo ""
    
    # Verificar que estamos en el directorio correcto
    if [ ! -f "manage.py" ]; then
        print_error "No se encontró manage.py. Asegúrate de estar en el directorio del proyecto Django."
        exit 1
    fi
    
    # Obtener información del usuario
    get_server_info
    
    # Actualizar scripts
    update_scripts
    
    # Crear archivo .env
    create_env_file
    
    # Mostrar resumen
    show_summary
    
    # Mostrar próximos pasos
    show_next_steps
    
    print_success "🎉 Configuración completada exitosamente"
}

# Ejecutar función principal
main "$@" 