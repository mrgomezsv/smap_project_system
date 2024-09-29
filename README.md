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


##### Video de referencia:
    https://www.youtube.com/watch?v=e6PkGDH4wWA&t=5736s
