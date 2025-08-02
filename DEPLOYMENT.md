# 🚀 Guía de Despliegue - Kidsfun System

Esta guía te ayudará a desplegar el proyecto Kidsfun System en un servidor de producción.

## 📋 Requisitos Previos

### Servidor
- **Sistema Operativo**: Ubuntu 20.04+ / CentOS 8+ / Debian 11+
- **RAM**: Mínimo 2GB (recomendado 4GB+)
- **Almacenamiento**: Mínimo 20GB de espacio libre
- **CPU**: Mínimo 2 cores

### Software Requerido
- Python 3.8+
- PostgreSQL (puede ser remoto)
- Nginx
- Git

## 🔧 Configuración Inicial del Servidor

### 1. Actualizar el Sistema
```bash
sudo apt update && sudo apt upgrade -y
```

### 2. Instalar Dependencias del Sistema
```bash
sudo apt install -y python3 python3-pip python3-venv nginx postgresql-client curl
```

### 3. Configurar Firewall
```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable
```

## 📦 Despliegue Automatizado

### Opción 1: Despliegue Completo (Recomendado)

1. **Clonar el repositorio**:
```bash
git clone <tu-repositorio>
cd smap_project_system
```

2. **Ejecutar script de configuración**:
```bash
chmod +x setup_production.sh
./setup_production.sh
```

3. **Ejecutar script de despliegue**:
```bash
chmod +x deploy.sh
./deploy.sh
```

### Opción 2: Despliegue Manual

#### Paso 1: Configurar Variables de Entorno
```bash
cp env.example .env
nano .env
```

Configurar las siguientes variables:
```env
# Configuración de Django
DJANGO_SECRET_KEY=tu-clave-secreta-aqui
DEBUG=False

# Configuración de Base de Datos
DB_NAME=smap_kf
DB_USER=mrgomez
DB_PASSWORD=Karin2100
DB_HOST=82.165.210.146
DB_PORT=5432

# Configuración de Email
EMAIL_HOST_USER=kidsfun.developer@gmail.com
EMAIL_HOST_PASSWORD=Karin2100
DEFAULT_FROM_EMAIL=kidsfun.developer@gmail.com
```

