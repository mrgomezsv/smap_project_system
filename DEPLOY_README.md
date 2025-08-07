# 🚀 Script de Despliegue - KidsFun Django Project

## 📋 Descripción

Este script automatiza el proceso de despliegue del proyecto Django KidsFun en el servidor remoto. Realiza todas las tareas necesarias para actualizar el proyecto de forma segura sin interrumpir el servicio.

## 🎯 Características

- ✅ **Backup automático** antes de cada despliegue
- ✅ **Actualización de código** desde GitHub
- ✅ **Instalación de dependencias** automática
- ✅ **Migraciones de base de datos** seguras
- ✅ **Recolección de archivos estáticos**
- ✅ **Reinicio de servicios** sin interrupción
- ✅ **Verificación de salud** del sitio
- ✅ **Logs detallados** para debugging
- ✅ **Manejo de errores** robusto

## 🛠️ Requisitos

- SSH configurado para acceso al servidor
- Git instalado localmente
- Acceso root al servidor (82.165.210.146)
- Conexión a internet estable

## 📁 Estructura del Script

```
deploy.sh
├── Configuración
├── Funciones de utilidad
├── Funciones de despliegue
├── Funciones de verificación
└── Manejo de argumentos
```

## 🚀 Uso

### Despliegue Completo (Recomendado)
```bash
./deploy.sh deploy
# o simplemente
./deploy.sh
```

### Opciones Disponibles

| Comando | Descripción |
|---------|-------------|
| `deploy` | Despliegue completo (default) |
| `backup` | Crear solo backup |
| `update` | Solo actualizar código |
| `migrate` | Solo aplicar migraciones |
| `restart` | Solo reiniciar servicios |
| `status` | Verificar estado de servicios |
| `logs` | Mostrar logs |
| `health` | Verificar salud del sitio |
| `help` | Mostrar ayuda |

### Ejemplos de Uso

```bash
# Despliegue completo
./deploy.sh deploy

# Solo verificar estado
./deploy.sh status

# Solo ver logs
./deploy.sh logs

# Solo actualizar código
./deploy.sh update

# Solo aplicar migraciones
./deploy.sh migrate

# Verificar salud del sitio
./deploy.sh health

# Mostrar ayuda
./deploy.sh help
```

## 🔄 Proceso de Despliegue

### 1. Verificación de Dependencias
- ✅ SSH instalado
- ✅ Git instalado
- ✅ Conexión al servidor

### 2. Backup Automático
- 📦 Crea backup completo del proyecto
- 🗂️ Guarda en `backup/YYYYMMDD_HHMMSS/`

### 3. Actualización de Código
- 🔄 Hace `git fetch` y `git reset --hard origin/main`
- 🧹 Limpia archivos no rastreados
- 📥 Descarga últimos cambios de GitHub

### 4. Instalación de Dependencias
- 🐍 Activa entorno virtual
- 📦 Instala dependencias con `pip install -r requirements.txt`

### 5. Migraciones de Base de Datos
- 🗄️ Aplica migraciones con `python manage.py migrate`
- 🔒 Modo no-interactivo para automatización

### 6. Archivos Estáticos
- 📁 Recolecta archivos estáticos con `collectstatic`
- 🧹 Limpia archivos antiguos

### 7. Verificación de Configuración
- ✅ Ejecuta `python manage.py check --deploy`
- 🔍 Verifica configuración de producción

### 8. Reinicio de Servicios
- 🔄 Recarga configuración de Nginx
- 🚀 Reinicia servicio Django
- ⏱️ Espera 5 segundos para estabilización

### 9. Verificación de Salud
- 🌐 Verifica respuesta del sitio web
- 🔌 Verifica respuesta de APIs
- 📊 Muestra logs recientes

## 🛡️ Seguridad

### Backup Automático
- Se crea backup antes de cada despliegue
- Formato: `backup/YYYYMMDD_HHMMSS/`
- Preserva configuración anterior

### Manejo de Errores
- `set -e` - Sale en cualquier error
- Verificación de dependencias
- Rollback automático en caso de fallo

### Servicios
- Detiene servicio antes de actualizar
- Reinicia servicio después de actualizar
- Verifica estado antes y después

## 📊 Monitoreo

### Logs Disponibles
- 📝 Logs del servicio Django
- 🌐 Logs de Nginx
- 🔍 Logs de errores

### Verificación de Salud
- ✅ Sitio web responde (200, 301, 302)
- ✅ APIs responden correctamente
- ✅ Servicios activos

## 🔧 Configuración

### Variables del Script
```bash
SERVER_IP="82.165.210.146"
SERVER_USER="root"
PROJECT_PATH="/var/www/kidsfun_django"
PROJECT_NAME="kidsfun_django"
DOMAIN="kidsfunyfiestasinfantiles.com"
```

### Personalización
Puedes modificar estas variables en el script según tus necesidades:

1. **SERVER_IP**: IP del servidor
2. **SERVER_USER**: Usuario SSH
3. **PROJECT_PATH**: Ruta del proyecto en el servidor
4. **PROJECT_NAME**: Nombre del servicio systemd
5. **DOMAIN**: Dominio del sitio web

## 🚨 Troubleshooting

### Problemas Comunes

#### Error de Conexión SSH
```bash
# Verificar conexión SSH
ssh root@82.165.210.146 "echo 'Conexión exitosa'"
```

#### Error de Permisos
```bash
# Hacer script ejecutable
chmod +x deploy.sh
```

#### Error de Git
```bash
# Verificar estado del repositorio
ssh root@82.165.210.146 "cd /var/www/kidsfun_django && git status"
```

#### Error de Servicio
```bash
# Verificar estado del servicio
./deploy.sh status
```

### Logs de Debugging
```bash
# Ver logs del servicio
./deploy.sh logs

# Ver estado de servicios
./deploy.sh status

# Verificar salud del sitio
./deploy.sh health
```

## 📞 Soporte

### Información de Contacto
- **Autor**: Mario Roberto
- **Proyecto**: KidsFun Django Project
- **Servidor**: 82.165.210.146
- **Dominio**: kidsfunyfiestasinfantiles.com

### Comandos de Emergencia
```bash
# Reiniciar solo servicios (sin actualizar código)
./deploy.sh restart

# Solo verificar estado
./deploy.sh status

# Ver logs para debugging
./deploy.sh logs
```

## 🔄 Actualizaciones del Script

### Versión Actual
- **v1.0**: Script inicial con funcionalidad completa
- **Fecha**: $(date +%Y-%m-%d)
- **Compatibilidad**: Bash 4.0+

### Próximas Mejoras
- [ ] Notificaciones por email
- [ ] Rollback automático
- [ ] Despliegue en múltiples servidores
- [ ] Integración con CI/CD
- [ ] Dashboard web para monitoreo

---

**¡Happy Deploying! 🚀** 