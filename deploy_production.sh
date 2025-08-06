#!/bin/bash

# 🚀 Script de Despliegue para Producción - KidsFun Django Project
# Este script despliega la aplicación en el servidor de producción

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
NGINX_CONF="/etc/nginx/sites-available/$DOMAIN"
NGINX_ENABLED="/etc/nginx/sites-enabled/$DOMAIN"
SSL_CERT="/etc/letsencrypt/live/$DOMAIN/fullchain.pem"
SSL_KEY="/etc/letsencrypt/live/$DOMAIN/privkey.pem"

# Función para crear backup de la base de datos
backup_database() {
    print_status "Creando backup de la base de datos..."
    
    mkdir -p backups
    BACKUP_FILE="backups/backup_$(date +%Y%m%d_%H%M%S).sql"
    
    if pg_dump -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME > "$BACKUP_FILE" 2>/dev/null; then
        print_success "Backup creado exitosamente: $BACKUP_FILE"
    else
        print_warning "No se pudo crear backup de la base de datos. Continuando..."
    fi
}

# Función para actualizar el repositorio
update_repository() {
    print_status "Actualizando repositorio desde Git..."
    
    git fetch origin
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
    
    if [ ! -d "venv" ]; then
        print_status "Creando entorno virtual..."
        python3 -m venv venv
    fi
    
    source venv/bin/activate
    pip install --upgrade pip
    pip install -r requirements.txt
    print_success "Dependencias instaladas"
}

# Función para ejecutar migraciones
run_migrations() {
    print_status "Ejecutando migraciones de la base de datos..."
    
    source venv/bin/activate
    python manage.py migrate --settings=smap_project.production_settings
    print_success "Migraciones completadas"
}

# Función para recolectar archivos estáticos
collect_static() {
    print_status "Recolectando archivos estáticos..."
    
    source venv/bin/activate
    python manage.py collectstatic --noinput --settings=smap_project.production_settings
    print_success "Archivos estáticos recolectados"
}

# Función para configurar Nginx
setup_nginx() {
    print_status "Configurando Nginx..."
    
    # Crear configuración de Nginx
    sudo tee $NGINX_CONF > /dev/null <<EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name $DOMAIN www.$DOMAIN;
    
    ssl_certificate $SSL_CERT;
    ssl_certificate_key $SSL_KEY;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Configuración de seguridad
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    # Archivos estáticos
    location /static/ {
        alias /var/www/$PROJECT_NAME/staticfiles/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Archivos media
    location /media/ {
        alias /var/www/$PROJECT_NAME/media/;
        expires 1y;
        add_header Cache-Control "public";
    }
    
    # Proxy a Gunicorn
    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_redirect off;
    }
}
EOF
    
    # Habilitar el sitio
    sudo ln -sf $NGINX_CONF $NGINX_ENABLED
    
    # Verificar configuración
    if sudo nginx -t; then
        sudo systemctl reload nginx
        print_success "Nginx configurado y recargado"
    else
        print_error "Error en la configuración de Nginx"
        exit 1
    fi
}

# Función para configurar SSL con Certbot
setup_ssl() {
    print_status "Configurando SSL con Certbot..."
    
    if [ ! -f "$SSL_CERT" ]; then
        sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN
        print_success "SSL configurado exitosamente"
    else
        print_status "SSL ya está configurado. Renovando..."
        sudo certbot renew --quiet
        print_success "SSL renovado"
    fi
}

# Función para reiniciar servicios
restart_services() {
    print_status "Reiniciando servicios..."
    
    # Reiniciar Gunicorn
    sudo systemctl restart $PROJECT_NAME
    print_success "Gunicorn reiniciado"
    
    # Recargar Nginx
    sudo systemctl reload nginx
    print_success "Nginx recargado"
}

# Función principal
main() {
    print_status "🚀 Iniciando despliegue de $PROJECT_NAME..."
    print_status "Dominio: $DOMAIN"
    print_status "Fecha: $(date)"
    echo
    
    # Verificar que estamos en el directorio correcto
    if [ ! -f "manage.py" ]; then
        print_error "No se encontró manage.py. Asegúrate de estar en el directorio del proyecto."
        exit 1
    fi
    
    # Ejecutar pasos de despliegue
    backup_database
    update_repository
    install_dependencies
    run_migrations
    collect_static
    setup_nginx
    setup_ssl
    restart_services
    
    echo
    print_success "🎉 ¡Despliegue completado exitosamente!"
    print_status "La aplicación está disponible en: https://$DOMAIN"
    print_status "Panel de administración: https://$DOMAIN/admin/"
}

# Ejecutar función principal
main "$@" 