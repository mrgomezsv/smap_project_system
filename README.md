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


##### Video de referencia:
    https://www.youtube.com/watch?v=e6PkGDH4wWA&t=5736s


# Guía de Configuración de la Aplicación Django con Docker Compose

Esta guía proporciona instrucciones paso a paso para configurar y ejecutar una aplicación web Django utilizando Docker Compose.

## Requisitos Previos

- Docker
- Docker Compose

## Pasos para Configurar y Ejecutar la Aplicación

1. **Clona el Repositorio**
    
    git clone https://github.com/mrgomezsv/smap_project_fazt_web.git

    cd smap_project_fazt_web


2. **Configura el Archivo docker-compose.yml**

Abre el archivo `docker-compose.yml` y asegúrate de que estén configurados correctamente los servicios de la aplicación web y la base de datos PostgreSQL. Verifica las credenciales de la base de datos y las configuraciones de los volúmenes.

3. **Construye y Ejecuta los Contenedores Docker**

Ejecuta el siguiente comando para construir y ejecutar los contenedores Docker:

    docker-compose up --build


4. **Migra la Base de Datos**

Una vez que los contenedores estén en funcionamiento, ejecuta las migraciones de Django para crear las tablas necesarias en la base de datos PostgreSQL:

    docker-compose exec web python manage.py migrate


5. **Accede a la Aplicación en tu Navegador**

Abre tu navegador web y accede a `http://localhost:8000` para ver la aplicación Django en funcionamiento.

## Solución de Problemas

- Si encuentras algún error durante la ejecución, revisa los logs de los contenedores con el comando `docker-compose logs`.
- Asegúrate de que las configuraciones de la aplicación y la base de datos estén correctamente sincronizadas en el archivo `docker-compose.yml`.
