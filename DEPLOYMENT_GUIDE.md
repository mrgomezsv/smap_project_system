# 🚀 Guía de Despliegue - KidsFun Django Project

## 📋 Resumen del Proyecto

Este es un proyecto Django que incluye tanto frontend como backend para el sistema de KidsFun. El proyecto está optimizado para producción y incluye todas las configuraciones necesarias para un despliegue seguro.

## 🏗️ Arquitectura del Proyecto

### Aplicaciones Django
- **kidsfun_web**: Aplicación principal del frontend
- **t_app_product**: Gestión de productos y eventos
- **api**: API REST para productos
- **api_commentary**: Sistema de comentarios
- **api_like**: Sistema de likes
- **api_waiver**: Sistema de waivers
- **api_waiver_validator**: Validación de waivers
- **waiver_v2**: Nueva versión del sistema de waivers

### Tecnologías Utilizadas
- **Backend**: Django 4.2.11
- **Base de Datos**: PostgreSQL
- **Servidor Web**: Nginx + Gunicorn
- **SSL**: Let's Encrypt (Certbot)
- **Cache**: Redis (opcional)
- **Email**: Gmail SMTP

## 🛠️ Configuración del Servidor

### 1. Preparación del Servidor

```bash
# Conectarse al servidor
ssh usuario@tu-servidor.com

# Ejecutar el script de configuración
sudo ./setup_server.sh
```

### 2. Configuración Manual (si es necesario)

#### Instalar Dependencias del Sistema
```bash
sudo apt update
sudo apt install -y python3 python3-pip python3-venv nginx postgresql postgresql-contrib
sudo apt install -y certbot python3-certbot-nginx git curl wget unzip
```

#### Configurar PostgreSQL
```bash
sudo -u postgres psql
CREATE USER mrgomez WITH PASSWORD 'Karin2100';
CREATE DATABASE smap_kf OWNER mrgomez;
GRANT ALL PRIVILEGES ON DATABASE smap_kf TO mrgomez;
\q
```

#### Configurar Nginx
```bash
# Crear configuración de Nginx
sudo nano /etc/nginx/sites-available/kidsfunyfiestasinfantiles.com

# Habilitar el sitio
sudo ln -s /etc/nginx/sites-available/kidsfunyfiestasinfantiles.com /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

#### Configurar SSL
```bash
sudo certbot --nginx -d kidsfunyfiestasinfantiles.com -d www.kidsfunyfiestasinfantiles.com
```

## 🚀 Despliegue del Proyecto

### 1. Clonar el Repositorio

```bash
cd /var/www
sudo git clone https://github.com/tu-usuario/kidsfun_django.git
sudo chown -R $USER:$USER kidsfun_django
cd kidsfun_django
```

### 2. Configurar Variables de Entorno

```bash
# Copiar archivo de ejemplo
cp env.example .env

# Editar variables de entorno
nano .env
```

Variables necesarias en `.env`:
```env
DEBUG=False
DJANGO_SECRET_KEY=tu-clave-secreta-aqui
DB_NAME=smap_kf
DB_USER=mrgomez
DB_PASSWORD=Karin2100
DB_HOST=localhost
DB_PORT=5432
EMAIL_HOST_USER=tu-email@gmail.com
EMAIL_HOST_PASSWORD=tu-contraseña-de-aplicación
DEFAULT_FROM_EMAIL=tu-email@gmail.com
```

### 3. Configurar Entorno Virtual

```bash
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
pip install gunicorn
```

### 4. Configurar Base de Datos

```bash
# Ejecutar migraciones
python manage.py migrate --settings=smap_project.production_settings

# Crear superusuario
python manage.py createsuperuser --settings=smap_project.production_settings

# Recolectar archivos estáticos
python manage.py collectstatic --noinput --settings=smap_project.production_settings
```

### 5. Configurar Servicios

```bash
# Copiar archivo de servicio
sudo cp kidsfun_django.service /etc/systemd/system/

# Recargar systemd
sudo systemctl daemon-reload

# Habilitar y iniciar servicio
sudo systemctl enable kidsfun_django
sudo systemctl start kidsfun_django
```

### 6. Verificar Despliegue

```bash
# Verificar estado del servicio
sudo systemctl status kidsfun_django

# Verificar logs
sudo journalctl -u kidsfun_django -f

# Verificar Nginx
sudo nginx -t
sudo systemctl status nginx
```

## 🔄 Actualizaciones

### Despliegue Automático

```bash
# Ejecutar script de despliegue
./deploy_production.sh
```

### Despliegue Manual

```bash
# Actualizar código
git pull origin main

# Instalar dependencias
source venv/bin/activate
pip install -r requirements.txt

# Ejecutar migraciones
python manage.py migrate --settings=smap_project.production_settings

# Recolectar archivos estáticos
python manage.py collectstatic --noinput --settings=smap_project.production_settings

# Reiniciar servicios
sudo systemctl restart kidsfun_django
sudo systemctl reload nginx
```

## 📊 Monitoreo y Mantenimiento

### Logs

- **Django**: `/var/www/kidsfun_django/logs/django.log`
- **Gunicorn**: `/var/www/kidsfun_django/logs/gunicorn_*.log`
- **Nginx**: `/var/log/nginx/access.log`, `/var/log/nginx/error.log`

### Backups

Los backups automáticos se ejecutan diariamente a las 2:00 AM y se almacenan en `/var/backups/kidsfun/`.

### Comandos Útiles

```bash
# Ver logs en tiempo real
sudo journalctl -u kidsfun_django -f

# Reiniciar servicios
sudo systemctl restart kidsfun_django
sudo systemctl reload nginx

# Verificar estado de servicios
sudo systemctl status kidsfun_django nginx postgresql

# Backup manual
/usr/local/bin/backup_kidsfun.sh
```

## 🔒 Seguridad

### Configuraciones de Seguridad Implementadas

- SSL/TLS con Let's Encrypt
- Headers de seguridad en Nginx
- Configuración de cookies seguras
- Firewall configurado
- Backups automáticos
- Logs de auditoría

### Mantenimiento de Seguridad

```bash
# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Renovar certificados SSL
sudo certbot renew

# Verificar logs de seguridad
sudo tail -f /var/log/auth.log
```

## 🆘 Solución de Problemas

### Problemas Comunes

1. **Error 502 Bad Gateway**
   - Verificar que Gunicorn esté ejecutándose: `sudo systemctl status kidsfun_django`
   - Revisar logs: `sudo journalctl -u kidsfun_django -f`

2. **Error de Base de Datos**
   - Verificar conexión: `sudo systemctl status postgresql`
   - Verificar credenciales en `.env`

3. **Error de SSL**
   - Renovar certificado: `sudo certbot renew`
   - Verificar configuración: `sudo nginx -t`

4. **Error de Archivos Estáticos**
   - Recolectar archivos: `python manage.py collectstatic --noinput`
   - Verificar permisos: `sudo chown -R www-data:www-data /var/www/kidsfun_django`

### Contacto de Soporte

Para problemas técnicos, contactar al equipo de desarrollo.

## 📝 Notas Adicionales

- El proyecto está configurado para el dominio `kidsfunyfiestasinfantiles.com`
- Todos los archivos de configuración están optimizados para producción
- Se incluyen scripts automatizados para facilitar el mantenimiento
- El sistema está preparado para escalabilidad futura 