# KidsFun - Instrucciones de Ejecución Local

## 🚀 Configuración Rápida

### Ejecutar el Proyecto
Para ejecutar el proyecto (configurado para desarrollo local):

```bash
./run_local.sh
```

**Características:**
- ✅ Conectado a la base de datos remota
- ✅ Funcionalidades web completas
- ⚠️ Likes y comentarios muestran valores por defecto (APIs eliminadas)
- ✅ Gestión de productos funcional
- ✅ Sistema de waivers disponible
- ✅ Todas las páginas web funcionando

## 📋 URLs Disponibles

### Páginas Principales
- **🏠 Página principal:** http://localhost:8000
- **⚙️ Admin de Django:** http://localhost:8000/admin/
- **🎉 Servicios:** http://localhost:8000/service/
- **📦 Productos:** http://localhost:8000/product/
- **📞 Contacto:** http://localhost:8000/contact/
- **📱 App móvil:** http://localhost:8000/kidsfun/mobile-app/

### Páginas de Administración (requieren login)
- **👤 Login:** http://localhost:8000/signin/
- **📝 Registro:** http://localhost:8000/signup/
- **🎪 Eventos:** http://localhost:8000/event/
- **📋 Waivers:** http://localhost:8000/waiver/
- **💬 Chat:** http://localhost:8000/chats/

## 🔧 Configuración Manual

### Activar Entorno Virtual
```bash
source venv/bin/activate
```

### Instalar Dependencias
```bash
pip install -r requirements.txt
```

### Configurar Variables de Entorno
El archivo `.env` ya está configurado con:
- Base de datos remota: `82.165.210.146`
- Usuario: `mrgomez`
- Contraseña: `Karin2100`

### Ejecutar Migraciones
```bash
python manage.py migrate
```

### Ejecutar Servidor
```bash
python manage.py runserver
```

## 🛠️ Solución de Problemas

### Puerto 8000 en uso
```bash
lsof -ti:8000 | xargs kill -9
```

### Error de conexión a base de datos
Verificar que el archivo `.env` tenga la configuración correcta:
```
DB_HOST=82.165.210.146
DB_USER=mrgomez
DB_PASSWORD=Karin2100
DB_NAME=smap_kf
```

### Error de templates
Los templates están configurados para funcionar en modo local. Si hay errores, verificar que existan los archivos:
- `kidsfun_web/templates/kidsfun_web/mobile_app.html`
- `t_app_product/templates/t_app_product/email/waiver_confirmation.html`

## 📝 Notas Importantes

- El proyecto está conectado a la base de datos remota en la nube
- En modo local, las funcionalidades de likes y comentarios muestran valores por defecto
- Para desarrollo, se recomienda usar el modo local (`./run_local.sh`)
- Para pruebas completas, usar el modo normal (`./run_normal.sh`)

## 🔄 Cambiar Entre Modos

### De Local a Completo
```bash
./run_normal.sh
```

### De Completo a Local
```bash
./run_local.sh
```

## 📞 Soporte

Si tienes problemas, verificar:
1. Que el entorno virtual esté activado
2. Que las dependencias estén instaladas
3. Que la conexión a la base de datos funcione
4. Que los archivos de configuración estén correctos 