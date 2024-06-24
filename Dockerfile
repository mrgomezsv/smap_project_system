FROM python:3.9

# Instalar dependencias del sistema
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    && apt-get clean

# Establecer el directorio de trabajo
WORKDIR /app

# Copiar los requisitos del proyecto y instalar dependencias
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install gunicorn

# Copiar todo el proyecto
COPY . .

# Exponer el puerto
EXPOSE 8000

# Comando por defecto para ejecutar la aplicación
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "smap_project.wsgi:application"]
