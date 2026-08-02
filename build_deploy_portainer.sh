#!/usr/bin/env bash

# Exit immediately if a command exits with a non-zero status
set -e

echo "🚀 Iniciando proceso completo de Build y Deploy para Docker Hub & Portainer..."
echo "=========================================================================="

DOCKER_USER="mrgomezdev"
API_IMAGE="${DOCKER_USER}/kidsfun-api:latest"
WEB_IMAGE="${DOCKER_USER}/kidsfun-web:latest"

# 1. Compilar imagen de API (NestJS) para Linux x86_64 (VPS)
echo ""
echo "📦 [1/4] Compilando imagen de API (${API_IMAGE}) para linux/amd64..."
docker build --platform linux/amd64 -f apps/api/Dockerfile -t ${API_IMAGE} .

# 2. Subir imagen de API a Docker Hub
echo ""
echo "📤 [2/4] Subiendo imagen de API a Docker Hub..."
docker push ${API_IMAGE}

# 3. Compilar imagen de Web (Next.js) para Linux x86_64 (VPS)
echo ""
echo "📦 [3/4] Compilando imagen de Web (${WEB_IMAGE}) para linux/amd64..."
docker build --platform linux/amd64 -f apps/web/Dockerfile -t ${WEB_IMAGE} .

# 4. Subir imagen de Web a Docker Hub
echo ""
echo "📤 [4/4] Subiendo imagen de Web a Docker Hub..."
docker push ${WEB_IMAGE}

echo ""
echo "=========================================================================="
echo "🎉 ¡PROCESO COMPLETADO EXITOSAMENTE!"
echo "   - API publicada: ${API_IMAGE}"
echo "   - WEB publicada: ${WEB_IMAGE}"
echo ""
echo "👉 Siguiente paso en Portainer:"
echo "   Ve a tu Stack en Portainer y haz clic en 'Update the stack' / 'Redeploy'."
echo "=========================================================================="
