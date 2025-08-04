#!/bin/bash

# Script para ejecutar el proyecto en modo local sin APIs
echo "🔧 Configurando proyecto para ejecución local sin APIs..."

# Activar entorno virtual
source venv/bin/activate

# Cambiar configuración a local
sed -i '' 's/DJANGO_SETTINGS_MODULE.*/DJANGO_SETTINGS_MODULE = "smap_project.settings_local"/' manage.py

# Ejecutar migraciones
echo "📦 Ejecutando migraciones..."
python manage.py migrate

# Ejecutar servidor
echo "🚀 Iniciando servidor en http://localhost:8000"
python manage.py runserver 