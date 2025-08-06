#!/bin/bash

# 🛠️ Script de Configuración del Servidor - KidsFun Django Project
# Este script configura el servidor para el despliegue de la aplicación

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
PROJECT_DIR="/var/www/$PROJECT_NAME"

# Función para actualizar el sistema
update_system() {
    print_status "Actualizando el sistema..."
    sudo apt update && sudo apt upgrade -y
    print_success "Sistema actualizado"
}

# Función para instalar dependencias del sistema
install_system_dependencies() {
    print_status "Instalando dependencias del sistema..."
    
    # Dependencias básicas
    sudo apt install -y python3 python3-pip python3-venv nginx postgresql postgresql-contrib
    
    # Dependencias para SSL
    sudo apt install -y certbot python3-certbot-nginx
    
    # Dependencias adicionales
    sudo apt install -y git curl wget unzip
    
    print_success "Dependencias del sistema instaladas"
}

# Función para configurar PostgreSQL
setup_postgresql() {
    print_status "Configurando PostgreSQL..."
    
    # Crear usuario y base de datos
    sudo -u postgres psql << EOF
CREATE USER mrgomez WITH PASSWORD 'Karin2100';
CREATE DATABASE smap_kf OWNER mrgomez;
GRANT ALL PRIVILEGES ON DATABASE smap_kf TO mrgomez;
\q
EOF
    
    print_success "PostgreSQL configurado"
}

# Función para configurar Nginx
setup_nginx() {
    print_status "Configurando Nginx..."
    
    # Crear directorio del proyecto
    sudo mkdir -p $PROJECT_DIR
    sudo chown -R $USER:$USER $PROJECT_DIR
    
    # Configuración básica de Nginx
    sudo tee /etc/nginx/sites-available/$DOMAIN > /dev/null <<EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    
    location / {
        return 301 https://\$server_name\$request_uri;
    }
}
EOF
    
    # Habilitar el sitio
    sudo ln -sf /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/
    
    # Remover configuración por defecto
    sudo rm -f /etc/nginx/sites-enabled/default
    
    # Verificar configuración
    if sudo nginx -t; then
        sudo systemctl reload nginx
        print_success "Nginx configurado"
    else
        print_error "Error en la configuración de Nginx"
        exit 1
    fi
}

# Función para configurar SSL
setup_ssl() {
    print_status "Configurando SSL con Certbot..."
    
    # Obtener certificado SSL
    sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN
    
    print_success "SSL configurado"
}

# Función para configurar firewall
setup_firewall() {
    print_status "Configurando firewall..."
    
    # Permitir SSH, HTTP, HTTPS
    sudo ufw allow ssh
    sudo ufw allow 80
    sudo ufw allow 443
    
    # Habilitar firewall
    sudo ufw --force enable
    
    print_success "Firewall configurado"
}

# Función para configurar el proyecto
setup_project() {
    print_status "Configurando el proyecto..."
    
    # Clonar el repositorio (si no existe)
    if [ ! -d "$PROJECT_DIR" ]; then
        cd /var/www
        sudo git clone https://github.com/tu-usuario/$PROJECT_NAME.git
        sudo chown -R $USER:$USER $PROJECT_NAME
    fi
    
    cd $PROJECT_DIR
    
    # Crear entorno virtual
    python3 -m venv venv
    source venv/bin/activate
    
    # Instalar dependencias
    pip install --upgrade pip
    pip install -r requirements.txt
    pip install gunicorn
    
    # Crear directorios necesarios
    mkdir -p logs media staticfiles backups
    
    # Configurar permisos
    sudo chown -R www-data:www-data $PROJECT_DIR
    sudo chmod -R 755 $PROJECT_DIR
    
    print_success "Proyecto configurado"
}

# Función para configurar servicios
setup_services() {
    print_status "Configurando servicios..."
    
    # Copiar archivo de servicio
    sudo cp kidsfun_django.service /etc/systemd/system/
    
    # Recargar systemd
    sudo systemctl daemon-reload
    
    # Habilitar y iniciar servicio
    sudo systemctl enable kidsfun_django
    sudo systemctl start kidsfun_django
    
    print_success "Servicios configurados"
}

# Función para configurar backups automáticos
setup_backups() {
    print_status "Configurando backups automáticos..."
    
    # Crear script de backup
    sudo tee /usr/local/bin/backup_kidsfun.sh > /dev/null <<'EOF'
#!/bin/bash
BACKUP_DIR="/var/backups/kidsfun"
DATE=$(date +%Y%m%d_%H%M%S)
DB_BACKUP="$BACKUP_DIR/db_backup_$DATE.sql"
FILES_BACKUP="$BACKUP_DIR/files_backup_$DATE.tar.gz"

mkdir -p $BACKUP_DIR

# Backup de base de datos
pg_dump -h localhost -U mrgomez -d smap_kf > $DB_BACKUP

# Backup de archivos
tar -czf $FILES_BACKUP -C /var/www/kidsfun_django media staticfiles

# Mantener solo los últimos 7 backups
find $BACKUP_DIR -name "db_backup_*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "files_backup_*.tar.gz" -mtime +7 -delete
EOF
    
    sudo chmod +x /usr/local/bin/backup_kidsfun.sh
    
    # Configurar cron job para backups diarios
    echo "0 2 * * * /usr/local/bin/backup_kidsfun.sh" | sudo crontab -
    
    print_success "Backups automáticos configurados"
}

# Función principal
main() {
    print_status "🛠️ Iniciando configuración del servidor..."
    print_status "Dominio: $DOMAIN"
    print_status "Directorio del proyecto: $PROJECT_DIR"
    echo
    
    # Verificar que estamos ejecutando como root o con sudo
    if [ "$EUID" -ne 0 ]; then
        print_error "Este script debe ejecutarse con privilegios de administrador"
        print_status "Ejecuta: sudo $0"
        exit 1
    fi
    
    # Ejecutar pasos de configuración
    update_system
    install_system_dependencies
    setup_postgresql
    setup_nginx
    setup_ssl
    setup_firewall
    setup_project
    setup_services
    setup_backups
    
    echo
    print_success "🎉 ¡Configuración del servidor completada!"
    print_status "La aplicación está configurada en: https://$DOMAIN"
    print_status "Panel de administración: https://$DOMAIN/admin/"
    print_status "Logs de Gunicorn: $PROJECT_DIR/logs/"
    print_status "Backups automáticos: /var/backups/kidsfun/"
}

# Ejecutar función principal
main "$@" 