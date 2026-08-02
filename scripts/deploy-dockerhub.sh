#!/usr/bin/env bash

# Exit immediately if a command exits with a non-zero status
set -e

echo "🚀 Iniciando despliegue automatizado a Docker Hub para Kidsfun..."
echo "==============================================================="

DOCKER_USER="mrgomezdev"
API_IMAGE="${DOCKER_USER}/kidsfun-api:latest"
WEB_IMAGE="${DOCKER_USER}/kidsfun-web:latest"

# 1. Compilar imagen de API (NestJS)
echo ""
echo "📦 [1/4] Compilando imagen de API (${API_IMAGE})..."
docker build -f apps/api/Dockerfile -t ${API_IMAGE} .

# 2. Subir imagen de API a Docker Hub
echo ""
echo "📤 [2/4] Subiendo imagen de API a Docker Hub..."
docker push ${API_IMAGE}

# 3. Compilar imagen de Web (Next.js)
echo ""
echo "📦 [3/4] Compilando imagen de Web (${WEB_IMAGE})..."
docker build -f apps/web/Dockerfile -t ${WEB_IMAGE} .

# 4. Subir imagen de Web a Docker Hub
echo ""
echo "📤 [4/4] Subiendo imagen de Web a Docker Hub..."
docker push ${WEB_IMAGE}

echo ""
echo "==============================================================="
echo "✅ ¡Imágenes compiladas y subidas exitosamente a Docker Hub!"
echo "   - API: ${API_IMAGE}"
echo "   - WEB: ${WEB_IMAGE}"
echo ""
echo "💡 Ahora puedes ir a Portainer y presionar 'Update / Redeploy Stack'."
echo "==============================================================="
