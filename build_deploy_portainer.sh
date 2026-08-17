#!/usr/bin/env bash

# Exit immediately if a command exits with a non-zero status
set -e

echo "🚀 Iniciando proceso completo de Build y Deploy para Docker Hub & Portainer..."
echo "=========================================================================="

DOCKER_USER="mrgomezdev"
VERSION="v2.0.$(date +%s)"
API_IMAGE="${DOCKER_USER}/kidsfun-api:${VERSION}"
API_IMAGE_LATEST="${DOCKER_USER}/kidsfun-api:latest"
WEB_IMAGE="${DOCKER_USER}/kidsfun-web:${VERSION}"
WEB_IMAGE_LATEST="${DOCKER_USER}/kidsfun-web:latest"

echo "📌 Versión generada para este despliegue: ${VERSION}"

# 1. Compilar imagen de API (NestJS) para Linux x86_64 (VPS)
echo ""
echo "📦 [1/4] Compilando imagen de API (${API_IMAGE}) para linux/amd64..."
docker build --platform linux/amd64 -f apps/api/Dockerfile -t ${API_IMAGE} -t ${API_IMAGE_LATEST} .

# 2. Subir imagen de API a Docker Hub
echo ""
echo "📤 [2/4] Subiendo imagen de API (${VERSION} y latest) a Docker Hub..."
docker push ${API_IMAGE}
docker push ${API_IMAGE_LATEST}

# 3. Compilar imagen de Web (Next.js) para Linux x86_64 (VPS)
echo ""
echo "📦 [3/4] Compilando imagen de Web (${WEB_IMAGE}) para linux/amd64..."
docker build --platform linux/amd64 -f apps/web/Dockerfile -t ${WEB_IMAGE} -t ${WEB_IMAGE_LATEST} .

# 4. Subir imagen de Web a Docker Hub
echo ""
echo "📤 [4/4] Subiendo imagen de Web (${VERSION} y latest) a Docker Hub..."
docker push ${WEB_IMAGE}
docker push ${WEB_IMAGE_LATEST}

# 5. Opcional: Disparar Webhook de Portainer si está configurado en las variables de entorno
if [ -n "$PORTAINER_WEBHOOK_URL" ]; then
  echo ""
  echo "⚡ [Opcional] Disparando Webhook de Portainer para auto-despliegue..."
  curl -X POST "$PORTAINER_WEBHOOK_URL" || echo "⚠️ No se pudo notificar al Webhook de Portainer. Por favor realiza el redeploy manual."
fi

echo ""
echo "=========================================================================="
echo "🎉 ¡PROCESO COMPLETADO EXITOSAMENTE!"
echo "   - API publicada: ${API_IMAGE}"
echo "   - WEB publicada: ${WEB_IMAGE}"
echo ""
echo "🔒 NOTA SOBRE LA BASE DE DATOS (DB):"
echo "   Este script NO toca ni modifica el contenedor de MariaDB (DB)."
echo "   Los datos de la DB residen seguros en el volumen 'proyecto_kidsfun_db_data'."
echo ""
echo "👉 Siguiente paso en Portainer:"
echo "   1. En Portainer, ve a tu Stack y presiona 'Update the stack' / 'Redeploy'."
echo "      (Docker solo actualizará 'api' y 'web', manteniendo 'db' corriendo sin interrupciones)."
echo "   2. O en Containers/Services, actualiza/recrea únicamente 'api' y 'web'."
echo "=========================================================================="

