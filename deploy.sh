#!/bin/bash

# Script de despliegue para KidsFun Django Project
# Autor: Mario Roberto
# Fecha: $(date +%Y-%m-%d)

set -e  # Exit on any error

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuración
SERVER_IP="82.165.210.146"
SERVER_USER="root"
PROJECT_PATH="/var/www/kidsfun_django"
PROJECT_NAME="kidsfun_django"
DOMAIN="kidsfunyfiestasinfantiles.com"

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

# Función para verificar si el comando existe
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Verificar dependencias
check_dependencies() {
    print_status "Verificando dependencias..."
    
    if ! command_exists ssh; then
        print_error "SSH no está instalado. Por favor instálalo primero."
        exit 1
    fi
    
    if ! command_exists git; then
        print_error "Git no está instalado. Por favor instálalo primero."
        exit 1
    fi
    
    print_success "Dependencias verificadas"
}

# Función para hacer backup
create_backup() {
    print_status "Creando backup del proyecto..."
    
    ssh ${SERVER_USER}@${SERVER_IP} "cd ${PROJECT_PATH} && \
        if [ -d 'backup' ]; then rm -rf backup; fi && \
        mkdir -p backup && \
        tar -czf backup/backup_$(date +%Y%m%d_%H%M%S).tar.gz --exclude='backup' --exclude='.git' . && \
        echo 'Backup creado exitosamente'"
    
    print_success "Backup creado"
}

# Función para verificar el estado del servicio
check_service_status() {
    print_status "Verificando estado del servicio..."
    
    if ssh ${SERVER_USER}@${SERVER_IP} "systemctl is-active --quiet ${PROJECT_NAME}"; then
        print_success "Servicio ${PROJECT_NAME} está activo"
        return 0
    else
        print_warning "Servicio ${PROJECT_NAME} no está activo"
        return 1
    fi
}

# Función para detener el servicio
stop_service() {
    print_status "Deteniendo servicio ${PROJECT_NAME}..."
    
    if check_service_status; then
        ssh ${SERVER_USER}@${SERVER_IP} "systemctl stop ${PROJECT_NAME}"
        sleep 3
        print_success "Servicio detenido"
    else
        print_warning "Servicio ya estaba detenido"
    fi
}

# Función para iniciar el servicio
start_service() {
    print_status "Iniciando servicio ${PROJECT_NAME}..."
    
    ssh ${SERVER_USER}@${SERVER_IP} "systemctl start ${PROJECT_NAME}"
    sleep 5
    
    if check_service_status; then
        print_success "Servicio iniciado correctamente"
    else
        print_error "Error al iniciar el servicio"
        return 1
    fi
}

# Función para actualizar el código
update_code() {
    print_status "Actualizando código del proyecto..."
    
    ssh ${SERVER_USER}@${SERVER_IP} "cd ${PROJECT_PATH} && \
        git fetch origin && \
        git reset --hard origin/main && \
        git clean -fd"
    
    print_success "Código actualizado"
}

# Función para instalar dependencias
install_dependencies() {
    print_status "Instalando dependencias de Python..."
    
    ssh ${SERVER_USER}@${SERVER_IP} "cd ${PROJECT_PATH} && \
        source venv/bin/activate && \
        pip install -r requirements.txt --quiet"
    
    print_success "Dependencias instaladas"
}

# Función para aplicar migraciones
apply_migrations() {
    print_status "Aplicando migraciones de la base de datos..."
    
    ssh ${SERVER_USER}@${SERVER_IP} "cd ${PROJECT_PATH} && \
        source venv/bin/activate && \
        python manage.py migrate --noinput"
    
    print_success "Migraciones aplicadas"
}

# Función para recolectar archivos estáticos
collect_static() {
    print_status "Recolectando archivos estáticos..."
    
    ssh ${SERVER_USER}@${SERVER_IP} "cd ${PROJECT_PATH} && \
        source venv/bin/activate && \
        python manage.py collectstatic --noinput --clear"
    
    print_success "Archivos estáticos recolectados"
}

# Función para verificar la configuración
check_configuration() {
    print_status "Verificando configuración de Django..."
    
    ssh ${SERVER_USER}@${SERVER_IP} "cd ${PROJECT_PATH} && \
        source venv/bin/activate && \
        python manage.py check --deploy"
    
    print_success "Configuración verificada"
}

# Función para reiniciar servicios
restart_services() {
    print_status "Reiniciando servicios..."
    
    # Reiniciar Nginx
    ssh ${SERVER_USER}@${SERVER_IP} "systemctl reload nginx"
    print_success "Nginx recargado"
    
    # Reiniciar el servicio de Django
    if check_service_status; then
        ssh ${SERVER_USER}@${SERVER_IP} "systemctl restart ${PROJECT_NAME}"
        sleep 5
        print_success "Servicio ${PROJECT_NAME} reiniciado"
    else
        start_service
    fi
}

