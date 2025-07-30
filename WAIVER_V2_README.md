# 🎯 Waiver V2 - Sistema de Gestión de Waivers Mejorado

## 📋 Descripción

El sistema Waiver V2 es una versión mejorada del sistema de waivers que incluye:

- **QR único auto-generado** (no el ID del usuario)
- **Vencimiento automático** a medianoche del día de creación
- **Estados ACTIVO/INACTIVO** con actualización automática
- **Panel de administración mejorado** con filtros por fechas
- **Envío automático de emails** con PDF adjunto
- **APIs RESTful** para integración con aplicaciones móviles

## 🏗️ Arquitectura

### Aplicaciones
- **`api_waiver`**: Sistema original (mantenido para compatibilidad)
- **`waiver_v2`**: Nuevo sistema con funcionalidades mejoradas

### Modelos

#### `WaiverQRV2`
```python
- qr_code: Código QR único de 8 caracteres
- user_id: ID del usuario
- user_name: Nombre del usuario
- user_email: Email del usuario
- created_at: Fecha de creación
- expires_at: Fecha de vencimiento (medianoche del día)
- status: ACTIVE/INACTIVE
```

#### `WaiverDataV2`
```python
- waiver_qr: Relación con WaiverQRV2
- relative_name: Nombre del familiar
- relative_age: Edad del familiar
- timestamp: Fecha de creación
```

## 🚀 APIs Disponibles

### 1. Crear Waiver
```http
POST /api/v2/waiver/
```

**Body:**
```json
{
    "user_id": "user123",
    "user_name": "Juan Pérez",
    "user_email": "juan@example.com",
    "relatives": [
        {
            "name": "María Pérez",
            "age": 8
        }
    ]
}
```

**Respuesta:**
```json
{
    "message": "Waiver creado exitosamente y correo enviado.",
    "waiver": {
        "qr_code": "A1B2C3D4",
        "user_name": "Juan Pérez",
        "status": "ACTIVE",
        "expires_at": "2025-07-30T23:59:59Z"
    },
    "email_sent": true,
    "is_new": true
}
```

### 2. Obtener Datos por QR
```http
GET /api/v2/waiver/{qr_code}/
```

**Respuesta:**
```json
{
    "waiver": {
        "qr_code": "A1B2C3D4",
        "user_name": "Juan Pérez",
        "relatives": [...]
    },
    "is_valid": true
}
```

### 3. Obtener Waivers de Usuario
```http
GET /api/v2/waiver/user/{user_id}/
```

### 4. Validar Waiver
```http
POST /api/v2/waiver/validate/
```

**Body:**
```json
{
    "qr_code": "A1B2C3D4"
}
```

## 🛠️ Comandos de Gestión

### Actualizar Estados de Waivers
```bash
# Ver qué waivers se actualizarían (sin hacer cambios)
python manage.py update_waiver_status_v2 --dry-run

# Actualizar estados de waivers expirados
python manage.py update_waiver_status_v2
```

## 📧 Sistema de Emails

El sistema envía automáticamente un email con:
- **Plantilla HTML** personalizada
- **PDF del waiver** adjunto
- **Código QR** en el contenido
- **Información de familiares**

### Configuración de Email
```python
# settings.py
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = 'tu-email@gmail.com'
EMAIL_HOST_PASSWORD = 'tu-contraseña-de-aplicación'
```

## 🎛️ Panel de Administración

### Características del Admin
- **Filtros por fechas**: Ver waivers por día, semana, mes
- **Filtros por estado**: Activos, Inactivos, Expirados
- **Búsqueda**: Por QR, nombre, email
- **Acciones masivas**: Marcar como activo/inactivo
- **Actualización automática**: Estados se actualizan al ver la lista

### Acceso
```
http://localhost:8000/admin/
```

## 🧪 Pruebas

### Script de Pruebas
```bash
python test_waiver_v2.py
```

Este script prueba:
- ✅ Creación de waivers
- ✅ Validación de QR
- ✅ Obtención de datos
- ✅ Consulta de waivers por usuario
- ✅ Verificación de base de datos

## 🔄 Migración de Datos

### Estrategia de Migración
1. **Sistema dual**: Ambos sistemas funcionan en paralelo
2. **Migración gradual**: Los usuarios pueden migrar cuando quieran
3. **Sin pérdida de datos**: Todos los datos originales se preservan

### Script de Migración (Futuro)
```python
# Migrar datos del sistema original al nuevo
python manage.py migrate_waivers_to_v2
```

## 📊 Monitoreo

### Métricas Importantes
- **Waivers activos** por día
- **Waivers expirados** automáticamente
- **Emails enviados** exitosamente
- **QRs generados** únicos

### Logs
```python
# Los logs se guardan en
LOGGING = {
    'handlers': {
        'file': {
            'filename': 'waiver_v2.log',
        }
    }
}
```

## 🔒 Seguridad

### Validaciones
- **QR único**: No se pueden duplicar códigos
- **Vencimiento automático**: Los waivers expiran automáticamente
- **Validación de datos**: Todos los campos son validados
- **Sanitización**: Los datos se limpian antes de guardar

### Permisos
- **Lectura pública**: Cualquiera puede validar un QR
- **Escritura autenticada**: Solo usuarios autenticados pueden crear waivers
- **Admin protegido**: Solo superusuarios pueden acceder al admin

## 🚀 Despliegue

### Requisitos
- Django 4.2+
- PostgreSQL
- Redis (opcional, para cache)
- Celery (opcional, para tareas en background)

### Variables de Entorno
```bash
# .env
EMAIL_HOST_USER=tu-email@gmail.com
EMAIL_HOST_PASSWORD=tu-contraseña-de-aplicación
DATABASE_URL=postgresql://user:pass@host:port/db
```

## 📝 Notas de Desarrollo

### Compatibilidad
- ✅ **Sistema original**: Sigue funcionando sin cambios
- ✅ **Nuevo sistema**: Funciona en paralelo
- ✅ **APIs**: Endpoints separados para evitar conflictos

### Próximas Mejoras
- [ ] **Cache de QR**: Para validaciones más rápidas
- [ ] **Notificaciones push**: Recordatorios de vencimiento
- [ ] **Analytics**: Dashboard de métricas
- [ ] **API GraphQL**: Para consultas más complejas

## 🤝 Contribución

### Estándares de Código
- **PEP 8**: Formato de código Python
- **Docstrings**: Documentación de funciones
- **Tests**: Cobertura de pruebas > 90%
- **Type hints**: Tipado estático (opcional)

### Flujo de Trabajo
1. **Fork** del repositorio
2. **Branch** para nueva funcionalidad
3. **Commit** con mensajes descriptivos
4. **Pull Request** con descripción detallada
5. **Review** y merge

---

## 📞 Soporte

Para soporte técnico o preguntas:
- 📧 Email: soporte@kidsfun.com
- 📱 WhatsApp: +1 (555) 123-4567
- 🌐 Web: https://kidsfun.com/soporte 