#!/bin/bash

# Configuración (Versión auto-incrementable)
VERSION="1.0.0.7"
BASE_VERSION=$(echo $VERSION | cut -d'.' -f1-3)
BUILD_NUMBER=$(echo $VERSION | cut -d'.' -f4)
VERSION="$BASE_VERSION.$((BUILD_NUMBER + 1))"

# Actualizar el archivo para el próximo uso
sed -i '' "s/VERSION=\"[^\"]*\"/VERSION=\"$VERSION\"/" build_and_push.sh


APP_IMAGE="mrgomezdev/kidsfun-django"
DB_IMAGE="mrgomezdev/kidsfun-db"

echo "🚀 Iniciando proceso de despliegue para la versión $VERSION..."

# 1. Generar el dump de la base de datos
echo "🔍 Buscando contenedor de base de datos..."
CONTAINER_DB=$(docker ps --filter "name=db" --format "{{.Names}}" | head -n 1)

if [ -z "$CONTAINER_DB" ]; then
    echo "❌ Error: No se encontró un contenedor con el nombre 'db'. Asegúrate de que 'docker compose up' esté corriendo."
    exit 1
fi

echo "📦 Generando volcado de datos desde el contenedor: $CONTAINER_DB..."
docker exec $CONTAINER_DB mysqldump -u mrgomez -pKarin2100 smap_kf > dump.sql

# 2. Construir y subir imagen de la DB
echo "🏗️ Construyendo imagen de la base de datos ($DB_IMAGE) para Linux amd64..."
docker buildx build --platform linux/amd64 -t $DB_IMAGE:$VERSION -t $DB_IMAGE:latest -f Dockerfile.db --push .

# 3. Construir y subir imagen de la WEB
echo "🏗️ Construyendo imagen de la aplicación ($APP_IMAGE) para Linux amd64..."
docker buildx build --platform linux/amd64 -t $APP_IMAGE:$VERSION -t $APP_IMAGE:latest --push .

echo "✨ Proceso completado. Las imágenes están listas en Docker Hub."
echo "🔗 App: $APP_IMAGE:$VERSION"
echo "🔗 DB:  $DB_IMAGE:$VERSION"
