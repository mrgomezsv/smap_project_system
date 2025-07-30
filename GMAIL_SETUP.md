# 🔧 Configuración de Gmail para KidsFun

## 📋 Pasos para Configurar Gmail

### **Paso 1: Activar Verificación en Dos Pasos**

1. Ve a tu cuenta de Google: https://myaccount.google.com/
2. Haz clic en **"Seguridad"** en el menú lateral
3. Busca **"Verificación en dos pasos"** y haz clic
4. Activa la verificación en dos pasos
5. Sigue los pasos para configurarla (puede ser con tu teléfono)

### **Paso 2: Generar Contraseña de Aplicación**

1. En la misma página de Seguridad, busca **"Contraseñas de aplicación"**
2. Haz clic en **"Contraseñas de aplicación"**
3. Selecciona **"Otra"** como tipo de aplicación
4. Dale un nombre como **"KidsFun Django"**
5. Haz clic en **"Generar"**
6. **¡IMPORTANTE!** Copia la contraseña de 16 caracteres que aparece

### **Paso 3: Actualizar Configuración**

Edita el archivo `smap_project/settings.py` y reemplaza:

```python
EMAIL_HOST_PASSWORD = 'TU_CONTRASEÑA_DE_APLICACION_AQUI'
```

Con la contraseña de 16 caracteres que generaste.

### **Paso 4: Probar la Configuración**

Ejecuta el script de prueba:

```bash
python test_gmail.py
```

## 🔍 Verificación de Configuración

Tu configuración actual en `settings.py` debe verse así:

```python
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = 'kidsfun.developer@gmail.com'
EMAIL_HOST_PASSWORD = 'abcd efgh ijkl mnop'  # Tu contraseña de 16 caracteres
DEFAULT_FROM_EMAIL = 'kidsfun.developer@gmail.com'
```

## 🚨 Solución de Problemas Comunes

### **Error: "Authentication failed"**
- ✅ Verifica que la contraseña de aplicación sea correcta
- ✅ Asegúrate de que la verificación en dos pasos esté activada
- ✅ Confirma que el email esté correctamente escrito
- ✅ Revisa que no haya espacios extra en la contraseña

### **Error: "Connection refused"**
- ✅ Verifica que el puerto 587 esté abierto
- ✅ Confirma que no haya firewall bloqueando la conexión

### **Error: "Username and Password not accepted"**
- ✅ Usa la contraseña de aplicación, NO tu contraseña normal de Gmail
- ✅ La contraseña de aplicación tiene 16 caracteres sin espacios

## 📧 Límites de Gmail

- **Gratis**: 500 emails/día
- **Gmail Workspace**: 2,000 emails/día
- **Tamaño máximo**: 25MB por correo

## ✅ Verificación Final

Si el script `test_gmail.py` funciona correctamente, verás:

```
✅ ¡Correo enviado exitosamente!
📧 Revisa tu bandeja de entrada: tu_email@gmail.com
🎉 La configuración de Gmail está funcionando correctamente
```

## 🎯 Próximos Pasos

Una vez que Gmail esté funcionando:

1. **Probar el sistema de waivers**:
   ```bash
   python manage.py runserver
   ```
   Luego envía un waiver desde tu aplicación

2. **Configurar correos automáticos**:
   - Los correos de bienvenida se enviarán automáticamente
   - Los waivers se enviarán con PDF adjunto

3. **Monitorear**:
   - Revisa los logs de Django para errores
   - Verifica que los correos lleguen a la bandeja de entrada

---

**¡Listo!** Tu sistema de correos con Gmail está configurado. 🎉 