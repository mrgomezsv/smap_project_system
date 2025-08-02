#!/bin/bash

# Script de monitoreo para Kidsfun System
# Autor: Sistema de Monitoreo Automatizado
# Fecha: $(date)

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

# Función para verificar el estado de los servicios
check_services() {
    print_status "Verificando estado de servicios..."
    
    # Verificar Gunicorn
    if systemctl is-active --quiet kidsfun_gunicorn; then
        print_success "Gunicorn está ejecutándose"
    else
        print_error "Gunicorn NO está ejecutándose"
    fi
    
    # Verificar Nginx
    if systemctl is-active --quiet nginx; then
        print_success "Nginx está ejecutándose"
    else
        print_error "Nginx NO está ejecutándose"
    fi
    
    # Verificar PostgreSQL (si está en el mismo servidor)
    if systemctl is-active --quiet postgresql; then
        print_success "PostgreSQL está ejecutándose"
    else
        print_warning "PostgreSQL no está ejecutándose (puede estar en servidor remoto)"
    fi
}

# Función para verificar la conectividad de la base de datos
check_database() {
    print_status "Verificando conectividad de base de datos..."
    
    # Cargar variables de entorno
    if [ -f ".env" ]; then
        export $(cat .env | grep -v '^#' | xargs)
    fi
    
    # Variables por defecto
    DB_NAME=${DB_NAME:-"smap_kf"}
    DB_USER=${DB_USER:-"mrgomez"}
    DB_HOST=${DB_HOST:-"82.165.210.146"}
    DB_PORT=${DB_PORT:-"5432"}
    
    # Verificar conexión
    if pg_isready -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME > /dev/null 2>&1; then
        print_success "Conexión a base de datos exitosa"
    else
        print_error "Error al conectar con la base de datos"
    fi
}

# Función para verificar el estado de Django
check_django() {
    print_status "Verificando estado de Django..."
    
    # Activar entorno virtual
    source venv/bin/activate
    
    # Verificar configuración de Django
    if python manage.py check > /dev/null 2>&1; then
        print_success "Django está configurado correctamente"
    else
        print_error "Error en la configuración de Django"
    fi
    
    # Verificar migraciones pendientes
    MIGRATIONS=$(python manage.py showmigrations --list | grep -c "\[ \]")
    if [ "$MIGRATIONS" -eq 0 ]; then
        print_success "No hay migraciones pendientes"
    else
        print_warning "Hay $MIGRATIONS migraciones pendientes"
    fi
}

# Función para verificar el uso de recursos
check_resources() {
    print_status "Verificando uso de recursos..."
    
    # Uso de CPU
    CPU_USAGE=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)
    echo "CPU Usage: ${CPU_USAGE}%"
    
    # Uso de memoria
    MEMORY_USAGE=$(free | grep Mem | awk '{printf("%.2f", $3/$2 * 100.0)}')
    echo "Memory Usage: ${MEMORY_USAGE}%"
    
    # Uso de disco
    DISK_USAGE=$(df / | tail -1 | awk '{print $5}' | cut -d'%' -f1)
    echo "Disk Usage: ${DISK_USAGE}%"
    
    # Verificar si los valores están en rangos aceptables
    if (( $(echo "$CPU_USAGE < 80" | bc -l) )); then
        print_success "CPU en rango normal"
    else
        print_warning "CPU con uso alto"
    fi
    
    if (( $(echo "$MEMORY_USAGE < 80" | bc -l) )); then
        print_success "Memoria en rango normal"
    else
        print_warning "Memoria con uso alto"
    fi
    
    if [ "$DISK_USAGE" -lt 80 ]; then
        print_success "Disco en rango normal"
    else
        print_warning "Disco con uso alto"
    fi
}

# Función para verificar logs de errores
check_logs() {
    print_status "Verificando logs de errores..."
    
    # Verificar logs de Gunicorn
    if [ -f "logs/gunicorn_error.log" ]; then
        ERROR_COUNT=$(tail -n 100 logs/gunicorn_error.log | grep -c "ERROR")
        if [ "$ERROR_COUNT" -eq 0 ]; then
            print_success "No hay errores recientes en Gunicorn"
        else
            print_warning "Hay $ERROR_COUNT errores recientes en Gunicorn"
        fi
    else
        print_warning "Archivo de log de Gunicorn no encontrado"
    fi
    
    # Verificar logs de Nginx
    if [ -f "/var/log/nginx/kidsfun_error.log" ]; then
        NGINX_ERRORS=$(tail -n 100 /var/log/nginx/kidsfun_error.log | grep -c "error")
        if [ "$NGINX_ERRORS" -eq 0 ]; then
            print_success "No hay errores recientes en Nginx"
        else
            print_warning "Hay $NGINX_ERRORS errores recientes en Nginx"
        fi
    else
        print_warning "Archivo de log de Nginx no encontrado"
    fi
}

