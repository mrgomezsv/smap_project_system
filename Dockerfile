# Usar una imagen base oficial de Python
FROM python:3.12-slim

# Establecer el directorio de trabajo
WORKDIR /app

# Instalar dependencias del sistema
RUN apt-get update && apt-get install -y \
    build-essential \
    python3-dev \
    libffi-dev \
    libpq-dev \
    gcc \
    --no-install-recommends && \
    rm -rf /var/lib/apt/lists/*

# Copiar los archivos del proyecto
COPY . .

RUN pip --version && python --version && cat requirements.txt

# Instalar las dependencias de Python
RUN pip install --no-cache-dir -r requirements.txt

RUN pip install --no-cache-dir -r requirements.txt --verbose

# Configurar variables de entorno
ENV DJANGO_SETTINGS_MODULE=smap_project.settings

# Exponer el puerto
EXPOSE 8000

# Comando para ejecutar la aplicación
CMD ["gunicorn", "--workers", "3", "--bind", "0.0.0.0:8000", "smap_project.wsgi:application"]
