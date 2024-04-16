# Requisitos previos
Asegúrate de tener Python instalado en tu sistema. Puedes descargarlo desde python.org.

## Instalación
1.Clona este repositorio:

    git clone https://github.com/mrgomezsv/smap_project_fazt_web.git

    cd smap_project_fazt_web

2.Crea y activa un entorno virtual (opcional pero recomendado):

    python -m venv venv

    .\venv\Scripts\activate

3.Instala las dependencias:

    pip install -r requirements.txt

4.Asignación de la variable de ejecución del proyecto:
    
    python manage.py runserver

##### Video de referencia:
    https://www.youtube.com/watch?v=e6PkGDH4wWA&t=5736s

## Integracion con Docker para Production

1.construye una nueva imagen Docker para tu aplicación Django.
    
    docker build -t smap_django_app .

2.ejecuta un nuevo contenedor Docker basado en la imagen smap_django_app que construiste previamente.
    
    docker run -d --name smap_django_app_container -p 8000:8000 smap_django_app 

3.inicia un contenedor Docker previamente creado, en este caso, el contenedor llamado smap_django_app_container.

    docker start smap_django_app_container

En resumen, estos tres comandos juntos te permiten construir una imagen Docker para tu aplicación Django, ejecutar un contenedor basado en esa imagen, y luego iniciar ese contenedor en tu entorno Docker para que tu aplicación Django esté disponible y funcionando.