#!/bin/bash

# Script de configuración para servidor de producción
# Autor: Sistema de Configuración Automatizada
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

# Función para instalar dependencias del sistema
install_system_dependencies() {
    print_status "Instalando dependencias del sistema..."
    
    # Detectar el sistema operativo
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Para sistemas basados en Debian/Ubuntu
        if command -v apt-get &> /dev/null; then
            sudo apt-get update
            sudo apt-get install -y python3 python3-pip python3-venv nginx postgresql-client
            print_success "Dependencias del sistema instaladas (Ubuntu/Debian)"
        # Para sistemas basados en Red Hat/CentOS
        elif command -v yum &> /dev/null; then
            sudo yum update -y
            sudo yum install -y python3 python3-pip nginx postgresql
            print_success "Dependencias del sistema instaladas (CentOS/RHEL)"
        fi
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        # Para macOS
        if command -v brew &> /dev/null; then
            brew install python3 nginx postgresql
            print_success "Dependencias del sistema instaladas (macOS)"
        else
            print_warning "Homebrew no encontrado. Instala manualmente las dependencias."
        fi
    fi
}

# Función para instalar Gunicorn
install_gunicorn() {
    print_status "Instalando Gunicorn..."
    
    # Activar entorno virtual
    source venv/bin/activate
    
    # Instalar Gunicorn
    pip install gunicorn
    
    print_success "Gunicorn instalado correctamente"
}

# Función para crear archivo de configuración de Gunicorn
create_gunicorn_config() {
    print_status "Creando configuración de Gunicorn..."
    
    # Crear directorio para logs si no existe
    mkdir -p logs
    
    # Crear archivo de configuración de Gunicorn
    cat > gunicorn.conf.py << EOF
# Configuración de Gunicorn para Kidsfun System
import multiprocessing

# Configuración del servidor
bind = "127.0.0.1:8000"
workers = multiprocessing.cpu_count() * 2 + 1
worker_class = "sync"
worker_connections = 1000
max_requests = 1000
max_requests_jitter = 50
timeout = 30
keepalive = 2

# Configuración de logs
accesslog = "logs/gunicorn_access.log"
errorlog = "logs/gunicorn_error.log"
loglevel = "info"
access_log_format = '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s"'

# Configuración de seguridad
limit_request_line = 4094
limit_request_fields = 100
limit_request_field_size = 8190

# Configuración de procesos
preload_app = True
daemon = False
pidfile = "logs/gunicorn.pid"
user = None
group = None
tmp_upload_dir = None

# Configuración de SSL (si es necesario)
# keyfile = "/path/to/keyfile"
# certfile = "/path/to/certfile"
EOF
    
    print_success "Configuración de Gunicorn creada"
}

# Función para crear archivo de configuración de Nginx
create_nginx_config() {
    print_status "Creando configuración de Nginx..."
    
    # Crear configuración de Nginx
    cat > nginx_kidsfun.conf << EOF
server {
    listen 80;
    server_name kidsfunyfiestasinfantiles.com www.kidsfunyfiestasinfantiles.com;
    
    # Redirigir HTTP a HTTPS
    return 301 https://\$server_name\$request_uri;
}

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
        alias /var/www/kidsfun/staticfiles/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Configuración de archivos media
    location /media/ {
        alias /var/www/kidsfun/media/;
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
        
        # Configuración de timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Configuración para archivos grandes
    client_max_body_size 100M;
    
    # Configuración de logs
    access_log /var/log/nginx/kidsfun_access.log;
    error_log /var/log/nginx/kidsfun_error.log;
}
EOF
    
    print_success "Configuración de Nginx creada"
}

# Función para crear servicio de systemd para Gunicorn
create_systemd_service() {
    print_status "Creando servicio de systemd para Gunicorn..."
    
    # Obtener el directorio actual
    PROJECT_DIR=$(pwd)
    USER=$(whoami)
    
    # Crear archivo de servicio
    cat > kidsfun_gunicorn.service << EOF
[Unit]
Description=Kidsfun Gunicorn daemon
After=network.target

[Service]
User=$USER
Group=$USER
WorkingDirectory=$PROJECT_DIR
Environment="PATH=$PROJECT_DIR/venv/bin"
ExecStart=$PROJECT_DIR/venv/bin/gunicorn --config gunicorn.conf.py smap_project.wsgi:application
ExecReload=/bin/kill -s HUP \$MAINPID
KillMode=mixed
TimeoutStopSec=5
PrivateTmp=true
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF
    
    print_success "Servicio de systemd creado"
}