#### Paso 2: Crear Entorno Virtual
```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

#### Paso 3: Configurar Base de Datos
```bash
python manage.py makemigrations
python manage.py migrate
```

#### Paso 4: Recolectar Archivos Estáticos
```bash
python manage.py collectstatic --noinput
```

#### Paso 5: Configurar Gunicorn
```bash
pip install gunicorn
```

Crear archivo `gunicorn.conf.py`:
```python
bind = "127.0.0.1:8000"
workers = 3
worker_class = "sync"
timeout = 30
```

#### Paso 6: Configurar Nginx
Crear archivo `/etc/nginx/sites-available/kidsfun`:
```nginx
server {
    listen 80;
    server_name kidsfunyfiestasinfantiles.com www.kidsfunyfiestasinfantiles.com;
    
    location /static/ {
        alias /ruta/a/tu/proyecto/staticfiles/;
    }
    
    location /media/ {
        alias /ruta/a/tu/proyecto/media/;
    }
    
    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Habilitar el sitio:
```bash
sudo ln -s /etc/nginx/sites-available/kidsfun /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### Paso 7: Configurar SSL con Let's Encrypt
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d kidsfunyfiestasinfantiles.com -d www.kidsfunyfiestasinfantiles.com
```

#### Paso 8: Crear Servicio de Systemd
Crear archivo `/etc/systemd/system/kidsfun_gunicorn.service`:
```ini
[Unit]
Description=Kidsfun Gunicorn daemon
After=network.target

[Service]
User=tu-usuario
Group=tu-usuario
WorkingDirectory=/ruta/a/tu/proyecto
Environment="PATH=/ruta/a/tu/proyecto/venv/bin"
ExecStart=/ruta/a/tu/proyecto/venv/bin/gunicorn --config gunicorn.conf.py smap_project.wsgi:application
ExecReload=/bin/kill -s HUP $MAINPID
KillMode=mixed
TimeoutStopSec=5
PrivateTmp=true
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Habilitar y iniciar el servicio:
```bash
sudo systemctl daemon-reload
sudo systemctl enable kidsfun_gunicorn
sudo systemctl start kidsfun_gunicorn
```

## 🔍 Monitoreo y Mantenimiento

### Script de Monitoreo
```bash
chmod +x monitor.sh
./monitor.sh
```

### Verificar Estado de Servicios
```bash
sudo systemctl status kidsfun_gunicorn
sudo systemctl status nginx
```

### Verificar Logs
```bash
# Logs de Gunicorn
tail -f logs/gunicorn_error.log

# Logs de Nginx
sudo tail -f /var/log/nginx/kidsfun_error.log
```

## 🔄 Actualizaciones

### Actualización Automática
```bash
./deploy.sh
```

### Actualización Manual
```bash
# 1. Hacer backup
./deploy.sh  # Esto incluye backup automático

# 2. Actualizar código
git pull origin main

# 3. Actualizar dependencias
source venv/bin/activate
pip install -r requirements.txt

# 4. Ejecutar migraciones
python manage.py makemigrations
python manage.py migrate

# 5. Recolectar archivos estáticos
python manage.py collectstatic --noinput

# 6. Reiniciar servicios
sudo systemctl restart kidsfun_gunicorn
sudo systemctl restart nginx
```

## 🛠️ Solución de Problemas

### Problema: Error 502 Bad Gateway
```bash
# Verificar que Gunicorn esté ejecutándose
sudo systemctl status kidsfun_gunicorn

# Verificar logs
tail -f logs/gunicorn_error.log

# Reiniciar servicio
sudo systemctl restart kidsfun_gunicorn
```

### Problema: Error de Base de Datos
```bash
# Verificar conectividad
pg_isready -h 82.165.210.146 -p 5432 -U mrgomez

# Verificar configuración de Django
python manage.py check --database default
```

### Problema: Archivos Estáticos No Cargados
```bash
# Verificar que los archivos estén recolectados
ls -la staticfiles/

# Recolectar archivos estáticos
python manage.py collectstatic --noinput

# Verificar permisos
chmod 755 staticfiles/
```

## 📊 Backup y Restauración

### Backup Automático
El script `deploy.sh` crea backups automáticamente en la carpeta `backups/`.

### Backup Manual
```bash
# Backup de base de datos
pg_dump -h 82.165.210.146 -p 5432 -U mrgomez -d smap_kf > backup_$(date +%Y%m%d_%H%M%S).sql

# Backup de archivos
tar -czf backup_files_$(date +%Y%m%d_%H%M%S).tar.gz media/ staticfiles/
```

### Restauración
```bash
# Restaurar base de datos
psql -h 82.165.210.146 -p 5432 -U mrgomez -d smap_kf < backup_archivo.sql

# Restaurar archivos
tar -xzf backup_files_archivo.tar.gz
```

## 🔒 Seguridad

### Configuraciones Recomendadas
1. **Cambiar la clave secreta de Django** en producción
2. **Configurar firewall** correctamente
3. **Usar HTTPS** siempre
4. **Mantener actualizado** el sistema
5. **Revisar logs** regularmente

### Variables de Entorno Sensibles
Nunca commits archivos `.env` al repositorio. Asegúrate de que esté en `.gitignore`.

## 📞 Soporte

Si encuentras problemas durante el despliegue:

1. Revisa los logs de error
2. Ejecuta el script de monitoreo: `./monitor.sh`
3. Verifica la conectividad de red
4. Revisa los permisos de archivos

## 🎯 Checklist de Despliegue

- [ ] Servidor configurado con requisitos mínimos
- [ ] Variables de entorno configuradas
- [ ] Base de datos conectada y migraciones ejecutadas
- [ ] Archivos estáticos recolectados
- [ ] Gunicorn configurado y ejecutándose
- [ ] Nginx configurado y ejecutándose
- [ ] SSL configurado
- [ ] Firewall configurado
- [ ] Servicios configurados para inicio automático
- [ ] Monitoreo configurado
- [ ] Backup configurado
- [ ] Sitio web accesible y funcionando

¡Tu aplicación está lista para producción! 🚀 