# Función para verificar la respuesta del sitio web
check_website() {
    print_status "Verificando respuesta del sitio web..."
    
    # Verificar respuesta HTTP
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://kidsfunyfiestasinfantiles.com)
    
    if [ "$HTTP_STATUS" -eq 200 ]; then
        print_success "Sitio web responde correctamente (HTTP $HTTP_STATUS)"
    else
        print_error "Sitio web no responde correctamente (HTTP $HTTP_STATUS)"
    fi
    
    # Verificar tiempo de respuesta
    RESPONSE_TIME=$(curl -s -w "%{time_total}" -o /dev/null https://kidsfunyfiestasinfantiles.com)
    echo "Tiempo de respuesta: ${RESPONSE_TIME}s"
    
    if (( $(echo "$RESPONSE_TIME < 2" | bc -l) )); then
        print_success "Tiempo de respuesta aceptable"
    else
        print_warning "Tiempo de respuesta lento"
    fi
}

# Función para generar reporte
generate_report() {
    print_status "Generando reporte de monitoreo..."
    
    REPORT_FILE="monitoring_report_$(date +%Y%m%d_%H%M%S).txt"
    
    {
        echo "=========================================="
        echo "📊 REPORTE DE MONITOREO - KIDSFUN SYSTEM"
        echo "=========================================="
        echo "Fecha: $(date)"
        echo "Servidor: $(hostname)"
        echo "=========================================="
        echo ""
        
        echo "🔧 ESTADO DE SERVICIOS:"
        systemctl is-active kidsfun_gunicorn && echo "✅ Gunicorn: ACTIVO" || echo "❌ Gunicorn: INACTIVO"
        systemctl is-active nginx && echo "✅ Nginx: ACTIVO" || echo "❌ Nginx: INACTIVO"
        echo ""
        
        echo "💾 RECURSOS DEL SISTEMA:"
        echo "CPU: $(top -bn1 | grep 'Cpu(s)' | awk '{print $2}' | cut -d'%' -f1)%"
        echo "Memoria: $(free | grep Mem | awk '{printf("%.2f", $3/$2 * 100.0)}')%"
        echo "Disco: $(df / | tail -1 | awk '{print $5}')"
        echo ""
        
        echo "🌐 ESTADO DEL SITIO WEB:"
        HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://kidsfunyfiestasinfantiles.com)
        echo "HTTP Status: $HTTP_STATUS"
        echo ""
        
        echo "📝 LOGS RECIENTES:"
        if [ -f "logs/gunicorn_error.log" ]; then
            echo "Últimos errores de Gunicorn:"
            tail -n 5 logs/gunicorn_error.log
        fi
        echo ""
        
        echo "=========================================="
        echo "Reporte generado automáticamente"
        echo "=========================================="
    } > "$REPORT_FILE"
    
    print_success "Reporte generado: $REPORT_FILE"
}

# Función para mostrar estadísticas de uso
show_statistics() {
    print_status "Mostrando estadísticas de uso..."
    
    # Estadísticas de archivos estáticos
    STATIC_SIZE=$(du -sh staticfiles/ 2>/dev/null | cut -f1 || echo "N/A")
    echo "Tamaño archivos estáticos: $STATIC_SIZE"
    
    # Estadísticas de media
    MEDIA_SIZE=$(du -sh media/ 2>/dev/null | cut -f1 || echo "N/A")
    echo "Tamaño archivos media: $MEDIA_SIZE"
    
    # Estadísticas de logs
    LOGS_SIZE=$(du -sh logs/ 2>/dev/null | cut -f1 || echo "N/A")
    echo "Tamaño logs: $LOGS_SIZE"
    
    # Número de backups
    BACKUP_COUNT=$(ls -1 backups/ 2>/dev/null | wc -l || echo "0")
    echo "Número de backups: $BACKUP_COUNT"
}

# Función principal
main() {
    echo "=========================================="
    echo "📊 MONITOREO DE KIDSFUN SYSTEM"
    echo "=========================================="
    echo "Fecha: $(date)"
    echo "Servidor: $(hostname)"
    echo "=========================================="
    
    # Verificar que estamos en el directorio correcto
    if [ ! -f "manage.py" ]; then
        print_error "No se encontró manage.py. Asegúrate de estar en el directorio del proyecto Django."
        exit 1
    fi
    
    # Ejecutar verificaciones
    check_services
    echo ""
    check_database
    echo ""
    check_django
    echo ""
    check_resources
    echo ""
    check_logs
    echo ""
    check_website
    echo ""
    show_statistics
    echo ""
    generate_report
    
    echo "=========================================="
    print_success "🎉 MONITOREO COMPLETADO"
    echo "=========================================="
}

# Ejecutar función principal
main "$@" 