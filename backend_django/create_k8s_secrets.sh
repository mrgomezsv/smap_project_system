#!/bin/bash

# Script para crear los Secretos de Kubernetes necesarios

# 1. Crear el secreto para las credenciales de Firebase
# Asegurarse de que el archivo existe en la ruta actual
FIREBASE_JSON="credentials/smap-kf-firebase-adminsdk-xqq0l-dc3c83c990.json"

if [ -f "$FIREBASE_JSON" ]; then
    echo "Creando secreto firebase-credentials-secret..."
    kubectl create secret generic firebase-credentials-secret \
        --from-file=firebase-credentials.json="$FIREBASE_JSON" \
        --dry-run=client -o yaml | kubectl apply -f -
else
    echo "ERROR: No se encontró el archivo $FIREBASE_JSON"
fi

echo "Secreto de Firebase creado exitosamente."
