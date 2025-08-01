# Requisitos previos
Asegúrate de tener Python instalado en tu sistema. Puedes descargarlo desde python.org.

## Instalación en Windows
1.Clona este repositorio:

    git clone https://github.com/mrgomezsv/smap_project_fazt_web.git

    cd smap_project_fazt_web

2.Crea y activa un entorno virtual (opcional pero recomendado):

    python -m venv venv

    .\venv\Scripts\activate

3.Instala las dependencias:

    pip install -r requirements.txt

4.Crear una migración
    
    python manage.py makemigrations

5.Correr todas las migraciones

    python manage.py migrate

6.Asignación de la variable de ejecución del proyecto:
    
    python manage.py runserver

## Instalación en Linux
1.Clona este repositorio:

    git clone https://github.com/mrgomezsv/smap_project_fazt_web.git
    
    cd smap_project_fazt_web

2.Crea y activa un entorno virtual (opcional pero recomendado):

    python3 -m venv venv
    source venv/bin/activate

3.Instala las dependencias:

    pip install -r requirements.txt

4.Crear una migración:

    python3 manage.py makemigrations

5.Correr todas las migraciones:

    python3 manage.py migrate

6.Asignación de la variable de ejecución del proyecto:

    python3 manage.py runserver

## Instalación en MacOS
1.Clona este repositorio:

    git clone https://github.com/mrgomezsv/smap_project_fazt_web.git
    
    cd smap_project_fazt_web

2.Crea y activa un entorno virtual (opcional pero recomendado):

    python3 -m venv venv
    source venv/bin/activate

3.Instala las dependencias:

    pip install -r requirements.txt

    pip install altgraph
    pip install asgiref
    pip install Babel
    pip install backports.tarfile
    pip install CacheControl
    pip install cachetools
    pip install certifi
    pip install cffi
    pip install chardet
    pip install charset-normalizer
    pip install cryptography
    pip install decorator
    pip install Django
    pip install django-cors-headers
    pip install django-environ
    pip install djangorestframework
    pip install docopt
    pip install docutils
    pip install firebase-admin
    pip install future
    pip install google-api-core
    pip install google-api-python-client
    pip install google-auth
    pip install google-auth-httplib2
    pip install google-cloud-core
    pip install google-cloud-firestore
    pip install google-cloud-storage
    pip install google-crc32c
    pip install google-resumable-media
    pip install googleapis-common-protos
    pip install grpcio
    pip install grpcio-status
    pip install httplib2
    pip install idna
    pip install importlib_metadata
    pip install install
    pip install jaraco.classes
    pip install jaraco.context
    pip install jaraco.functools
    pip install Jinja2
    pip install keyring
    pip install lxml
    pip install lxml_html_clean
    pip install macholib
    pip install MarkupSafe
    pip install more-itertools
    pip install msgpack
    pip install num2words
    pip install passlib
    pip install pillow
    pip install polib
    pip install proto-plus
    pip install protobuf
    pip install psutil
    pip install psycopg2
    pip install psycopg2-binary
    pip install pyasn1
    pip install pyasn1_modules
    pip install pycparser
    pip install PyJWT
    pip install pyOpenSSL
    pip install pyparsing
    pip install PyPDF2
    pip install python-dateutil
    pip install pytz
    pip install reportlab
    pip install requests
    pip install rsa
    pip install sqlparse
    pip install typing_extensions
    pip install uritemplate
    pip install urllib3
    pip install v
    pip install Werkzeug
    pip install zipp
    pip install pyfcm


4.Crear una migración:

    python3 manage.py makemigrations
    
5.Correr todas las migraciones:

    python3 manage.py migrate

6.Asignación de la variable de ejecución del proyecto:

    python3 manage.py runserver

## PostgreSQL

0.Hacer un Backup de la db en el Servidor

    pg_dump -U mrgomez -F c -b -v -f /root/smap_kf_backup.dump smap_kf

0.1Descargar el Backup a mi Mac

    scp root@82.165.210.146:/root/smap_kf_backup.dump /Users/mrgomez/
    scp -r root@82.165.210.146:/root/smap_project_system/media /Users/mrgomez
    scp -r root@82.165.210.146:/root/smap_project_system/credentials /Users/mrgomez

1.Ingresar a la terminal de Postgre

    psql -U postgres -d ""

2.Crear data base
    
    CREATE DATABASE smap_kf;

-.Borrar los datos
    
    DELETE FROM api_waiver_waiverqr;
    DELETE FROM api_waiver_waiverdata;

    DELETE FROM t_app_product_waivervalidator;    
    ALTER SEQUENCE t_app_product_waivervalidator_id_seq RESTART WITH 1;

