#!/bin/bash

# --- CONFIGURACIÓN ---
VPS_IP="66.179.82.132"
# Ruta de tu carpeta media en la MAC (Ajusta si es necesario)
LOCAL_MEDIA_PATH="$(pwd)/media"

# Configuración del Contenedor
CONTAINER_NAME="kidsfun-web-1"
# ⚠️ IMPORTANTE: Esta ruta debe ser la que confirmamos en el Paso 1
REMOTE_CONTAINER_PATH="/app/media" 

# Colores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

clear
echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}   📸 UPLOADER MEDIA -> KIDSFUN DJANGO   ${NC}"
echo -e "${BLUE}=========================================${NC}"
echo ""

# 1. VERIFICACIONES
if [ ! -d "$LOCAL_MEDIA_PATH" ]; then
    echo -e "${RED}❌ Error: No encuentro la carpeta local:${NC} $LOCAL_MEDIA_PATH"
    exit 1
fi

echo -e "${YELLOW}Resumen de la operación:${NC}"
echo -e "   📂 Origen (Mac):      $LOCAL_MEDIA_PATH"
echo -e "   🐳 Destino (Docker):  $CONTAINER_NAME:$REMOTE_CONTAINER_PATH"
echo ""
read -p "¿Estás seguro de subir las imágenes? (y/n): " CONFIRM
if [[ ! "$CONFIRM" =~ ^[Yy]$ ]]; then
    echo "Cancelado."; exit 0
fi

# 2. FASE A: Subir al VPS (Carpeta Temporal)
echo ""
echo -e "${BLUE}🚀 Paso 1/3: Subiendo archivos al VPS (Temporal)...${NC}"
TEMP_REMOTE_DIR="/root/temp_kidsfun_media"

# Borramos temp anterior por si acaso y la creamos
ssh root@$VPS_IP "rm -rf $TEMP_REMOTE_DIR && mkdir -p $TEMP_REMOTE_DIR"

# Rsync de Mac -> VPS (Solo sube lo nuevo)
rsync -azhP \
    --exclude '.DS_Store' \
    "$LOCAL_MEDIA_PATH/" \
    "root@$VPS_IP:$TEMP_REMOTE_DIR/"

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Error al subir al VPS.${NC}"; exit 1
fi

# 3. FASE B: Inyectar al Contenedor
echo ""
echo -e "${BLUE}🐳 Paso 2/3: Moviendo archivos dentro del Contenedor...${NC}"

# Comando mágico: Copia del VPS (Host) -> Adentro del Contenedor
ssh root@$VPS_IP "docker cp $TEMP_REMOTE_DIR/. $CONTAINER_NAME:$REMOTE_CONTAINER_PATH/"

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Error al copiar dentro del contenedor. Verifica la ruta REMOTE_CONTAINER_PATH.${NC}"
    exit 1
fi

# 4. FASE C: Limpieza y Permisos
echo ""
echo -e "${BLUE}🧹 Paso 3/3: Limpiando y ajustando permisos...${NC}"

# Borrar carpeta temporal en VPS
ssh root@$VPS_IP "rm -rf $TEMP_REMOTE_DIR"

# Ajustar permisos dentro del contenedor para que Django pueda leerlos
# (Ajusta 'root:root' si tu Django corre con otro usuario, pero root suele funcionar para leer)
ssh root@$VPS_IP "docker exec $CONTAINER_NAME chmod -R 755 $REMOTE_CONTAINER_PATH"

echo ""
echo -e "${GREEN}✅ ¡Imágenes subidas correctamente a KidsFun!${NC}"
echo -e "Prueba recargar la web para ver si aparecen."
