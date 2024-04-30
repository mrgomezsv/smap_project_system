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

4.Crear una migración
    
    python manage.py makemigrations

5.Correr todas las migraciones

    python manage.py migrate

6.Asignación de la variable de ejecución del proyecto:
    
    python manage.py runserver

##### Video de referencia:
    https://www.youtube.com/watch?v=e6PkGDH4wWA&t=5736s