-.Restaorar la secuencia

    ALTER SEQUENCE api_waiver_waiverqr_id_seq RESTART WITH 1;
    ALTER SEQUENCE api_waiver_waiverdata_id_seq RESTART WITH 1;

    ALTER SEQUENCE t_app_product_waivervalidator_id_seq RESTART WITH 1;

    DELETE FROM t_app_product_waivervalidator;    
    ALTER SEQUENCE t_app_product_waivervalidator_id_seq RESTART WITH 1;

    DELETE FROM t_app_commentary;    
    ALTER SEQUENCE t_app_commentary_id_seq RESTART WITH 1;


##### Video de referencia:
    https://www.youtube.com/watch?v=e6PkGDH4wWA&t=5736s

-.Tunes remoto para la db
    
    ssh -L 5432:localhost:5432 root@82.165.210.146

-.En los settings mantener la direccion asi mientras desarrollo

    'HOST': '82.165.210.146',



# Guía de Despliegue en Producción para Proyecto Django

Esta guía detalla los pasos para desplegar un proyecto Django en producción utilizando Gunicorn y Nginx.

## Paso 1: Instalación de Gunicorn
Instala Gunicorn en tu entorno virtual de Python:
   
    pip install gunicorn


## Paso 2: Crear archivo de servicio para Gunicorn
Crea un archivo de servicio para Gunicorn en /etc/systemd/system/gunicorn.service:

    sudo nano /etc/systemd/system/gunicorn.service

Agrega el siguiente contenido:

ini
    
    [Unit]
    Description=gunicorn daemon
    After=network.target
    
    [Service]
    User=root
    Group=www-data
    WorkingDirectory=/root/smap_project_system
    ExecStart=/root/smap_project_system/venv/bin/gunicorn --access-logfile - --workers 3 --bind unix:/run/gunicorn/gunicorn.sock smap_project.wsgi:application
    
    [Install]
    WantedBy=multi-user.target


## Paso 3: Crear directorio para el socket de Gunicorn
Crea un directorio para el socket de Gunicorn:


    sudo mkdir /run/gunicorn
    sudo chown root:www-data /run/gunicorn
    sudo chmod 775 /run/gunicorn

## Paso 4: Recargar y reiniciar Gunicorn
Recarga systemd y reinicia Gunicorn:

    sudo systemctl daemon-reload
    sudo systemctl start gunicorn
    sudo systemctl enable gunicorn

## Paso 5: Configurar Nginx
Crea o edita el archivo de configuración de Nginx en /etc/nginx/sites-available/kidsfun:

    sudo nano /etc/nginx/sites-available/kidsfun

Agrega el siguiente contenido:

## nginx

    server {
        listen 443 ssl;
        server_name kidsfunyfiestasinfantiles.com www.kidsfunyfiestasinfantiles.com;
    
        location = /favicon.ico { access_log off; log_not_found off; }
    
        location /static/ {
            alias /root/smap_project_system/staticfiles/;
        }
    
        location /media/ {
            alias /root/smap_project_system/media/;
        }
    
        location / {
            include proxy_params;
            proxy_pass http://unix:/run/gunicorn/gunicorn.sock;
        }
    
        ssl_certificate /etc/letsencrypt/live/kidsfunyfiestasinfantiles.com/fullchain.pem; # managed by Certbot
        ssl_certificate_key /etc/letsencrypt/live/kidsfunyfiestasinfantiles.com/privkey.pem; # managed by Certbot
        include /etc/letsencrypt/options-ssl-nginx.conf; # managed by Certbot
        ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem; # managed by Certbot
    }
    
    server {
        listen 80;
        server_name kidsfunyfiestasinfantiles.com www.kidsfunyfiestasinfantiles.com;
    
        if ($host = www.kidsfunyfiestasinfantiles.com) {
            return 301 https://$host$request_uri;
        } # managed by Certbot
    
        if ($host = kidsfunyfiestasinfantiles.com) {
            return 301 https://$host$request_uri;
        } # managed by Certbot
    
        location / {
            return 404;
        }
    }

## Paso 6: Crear enlace simbólico para Nginx
Crea un enlace simbólico para habilitar el archivo de configuración de Nginx:

    sudo ln -s /etc/nginx/sites-available/kidsfun /etc/nginx/sites-enabled

## Paso 7: Recargar y reiniciar Nginx
Recarga y reinicia Nginx:

    sudo nginx -t
    sudo systemctl restart nginx

## Paso 8: Configurar archivos estáticos en Django
En tu archivo settings.py, configura los archivos estáticos y directorios:

python

    STATIC_URL = '/static/'
    STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
    
    STATICFILES_DIRS = [
        BASE_DIR / "static",
        BASE_DIR / "t_app_product" / "static",
    ]
    
    MEDIA_URL = '/media/'
    MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

## Paso 9: Recolectar archivos estáticos
Ejecuta el comando para recolectar los archivos estáticos:

    python manage.py collectstatic

