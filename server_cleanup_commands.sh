#!/bin/bash

# 🧹 Script de Limpieza del Servidor - KidsFun Django Project
# Este script elimina proyectos existentes y configura el servidor para el nuevo proyecto Django

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

# Variables de configuración
PROJECT_NAME="kidsfun_django"
DOMAIN="kidsfunyfiestasinfantiles.com"

# Función para eliminar proyectos existentes
remove_existing_projects() {
    print_status "Eliminando proyectos existentes..."
    
    # Listar directorios en /var/www
    echo "📁 Directorios actuales en /var/www:"
    ls -la /var/www/
    
    # Eliminar proyectos Angular y Node.js
    if [ -d "/var/www/angular-project" ]; then
        print_status "Eliminando proyecto Angular..."
        sudo rm -rf /var/www/angular-project
        print_success "Proyecto Angular eliminado"
    fi
    
    if [ -d "/var/www/node-project" ]; then
        print_status "Eliminando proyecto Node.js..."
        sudo rm -rf /var/www/node-project
        print_success "Proyecto Node.js eliminado"
    fi
    
    # Eliminar otros proyectos que no sean el nuevo Django
    for dir in /var/www/*; do
        if [ -d "$dir" ] && [ "$(basename "$dir")" != "$PROJECT_NAME" ] && [ "$(basename "$dir")" != "html" ]; then
            print_status "Eliminando directorio: $(basename "$dir")"
            sudo rm -rf "$dir"
        fi
    done
}

# Función para limpiar configuraciones de Nginx
cleanup_nginx_configs() {
    print_status "Limpiando configuraciones de Nginx..."
    
    # Listar configuraciones actuales
    echo "📁 Configuraciones actuales de Nginx:"
    ls -la /etc/nginx/sites-enabled/
    
    # Eliminar configuraciones de proyectos anteriores
    sudo rm -f /etc/nginx/sites-enabled/default
    sudo rm -f /etc/nginx/sites-enabled/angular-project
    sudo rm -f /etc/nginx/sites-enabled/node-project
    
    # Eliminar configuraciones que no sean para el nuevo dominio
    for config in /etc/nginx/sites-enabled/*; do
        if [ -f "$config" ] && [[ "$(basename "$config")" != "$DOMAIN" ]]; then
            print_status "Eliminando configuración: $(basename "$config")"
            sudo rm -f "$config"
        fi
    done
    
    # Verificar configuración
    if sudo nginx -t; then
        sudo systemctl reload nginx
        print_success "Nginx recargado"
    else
        print_error "Error en la configuración de Nginx"
        exit 1
    fi
}

# Función para limpiar certificados SSL innecesarios
cleanup_ssl_certificates() {
    print_status "Limpiando certificados SSL innecesarios..."
    
    # Listar certificados actuales
    echo "📁 Certificados SSL actuales:"
    sudo certbot certificates
    
    # Eliminar certificados que no sean para el nuevo dominio
    for cert in /etc/letsencrypt/live/*; do
        if [ -d "$cert" ] && [[ "$(basename "$cert")" != "$DOMAIN" ]]; then
            print_status "Eliminando certificado: $(basename "$cert")"
            sudo certbot delete --cert-name "$(basename "$cert")" --non-interactive
        fi
    done
}

# Función para limpiar servicios systemd innecesarios
cleanup_systemd_services() {
    print_status "Limpiando servicios systemd innecesarios..."
    
    # Listar servicios actuales
    echo "📁 Servicios systemd actuales:"
    sudo systemctl list-units --type=service --state=running | grep -E "(angular|node|project)"
    
    # Detener y deshabilitar servicios de proyectos anteriores
    for service in angular-project node-project; do
        if sudo systemctl is-active --quiet "$service"; then
            print_status "Deteniendo servicio: $service"
            sudo systemctl stop "$service"
            sudo systemctl disable "$service"
        fi
    done
    
    # Eliminar archivos de servicio
    sudo rm -f /etc/systemd/system/angular-project.service
    sudo rm -f /etc/systemd/system/node-project.service
    
    # Recargar systemd
    sudo systemctl daemon-reload
}

# Función para verificar estado actual
check_current_status() {
    print_status "Verificando estado actual del servidor..."
    
    echo "📊 Estado de servicios:"
    sudo systemctl status nginx postgresql --no-pager
    
    echo "📁 Directorios en /var/www:"
    ls -la /var/www/
    
    echo "📁 Configuraciones de Nginx:"
    ls -la /etc/nginx/sites-enabled/
    
    echo "📁 Certificados SSL:"
    sudo certbot certificates
}

# Función principal
main() {
    print_status "🧹 Iniciando limpieza del servidor..."
    print_status "Dominio objetivo: $DOMAIN"
    echo
    
    # Verificar que estamos ejecutando como root o con sudo
    if [ "$EUID" -ne 0 ]; then
        print_error "Este script debe ejecutarse con privilegios de administrador"
        print_status "Ejecuta: sudo $0"
        exit 1
    fi
    
    # Ejecutar pasos de limpieza
    remove_existing_projects
    cleanup_nginx_configs
    cleanup_ssl_certificates
    cleanup_systemd_services
    check_current_status
    
    echo
    print_success "🎉 ¡Limpieza del servidor completada!"
    print_status "El servidor está listo para el nuevo proyecto Django"
    print_status "Próximo paso: Ejecutar setup_server.sh"
}

# Ejecutar función principal
main "$@" 