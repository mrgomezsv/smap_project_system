#!/bin/bash

# Script para solucionar conflictos de Nginx
# Autor: Sistema de Corrección de Nginx
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

# Función para verificar configuraciones existentes
check_existing_configs() {
    print_status "Verificando configuraciones existentes de Nginx..."
    
    # Verificar configuraciones habilitadas
    if [ -d "/etc/nginx/sites-enabled" ]; then
        echo "Configuraciones habilitadas:"
        ls -la /etc/nginx/sites-enabled/
        echo ""
    fi
    
    # Verificar configuraciones disponibles
    if [ -d "/etc/nginx/sites-available" ]; then
        echo "Configuraciones disponibles:"
        ls -la /etc/nginx/sites-available/
        echo ""
    fi
    
    # Buscar configuraciones que usen el mismo dominio
    print_status "Buscando configuraciones que usen kidsfunyfiestasinfantiles.com..."
    grep -r "kidsfunyfiestasinfantiles.com" /etc/nginx/sites-available/ 2>/dev/null || echo "No se encontraron configuraciones existentes"
}

# Función para limpiar configuraciones conflictivas
clean_conflicting_configs() {
    print_status "Limpiando configuraciones conflictivas..."
    
    # Eliminar configuración por defecto si existe
    if [ -L "/etc/nginx/sites-enabled/default" ]; then
        print_warning "Eliminando configuración por defecto..."
        sudo rm /etc/nginx/sites-enabled/default
        print_success "Configuración por defecto eliminada"
    fi
    
    # Eliminar configuraciones duplicadas de kidsfun
    if [ -L "/etc/nginx/sites-enabled/kidsfun" ]; then
        print_warning "Eliminando configuración kidsfun existente..."
        sudo rm /etc/nginx/sites-enabled/kidsfun
        print_success "Configuración kidsfun existente eliminada"
    fi
    
    # Buscar y eliminar otras configuraciones que usen el mismo dominio
    for config in /etc/nginx/sites-enabled/*; do
        if [ -L "$config" ] && grep -q "kidsfunyfiestasinfantiles.com" "$(readlink -f "$config")" 2>/dev/null; then
            print_warning "Eliminando configuración conflictiva: $(basename "$config")"
            sudo rm "$config"
        fi
    done
}

# Función para crear configuración limpia
create_clean_config() {
    print_status "Creando configuración limpia de Nginx..."
    
    # Obtener información del servidor
    PROJECT_DIR=$(pwd)
    USER=$(whoami)
    
    # Crear configuración de Nginx
    cat > nginx_kidsfun_clean.conf << EOF
# Configuración de Nginx para Kidsfun System
# Generada automáticamente - $(date)

# Redirigir HTTP a HTTPS
server {
    listen 80;
    server_name kidsfunyfiestasinfantiles.com www.kidsfunyfiestasinfantiles.com;
    
    # Redirigir todo el tráfico HTTP a HTTPS
    return 301 https://\$server_name\$request_uri;
}

# Configuración HTTPS principal
server {
    listen 443 ssl http2;
    server_name kidsfunyfiestasinfantiles.com www.kidsfunyfiestasinfantiles.com;
    
    # Configuración SSL (ajustar rutas según tu certificado)
    ssl_certificate /etc/letsencrypt/live/kidsfunyfiestasinfantiles.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/kidsfunyfiestasinfantiles.com/privkey.pem;
    
    # Configuración SSL moderna
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Headers de seguridad
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    # Configuración de archivos estáticos
    location /static/ {
        alias $PROJECT_DIR/staticfiles/;
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }
    
    # Configuración de archivos media
    location /media/ {
        alias $PROJECT_DIR/media/;
        expires 1y;
        add_header Cache-Control "public";
        access_log off;
    }
    
    # Proxy a Gunicorn
    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_redirect off;
        
        # Configuración de timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # Configuración de buffers
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;
    }
    
    # Configuración para archivos grandes
    client_max_body_size 100M;
    
    # Configuración de logs
    access_log /var/log/nginx/kidsfun_access.log;
    error_log /var/log/nginx/kidsfun_error.log;
    
    # Configuración de gzip
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;
}
EOF
    
    print_success "Configuración limpia creada: nginx_kidsfun_clean.conf"
}

# Función para aplicar la configuración
apply_configuration() {
    print_status "Aplicando configuración limpia..."
    
    # Copiar configuración
    sudo cp nginx_kidsfun_clean.conf /etc/nginx/sites-available/kidsfun
    
    # Crear enlace simbólico
    sudo ln -sf /etc/nginx/sites-available/kidsfun /etc/nginx/sites-enabled/
    
    # Verificar sintaxis
    if sudo nginx -t; then
        print_success "Sintaxis de Nginx verificada correctamente"
    else
        print_error "Error en la sintaxis de Nginx"
        exit 1
    fi
    
    # Reiniciar Nginx
    sudo systemctl restart nginx
    print_success "Nginx reiniciado con nueva configuración"
}

# Función para verificar el estado
check_status() {
    print_status "Verificando estado de los servicios..."
    
    # Verificar Nginx
    if systemctl is-active --quiet nginx; then
        print_success "Nginx está ejecutándose"
    else
        print_error "Nginx NO está ejecutándose"
    fi
    
    # Verificar Gunicorn
    if systemctl is-active --quiet kidsfun_gunicorn; then
        print_success "Gunicorn está ejecutándose"
    else
        print_error "Gunicorn NO está ejecutándose"
    fi
    
    # Verificar respuesta del sitio
    print_status "Verificando respuesta del sitio web..."
    if curl -s -o /dev/null -w "%{http_code}" https://kidsfunyfiestasinfantiles.com | grep -q "200"; then
        print_success "Sitio web responde correctamente"
    else
        print_warning "Sitio web no responde correctamente"
    fi
}

# Función principal
main() {
    echo "=========================================="
    echo "🔧 CORRECCIÓN DE CONFLICTOS DE NGINX"
    echo "=========================================="
    echo "Fecha: $(date)"
    echo "=========================================="
    
    # Verificar que estamos en el directorio correcto
    if [ ! -f "manage.py" ]; then
        print_error "No se encontró manage.py. Asegúrate de estar en el directorio del proyecto Django."
        exit 1
    fi
    
    # Ejecutar correcciones
    check_existing_configs
    echo ""
    clean_conflicting_configs
    echo ""
    create_clean_config
    echo ""
    apply_configuration
    echo ""
    check_status
    
    echo "=========================================="
    print_success "🎉 CONFLICTOS DE NGINX SOLUCIONADOS"
    echo "=========================================="
    echo "El sitio web debería estar funcionando correctamente"
    echo "URL: https://kidsfunyfiestasinfantiles.com"
    echo "=========================================="
}

# Ejecutar función principal
main "$@" 