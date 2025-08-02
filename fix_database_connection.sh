#!/bin/bash

# Script para solucionar problemas de conexión a la base de datos
# Autor: Sistema de Corrección de Base de Datos
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

# Función para verificar configuración actual
check_current_config() {
    print_status "Verificando configuración actual de base de datos..."
    
    if [ -f ".env" ]; then
        echo "Configuración actual en .env:"
        grep -E "DB_|DATABASE" .env || echo "No se encontraron variables de base de datos"
        echo ""
    else
        print_warning "No se encontró archivo .env"
    fi
    
    # Verificar configuración en settings.py
    echo "Configuración en settings.py:"
    grep -A 10 "DATABASES" smap_project/settings.py || echo "No se encontró configuración de DATABASES"
    echo ""
}

# Función para probar conexión
test_connection() {
    print_status "Probando conexión a la base de datos..."
    
    # Cargar variables de entorno si existe .env
    if [ -f ".env" ]; then
        export $(cat .env | grep -v '^#' | xargs)
    fi
    
    # Variables por defecto
    DB_HOST=${DB_HOST:-"82.165.210.146"}
    DB_PORT=${DB_PORT:-"5432"}
    DB_NAME=${DB_NAME:-"smap_kf"}
    DB_USER=${DB_USER:-"mrgomez"}
    DB_PASSWORD=${DB_PASSWORD:-"Karin2100"}
    
    echo "Probando conexión con:"
    echo "  Host: $DB_HOST"
    echo "  Puerto: $DB_PORT"
    echo "  Base de datos: $DB_NAME"
    echo "  Usuario: $DB_USER"
    echo ""
    
    # Probar conexión
    if PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" > /dev/null 2>&1; then
        print_success "Conexión exitosa a la base de datos"
        return 0
    else
        print_error "Error al conectar con la base de datos"
        return 1
    fi
}

# Función para solicitar nuevas credenciales
get_new_credentials() {
    print_status "Solicitando nuevas credenciales de base de datos..."
    
    echo "Por favor, proporciona las credenciales correctas:"
    echo ""
    
    read -p "Host de la base de datos (default: 82.165.210.146): " NEW_DB_HOST
    NEW_DB_HOST=${NEW_DB_HOST:-"82.165.210.146"}
    
    read -p "Puerto de la base de datos (default: 5432): " NEW_DB_PORT
    NEW_DB_PORT=${NEW_DB_PORT:-"5432"}
    
    read -p "Nombre de la base de datos (default: smap_kf): " NEW_DB_NAME
    NEW_DB_NAME=${NEW_DB_NAME:-"smap_kf"}
    
    read -p "Usuario de la base de datos (default: mrgomez): " NEW_DB_USER
    NEW_DB_USER=${NEW_DB_USER:-"mrgomez"}
    
    read -s -p "Contraseña de la base de datos: " NEW_DB_PASSWORD
    echo ""
    
    # Probar conexión con nuevas credenciales
    print_status "Probando conexión con nuevas credenciales..."
    
    if PGPASSWORD="$NEW_DB_PASSWORD" psql -h "$NEW_DB_HOST" -p "$NEW_DB_PORT" -U "$NEW_DB_USER" -d "$NEW_DB_NAME" -c "SELECT 1;" > /dev/null 2>&1; then
        print_success "Conexión exitosa con nuevas credenciales"
        
        # Actualizar archivo .env
        update_env_file
        
        return 0
    else
        print_error "Error al conectar con las nuevas credenciales"
        return 1
    fi
}

