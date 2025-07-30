# 📧 Configuración de Correos Electrónicos - KidsFun

Esta guía te ayudará a configurar el sistema de correos electrónicos para tu proyecto Django KidsFun.

## 🚀 Opciones Gratuitas Recomendadas

### 1. **Gmail (Recomendado para empezar)**
- **Ventajas**: Fácil configuración, confiable, 500 emails/día gratis
- **Configuración**: Ya incluida en tu proyecto

### 2. **SendGrid (Muy recomendado)**
- **Gratis**: 100 emails/día
- **Ventajas**: Muy confiable, analytics, plantillas
- **Ideal para**: Proyectos en crecimiento

### 3. **Mailgun**
- **Gratis**: 5,000 emails/mes por 3 meses
- **Ventajas**: Excelente para APIs

### 4. **Resend**
- **Gratis**: 3,000 emails/mes
- **Ventajas**: Muy moderno, excelente documentación

## 🔧 Configuración con Gmail

### Paso 1: Activar Verificación en Dos Pasos
1. Ve a tu cuenta de Google
2. Seguridad → Verificación en dos pasos
3. Activa la verificación en dos pasos

### Paso 2: Generar Contraseña de Aplicación
1. Ve a tu cuenta de Google
2. Seguridad → Contraseñas de aplicación
3. Selecciona "Otra" como tipo de aplicación
4. Dale un nombre (ej: "KidsFun Django")
5. Copia la contraseña generada

### Paso 3: Actualizar Configuración
Edita `smap_project/settings.py`:

```python
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = 'tu_email@gmail.com'
EMAIL_HOST_PASSWORD = 'tu_contraseña_de_aplicacion'  # La contraseña generada
DEFAULT_FROM_EMAIL = 'tu_email@gmail.com'
```

## 🔧 Configuración con SendGrid

### Paso 1: Crear Cuenta
1. Ve a [sendgrid.com](https://sendgrid.com)
2. Crea una cuenta gratuita
3. Verifica tu dominio de email

### Paso 2: Obtener API Key
1. Dashboard → Settings → API Keys
2. Create API Key
3. Selecciona "Restricted Access" → "Mail Send"
4. Copia la API key

### Paso 3: Configurar en Django
Edita `email_config.py`:

```python
'sendgrid': {
    'BACKEND': 'django.core.mail.backends.smtp.EmailBackend',
    'HOST': 'smtp.sendgrid.net',
    'PORT': 587,
    'USE_TLS': True,
    'USER': 'apikey',
    'PASSWORD': 'TU_API_KEY_AQUI',  # Tu API key de SendGrid
    'DEFAULT_FROM': 'noreply@tu-dominio.com'
}
```

## 🧪 Probar el Sistema

### Opción 1: Script de Prueba
```bash
python test_email.py tu_email@gmail.com
```

### Opción 2: Shell de Django
```python
python manage.py shell

from t_app_product.utils import send_welcome_email
send_welcome_email('tu_email@gmail.com', 'Tu Nombre')
```

### Opción 3: Modo Desarrollo
Para desarrollo, puedes usar el backend de consola:

```python
# En settings.py
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'
```

Esto mostrará los correos en la consola en lugar de enviarlos.

## 📧 Funciones Disponibles

### 1. `send_welcome_email(user_email, user_name)`
Envía correo de bienvenida a nuevos usuarios.

### 2. `send_notification_email(user_email, subject, message)`
Envía correo de notificación simple.

### 3. `send_waiver_confirmation_email(user_data, qr_value, pdf_path)`
Envía correo de confirmación de waiver con PDF adjunto.

### 4. `send_email_with_template(subject, template_name, context, to_email, attachments)`
Función genérica para enviar correos con plantillas HTML.

## 📁 Estructura de Plantillas

```
t_app_product/templates/t_app_product/email/
├── welcome.html          # Correo de bienvenida
├── notification.html     # Notificaciones generales
└── waiver_confirmation.html  # Confirmación de waiver
```

## 🔒 Seguridad

### Variables de Entorno (Recomendado)
Crea un archivo `.env` en la raíz del proyecto:

```env
EMAIL_HOST_USER=tu_email@gmail.com
EMAIL_HOST_PASSWORD=tu_contraseña_de_aplicacion
DEFAULT_FROM_EMAIL=tu_email@gmail.com
```

Luego instala `python-decouple`:
```bash
pip install python-decouple
```

Y actualiza `settings.py`:
```python
from decouple import config

EMAIL_HOST_USER = config('EMAIL_HOST_USER')
EMAIL_HOST_PASSWORD = config('EMAIL_HOST_PASSWORD')
DEFAULT_FROM_EMAIL = config('DEFAULT_FROM_EMAIL')
```

## 🚨 Solución de Problemas

### Error: "Authentication failed"
- Verifica que la contraseña de aplicación sea correcta
- Asegúrate de que la verificación en dos pasos esté activada
- Confirma que el email esté correctamente escrito

### Error: "Connection refused"
- Verifica que el puerto 587 esté abierto
- Confirma que no haya firewall bloqueando la conexión

### Correos no se envían
- Revisa los logs del servidor
- Verifica la configuración del proveedor
- Confirma que el email del destinatario sea válido

### Correos van a spam
- Configura SPF, DKIM y DMARC
- Usa un dominio verificado
- Evita palabras que activen filtros de spam

## 📊 Monitoreo

### Logs de Django
Los errores de correo se registran en los logs de Django. Revisa:
```python
import logging
logger = logging.getLogger(__name__)
logger.error("Error enviando correo: %s", str(e))
```

### Analytics (SendGrid)
Si usas SendGrid, puedes ver:
- Tasa de entrega
- Aperturas de correos
- Clicks en enlaces
- Bounces y spam reports

## 🔄 Migración entre Proveedores

Para cambiar de proveedor, simplemente actualiza la configuración en `email_config.py` y llama a:

```python
from email_config import setup_email_settings
setup_email_settings('sendgrid')  # o 'gmail', 'mailgun', 'resend'
```

## 📞 Soporte

Si tienes problemas con la configuración:
1. Revisa los logs de Django
2. Prueba con el backend de consola
3. Verifica la configuración del proveedor
4. Consulta la documentación del proveedor

---

**¡Listo!** Tu sistema de correos electrónicos está configurado y listo para usar. 🎉 