# Función para verificar la salud del sitio
check_site_health() {
    print_status "Verificando salud del sitio web..."
    
    # Verificar que el sitio responde
    if curl -s -o /dev/null -w "%{http_code}" "https://${DOMAIN}" | grep -q "200\|301\|302"; then
        print_success "Sitio web responde correctamente"
    else
        print_warning "Sitio web no responde como esperado"
    fi
    
    # Verificar APIs
    if curl -s -o /dev/null -w "%{http_code}" "https://${DOMAIN}/api/v2/waiver/" | grep -q "200\|405"; then
        print_success "APIs responden correctamente"
    else
        print_warning "APIs no responden como esperado"
    fi
}

# Función para mostrar logs
show_logs() {
    print_status "Mostrando logs recientes..."
    
    echo -e "\n${YELLOW}=== Logs del servicio ${PROJECT_NAME} ===${NC}"
    ssh ${SERVER_USER}@${SERVER_IP} "journalctl -u ${PROJECT_NAME} -n 20 --no-pager"
    
    echo -e "\n${YELLOW}=== Logs de Nginx ===${NC}"
    ssh ${SERVER_USER}@${SERVER_IP} "tail -n 10 /var/log/nginx/error.log"
}

# Función principal de despliegue
main_deploy() {
    print_status "Iniciando despliegue del proyecto ${PROJECT_NAME}..."
    echo "=================================================="
    
    # Verificar dependencias
    check_dependencies
    
    # Crear backup
    create_backup
    
    # Detener servicio
    stop_service
    
    # Actualizar código
    update_code
    
    # Instalar dependencias
    install_dependencies
    
    # Aplicar migraciones
    apply_migrations
    
    # Recolectar archivos estáticos
    collect_static
    
    # Verificar configuración
    check_configuration
    
    # Reiniciar servicios
    restart_services
    
    # Verificar salud del sitio
    check_site_health
    
    echo "=================================================="
    print_success "¡Despliegue completado exitosamente!"
    
    # Mostrar logs
    show_logs
}

# Función para mostrar ayuda
show_help() {
    echo "Script de despliegue para KidsFun Django Project"
    echo ""
    echo "Uso: $0 [OPCIÓN]"
    echo ""
    echo "Opciones:"
    echo "  deploy    - Realizar despliegue completo (default)"
    echo "  backup    - Crear solo backup"
    echo "  update    - Solo actualizar código"
    echo "  migrate   - Solo aplicar migraciones"
    echo "  restart   - Solo reiniciar servicios"
    echo "  status    - Verificar estado de servicios"
    echo "  logs      - Mostrar logs"
    echo "  health    - Verificar salud del sitio"
    echo "  help      - Mostrar esta ayuda"
    echo ""
    echo "Ejemplos:"
    echo "  $0 deploy    # Despliegue completo"
    echo "  $0 status    # Verificar estado"
    echo "  $0 logs      # Ver logs"
}

# Función para verificar estado
check_status() {
    print_status "Verificando estado de servicios..."
    
    echo -e "\n${YELLOW}=== Estado del servicio ${PROJECT_NAME} ===${NC}"
    ssh ${SERVER_USER}@${SERVER_IP} "systemctl status ${PROJECT_NAME} --no-pager -l"
    
    echo -e "\n${YELLOW}=== Estado de Nginx ===${NC}"
    ssh ${SERVER_USER}@${SERVER_IP} "systemctl status nginx --no-pager -l"
    
    echo -e "\n${YELLOW}=== Procesos activos ===${NC}"
    ssh ${SERVER_USER}@${SERVER_IP} "ps aux | grep -E '(gunicorn|nginx)' | grep -v grep"
}

# Función para verificar salud
check_health() {
    check_site_health
}

# Función para mostrar logs
show_logs_only() {
    show_logs
}

# Función para crear solo backup
create_backup_only() {
    create_backup
}

# Función para solo actualizar código
update_code_only() {
    update_code
    install_dependencies
    collect_static
    restart_services
}

# Función para solo aplicar migraciones
apply_migrations_only() {
    stop_service
    apply_migrations
    start_service
}

# Función para solo reiniciar servicios
restart_services_only() {
    restart_services
}

# Procesar argumentos
case "${1:-deploy}" in
    "deploy")
        main_deploy
        ;;
    "backup")
        create_backup_only
        ;;
    "update")
        update_code_only
        ;;
    "migrate")
        apply_migrations_only
        ;;
    "restart")
        restart_services_only
        ;;
    "status")
        check_status
        ;;
    "logs")
        show_logs_only
        ;;
    "health")
        check_health
        ;;
    "help"|"-h"|"--help")
        show_help
        ;;
    *)
        print_error "Opción desconocida: $1"
        show_help
        exit 1
        ;;
esac 