# Usar una imagen oficial de Python ligera
FROM python:3.11-slim

# Evitar que Python genere archivos .pyc y permitir logs en tiempo real
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Instalar dependencias del sistema necesarias para mysqlclient y otras librerías
RUN apt-get update && apt-get install -y \
    default-libmysqlclient-dev \
    build-essential \
    pkg-config \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Establecer el directorio de trabajo
WORKDIR /app

# Instalar dependencias de Python
COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt
# Instalar el driver de MySQL para Django
RUN pip install --no-cache-dir mysqlclient

# Copiar el proyecto
COPY . /app/

# Recolectar archivos estáticos
# Nota: DEBUG=False para collectstatic en producción
RUN DJANGO_SECRET_KEY=dummy-key python manage.py collectstatic --noinput

# Exponer el puerto que usará Gunicorn
EXPOSE 8000

# Comando para iniciar la aplicación con Gunicorn
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "--workers", "3", "smap_project.wsgi:application"]