## Paso 10: Configurar HTTPS con Certbot
Instala Certbot y configura HTTPS:

    sudo apt-get install certbot python3-certbot-nginx
    sudo certbot --nginx -d kidsfunyfiestasinfantiles.com -d www.kidsfunyfiestasinfantiles.com

## Paso 11: Verificar el estado
Revisa el estado de Gunicorn y Nginx para asegurarte de que todo esté funcionando correctamente:


    sudo systemctl status gunicorn
    sudo systemctl status nginx




### Actualizar para ver CAMBIOS en PRODUCCION

Limpiar la caché del navegador: Prueba recargando la página con Ctrl + F5 (Windows) o Cmd + Shift + R (Mac) para forzar una recarga completa.

Reiniciar el servidor de Gunicorn: Si tienes habilitado el modo producción, reinicia Gunicorn para asegurarte de que los cambios se carguen correctamente:

    sudo systemctl restart gunicorn

Verificar la caché de Nginx: Nginx podría estar sirviendo una versión en caché. Intenta limpiar la caché de Nginx reiniciándolo:

    sudo systemctl restart nginx

## Configuración del Sistema de Correos Electrónicos para Waiver

### 1. Configuración de Gmail
Para usar Gmail como proveedor de correo electrónico, necesitas seguir estos pasos:

1. Activar la verificación en dos pasos en tu cuenta de Gmail:
   - Ve a tu cuenta de Google
   - Seguridad > Verificación en dos pasos
   - Activa la verificación en dos pasos

2. Generar una contraseña de aplicación:
   - Ve a tu cuenta de Google
   - Seguridad > Contraseñas de aplicación
   - Selecciona "Otra" como tipo de aplicación
   - Dale un nombre (por ejemplo, "KidsFun Waiver")
   - Copia la contraseña generada

3. Actualizar la configuración en `settings.py`:
   ```python
   # Configuración de correo electrónico
   EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
   EMAIL_HOST = 'smtp.gmail.com'
   EMAIL_PORT = 587
   EMAIL_USE_TLS = True
   EMAIL_HOST_USER = 'tu_correo@gmail.com'  # Tu correo de Gmail
   EMAIL_HOST_PASSWORD = 'tu_contraseña_de_aplicacion'  # La contraseña de aplicación generada
   DEFAULT_FROM_EMAIL = 'tu_correo@gmail.com'
   ```

### 2. Estructura del Sistema de Correos
El sistema de correos para el waiver incluye:

1. Plantilla HTML (`api_waiver/templates/api_waiver/email/waiver_confirmation.html`):
   - Diseño responsivo
   - Información del usuario
   - Código QR
   - Detalles de los familiares registrados
   - Instrucciones importantes

2. Generación de PDF (`api_waiver/utils.py`):
   - Crea un PDF con los detalles del waiver
   - Incluye información del usuario y familiares
   - Se adjunta automáticamente al correo

### 3. Uso de la API
Para registrar un waiver y enviar el correo, envía una petición POST a `/api/waiver/` con el siguiente formato:

```json
{
    "user_id": "123",
    "user_name": "Juan Pérez",
    "user_email": "juan@ejemplo.com",
    "relatives": [
        {
            "name": "María Pérez",
            "age": 8,
            "dateTime": "2024-03-20 10:00:00"
        }
    ]
}
```

La API responderá con:
```json
{
    "message": "Datos guardados correctamente y correo enviado.",
    "qr_value": "123",
    "waiver_data": [...],
    "email_sent": true
}
```

### 4. Pruebas del Sistema de Correos
Para probar el sistema de correos en desarrollo:

1. Usa el backend de consola (solo para desarrollo):
   ```python
   # En settings.py
   EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'
   ```
   Esto mostrará los correos en la consola en lugar de enviarlos.

2. Verifica los logs:
   - Los errores de envío se registran en la consola
   - Revisa la respuesta de la API para el campo `email_sent`

### 5. Solución de Problemas Comunes

1. Error de autenticación en Gmail:
   - Verifica que la contraseña de aplicación sea correcta
   - Asegúrate de que la verificación en dos pasos esté activada
   - Confirma que el correo electrónico esté correctamente escrito

2. Correos no enviados:
   - Revisa los logs del servidor
   - Verifica la configuración de Gmail
   - Asegúrate de que el correo del destinatario sea válido

3. Problemas con el PDF:
   - Verifica que los datos del usuario sean correctos
   - Asegúrate de que el formato de fecha sea válido
   - Confirma que todos los campos requeridos estén presentes

### 6. Notas de Seguridad

1. Nunca compartas tu contraseña de aplicación
2. Mantén actualizada la configuración de seguridad de Gmail
3. Usa HTTPS en producción
4. Considera implementar rate limiting para la API
5. Valida siempre los correos electrónicos de entrada


mario revisar commit 391b551307157dfc3758463c469624b863f5378a