# Función para configurar firewall
setup_firewall() {
    print_status "Configurando firewall..."
    
    # Para sistemas con ufw (Ubuntu)
    if command -v ufw &> /dev/null; then
        sudo ufw allow 22/tcp
        sudo ufw allow 80/tcp
        sudo ufw allow 443/tcp
        sudo ufw --force enable
        print_success "Firewall configurado (UFW)"
    # Para sistemas con firewalld (CentOS/RHEL)
    elif command -v firewall-cmd &> /dev/null; then
        sudo firewall-cmd --permanent --add-service=ssh
        sudo firewall-cmd --permanent --add-service=http
        sudo firewall-cmd --permanent --add-service=https
        sudo firewall-cmd --reload
        print_success "Firewall configurado (firewalld)"
    else
        print_warning "No se encontró un firewall configurable"
    fi
}

# Función para configurar SSL con Let's Encrypt
setup_ssl() {
    print_status "Configurando SSL con Let's Encrypt..."
    
    # Verificar si certbot está instalado
    if ! command -v certbot &> /dev/null; then
        print_status "Instalando Certbot..."
        if command -v apt-get &> /dev/null; then
            sudo apt-get install -y certbot python3-certbot-nginx
        elif command -v yum &> /dev/null; then
            sudo yum install -y certbot python3-certbot-nginx
        fi
    fi
    
    # Obtener certificado SSL
    if command -v certbot &> /dev/null; then
        print_status "Obteniendo certificado SSL..."
        sudo certbot --nginx -d kidsfunyfiestasinfantiles.com -d www.kidsfunyfiestasinfantiles.com --non-interactive --agree-tos --email kidsfun.developer@gmail.com
        print_success "Certificado SSL configurado"
    else
        print_warning "Certbot no disponible. Configura SSL manualmente."
    fi
}

# Función para crear script de inicio automático
create_startup_script() {
    print_status "Creando script de inicio automático..."
    
    cat > start_production.sh << 'EOF'
#!/bin/bash

# Script de inicio para producción
echo "🚀 Iniciando Kidsfun System en producción..."

# Activar entorno virtual
source venv/bin/activate

# Verificar que la base de datos esté disponible
python manage.py check --database default

# Iniciar Gunicorn
gunicorn --config gunicorn.conf.py smap_project.wsgi:application

echo "✅ Servidor iniciado correctamente"
EOF
    
    chmod +x start_production.sh
    print_success "Script de inicio creado"
}

# Función principal
main() {
    echo "=========================================="
    echo "🔧 CONFIGURACIÓN DE PRODUCCIÓN"
    echo "=========================================="
    echo "Fecha: $(date)"
    echo "Directorio: $(pwd)"
    echo "=========================================="
    
    # Verificar que estamos en el directorio correcto
    if [ ! -f "manage.py" ]; then
        print_error "No se encontró manage.py. Asegúrate de estar en el directorio del proyecto Django."
        exit 1
    fi
    
    # Ejecutar configuración
    install_system_dependencies
    install_gunicorn
    create_gunicorn_config
    create_nginx_config
    create_systemd_service
    setup_firewall
    setup_ssl
    create_startup_script
    
    echo "=========================================="
    print_success "🎉 CONFIGURACIÓN DE PRODUCCIÓN COMPLETADA"
    echo "=========================================="
    echo "Próximos pasos:"
    echo "1. Copia nginx_kidsfun.conf a /etc/nginx/sites-available/"
    echo "2. Crea enlace simbólico: sudo ln -s /etc/nginx/sites-available/kidsfun /etc/nginx/sites-enabled/"
    echo "3. Copia kidsfun_gunicorn.service a /etc/systemd/system/"
    echo "4. Ejecuta: sudo systemctl daemon-reload"
    echo "5. Ejecuta: sudo systemctl enable kidsfun_gunicorn"
    echo "6. Ejecuta: sudo systemctl start kidsfun_gunicorn"
    echo "7. Ejecuta: sudo systemctl restart nginx"
    echo "=========================================="
}

# Ejecutar función principal
main "$@" 