# Función para actualizar archivo .env
update_env_file() {
    print_status "Actualizando archivo .env con nuevas credenciales..."
    
    # Crear backup del archivo .env actual
    if [ -f ".env" ]; then
        cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
        print_success "Backup creado: .env.backup.$(date +%Y%m%d_%H%M%S)"
    fi
    
    # Actualizar o crear archivo .env
    cat > .env << EOF
# Configuración de Django
DJANGO_SECRET_KEY=django-insecure-$(openssl rand -hex 32)
DEBUG=False

# Configuración de Base de Datos
DB_NAME=$NEW_DB_NAME
DB_USER=$NEW_DB_USER
DB_PASSWORD=$NEW_DB_PASSWORD
DB_HOST=$NEW_DB_HOST
DB_PORT=$NEW_DB_PORT

# Configuración de Email
EMAIL_HOST_USER=kidsfun.developer@gmail.com
EMAIL_HOST_PASSWORD=Karin2100
DEFAULT_FROM_EMAIL=kidsfun.developer@gmail.com

# Configuración del servidor
ALLOWED_HOSTS=kidsfunyfiestasinfantiles.com,www.kidsfunyfiestasinfantiles.com,localhost,127.0.0.1
EOF
    
    print_success "Archivo .env actualizado con nuevas credenciales"
}

# Función para verificar Django
test_django_connection() {
    print_status "Verificando conexión de Django a la base de datos..."
    
    # Activar entorno virtual
    source venv/bin/activate
    
    # Verificar configuración de Django
    if python manage.py check --database default > /dev/null 2>&1; then
        print_success "Django puede conectarse a la base de datos"
        return 0
    else
        print_error "Django no puede conectarse a la base de datos"
        return 1
    fi
}

# Función para ejecutar migraciones
run_migrations() {
    print_status "Ejecutando migraciones de Django..."
    
    # Activar entorno virtual
    source venv/bin/activate
    
    # Ejecutar migraciones
    if python manage.py migrate; then
        print_success "Migraciones ejecutadas correctamente"
        return 0
    else
        print_error "Error al ejecutar migraciones"
        return 1
    fi
}

# Función para mostrar opciones de solución
show_solution_options() {
    echo ""
    echo "=========================================="
    echo "🔧 OPCIONES DE SOLUCIÓN"
    echo "=========================================="
    echo ""
    echo "1. Verificar credenciales actuales"
    echo "2. Probar conexión manual"
    echo "3. Actualizar credenciales"
    echo "4. Verificar configuración de PostgreSQL"
    echo "5. Crear nuevo usuario de base de datos"
    echo ""
    echo "Posibles causas del problema:"
    echo "- Contraseña incorrecta"
    echo "- Usuario no existe"
    echo "- Base de datos no existe"
    echo "- Firewall bloqueando conexión"
    echo "- PostgreSQL no está ejecutándose"
    echo ""
}

# Función principal
main() {
    echo "=========================================="
    echo "🔧 CORRECCIÓN DE CONEXIÓN A BASE DE DATOS"
    echo "=========================================="
    echo "Fecha: $(date)"
    echo "=========================================="
    
    # Verificar que estamos en el directorio correcto
    if [ ! -f "manage.py" ]; then
        print_error "No se encontró manage.py. Asegúrate de estar en el directorio del proyecto Django."
        exit 1
    fi
    
    # Verificar configuración actual
    check_current_config
    
    # Probar conexión actual
    if test_connection; then
        print_success "La conexión actual funciona correctamente"
        
        # Verificar Django
        if test_django_connection; then
            print_success "Django puede conectarse correctamente"
            
            # Ejecutar migraciones
            if run_migrations; then
                print_success "🎉 Base de datos configurada correctamente"
                exit 0
            fi
        fi
    else
        print_warning "La conexión actual falló"
        
        # Mostrar opciones
        show_solution_options
        
        # Preguntar si quiere actualizar credenciales
        read -p "¿Quieres actualizar las credenciales de la base de datos? (y/n): " UPDATE_CREDS
        
        if [ "$UPDATE_CREDS" = "y" ]; then
            if get_new_credentials; then
                if test_django_connection; then
                    if run_migrations; then
                        print_success "🎉 Base de datos configurada correctamente"
                        exit 0
                    fi
                fi
            fi
        else
            print_warning "No se actualizaron las credenciales. Revisa manualmente la configuración."
            exit 1
        fi
    fi
}

# Ejecutar función principal
main "$@" 