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


## Upgrade Project by Docker Integration
1.Construir el contenedor:
Primero, asegúrate de estar en el directorio de tu proyecto donde se encuentra el archivo docker-compose.yml. Luego, 
ejecuta el siguiente comando para construir los contenedores:
    
    docker-compose build

2.Ejecutar los contenedores:
Después de construir los contenedores, puedes iniciarlos con el siguiente comando:

    docker-compose up

3.Esto iniciará todos los servicios definidos en tu docker-compose.yml. Si deseas ejecutar los contenedores en segundo 
plano (detached mode), puedes agregar el flag -d:

    docker-compose up -d

## Comandos adicionales:
### Aplicar migraciones:

1.Después de que los contenedores estén en ejecución, aplica las migraciones de la base de datos:

    docker-compose exec smap_web python manage.py makemigrations
    docker-compose exec smap_web python manage.py migrate

2.Crear un superusuario (opcional):

Si necesitas crear un superusuario para acceder al admin de Django, ejecuta:

    docker-compose exec smap_web python manage.py createsuperuser

3.Ver logs:

Para ver los logs de un contenedor específico, puedes usar:

    docker-compose logs smap_web
    docker-compose logs smap_db

4.Parar los contenedores:

Para detener los contenedores, utiliza:

    docker-compose down

Este comando detendrá y eliminará los contenedores, pero conservará las imágenes y los volúmenes de datos.

## Resumen de los comandos:
### Construir los contenedores
    docker-compose build

### Iniciar los contenedores
    docker-compose up
### o para ejecutarlos en segundo plano
    docker-compose up -d

### Aplicar migraciones
    docker-compose exec smap_web python manage.py makemigrations
    docker-compose exec smap_web python manage.py migrate

### Crear un superusuario
    docker-compose exec smap_web python manage.py createsuperuser

### Ver logs de los contenedores
    docker-compose logs smap_web
    docker-compose logs smap_db

### Detener y eliminar los contenedores
    docker-compose down
