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

4.Crear una migración:

    python3 manage.py makemigrations
    
5.Correr todas las migraciones:

    python3 manage.py migrate

6.Asignación de la variable de ejecución del proyecto:

    python3 manage.py runserver

## PostgreSQL

1.Ingresar a la terminal de Postgre

    psql -U postgres -d ""

2.Crear data base
    
    CREATE DATABASE smap_kf;

-.Borrar los datos
    
    DELETE FROM api_waiver_waiverqr;
    DELETE FROM api_waiver_waiverdata;

-.Restaorar la secuencia

    ALTER SEQUENCE api_waiver_waiverqr_id_seq RESTART WITH 1;
    ALTER SEQUENCE api_waiver_waiverdata_id_seq RESTART WITH 1;



##### Video de referencia:
    https://www.youtube.com/watch?v=e6PkGDH4wWA&t=5736s
