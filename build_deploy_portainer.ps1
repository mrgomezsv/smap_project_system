# ==========================================================================
#  Build y Deploy para Docker Hub & Portainer (versión Windows / PowerShell)
#  Equivalente a build_deploy_portainer.sh
#
#  Uso (desde la raíz del proyecto, con Docker Desktop abierto):
#    powershell -ExecutionPolicy Bypass -File .\build_deploy_portainer.ps1
#
#  Opcional: webhook de Portainer para redeploy automático
#    $env:PORTAINER_WEBHOOK_URL = "https://..."; .\build_deploy_portainer.ps1
# ==========================================================================

$ErrorActionPreference = 'Stop'
# Mostrar bien acentos y emojis en la consola
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

# Ejecutar siempre desde la carpeta del script (raíz del proyecto)
Set-Location -Path $PSScriptRoot

# Ejecuta un comando externo (docker) y detiene el script si falla.
# PowerShell no se detiene solo cuando un programa externo devuelve error.
function Invoke-Step {
    param([string]$Command, [string[]]$Arguments)
    & $Command @Arguments
    if ($LASTEXITCODE -ne 0) {
        Write-Host ""
        Write-Host "❌ Falló: $Command $($Arguments -join ' ')" -ForegroundColor Red
        exit $LASTEXITCODE
    }
}

Write-Host "🚀 Iniciando proceso completo de Build y Deploy para Docker Hub & Portainer..."
Write-Host "=========================================================================="

# Verificar que Docker Desktop esté corriendo
docker info *> $null
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Docker no responde. Abre Docker Desktop y vuelve a intentarlo." -ForegroundColor Red
    exit 1
}

$DOCKER_USER      = "mrgomezdev"
$VERSION          = "v2.0.$([DateTimeOffset]::UtcNow.ToUnixTimeSeconds())"
$API_IMAGE        = "$DOCKER_USER/kidsfun-api:$VERSION"
$API_IMAGE_LATEST = "$DOCKER_USER/kidsfun-api:latest"
$WEB_IMAGE        = "$DOCKER_USER/kidsfun-web:$VERSION"
$WEB_IMAGE_LATEST = "$DOCKER_USER/kidsfun-web:latest"

Write-Host "📌 Versión generada para este despliegue: $VERSION"

# 1. Compilar imagen de API (NestJS) para Linux x86_64 (VPS)
Write-Host ""
Write-Host "📦 [1/4] Compilando imagen de API ($API_IMAGE) para linux/amd64..."
Invoke-Step docker @('build', '--platform', 'linux/amd64', '-f', 'apps/api/Dockerfile', '-t', $API_IMAGE, '-t', $API_IMAGE_LATEST, '.')

# 2. Subir imagen de API a Docker Hub
Write-Host ""
Write-Host "📤 [2/4] Subiendo imagen de API ($VERSION y latest) a Docker Hub..."
Invoke-Step docker @('push', $API_IMAGE)
Invoke-Step docker @('push', $API_IMAGE_LATEST)

# 3. Compilar imagen de Web (Next.js) para Linux x86_64 (VPS)
Write-Host ""
Write-Host "📦 [3/4] Compilando imagen de Web ($WEB_IMAGE) para linux/amd64..."
Invoke-Step docker @('build', '--platform', 'linux/amd64', '-f', 'apps/web/Dockerfile', '-t', $WEB_IMAGE, '-t', $WEB_IMAGE_LATEST, '.')

# 4. Subir imagen de Web a Docker Hub
Write-Host ""
Write-Host "📤 [4/4] Subiendo imagen de Web ($VERSION y latest) a Docker Hub..."
Invoke-Step docker @('push', $WEB_IMAGE)
Invoke-Step docker @('push', $WEB_IMAGE_LATEST)

# 5. Opcional: Disparar Webhook de Portainer si está configurado
if ($env:PORTAINER_WEBHOOK_URL) {
    Write-Host ""
    Write-Host "⚡ [Opcional] Disparando Webhook de Portainer para auto-despliegue..."
    try {
        Invoke-RestMethod -Method Post -Uri $env:PORTAINER_WEBHOOK_URL | Out-Null
    } catch {
        Write-Host "⚠️ No se pudo notificar al Webhook de Portainer. Por favor realiza el redeploy manual." -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "=========================================================================="
Write-Host "🎉 ¡PROCESO COMPLETADO EXITOSAMENTE!" -ForegroundColor Green
Write-Host "   - API publicada: $API_IMAGE"
Write-Host "   - WEB publicada: $WEB_IMAGE"
Write-Host ""
Write-Host "🔒 NOTA SOBRE LA BASE DE DATOS (DB):"
Write-Host "   Este script NO toca ni modifica el contenedor de MariaDB (DB)."
Write-Host "   Los datos de la DB residen seguros en el volumen 'proyecto_kidsfun_db_data'."
Write-Host ""
Write-Host "👉 Siguiente paso en Portainer:"
Write-Host "   1. En Portainer, ve a tu Stack y presiona 'Update the stack' / 'Redeploy'."
Write-Host "      (Docker solo actualizará 'api' y 'web', manteniendo 'db' corriendo sin interrupciones)."
Write-Host "   2. O en Containers/Services, actualiza/recrea únicamente 'api' y 'web'."
Write-Host "=========================================================================="
