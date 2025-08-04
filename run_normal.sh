#!/bin/bash

# Script para ejecutar el proyecto con configuración completa
echo "🔧 Configurando proyecto para ejecución completa..."

# Activar entorno virtual
source venv/bin/activate

# Cambiar configuración a normal
sed -i '' 's/DJANGO_SETTINGS_MODULE.*/DJANGO_SETTINGS_MODULE = "smap_project.settings"/' manage.py

# Ejecutar migraciones
echo "📦 Ejecutando migraciones..."
python manage.py migrate

# Ejecutar servidor
echo "🚀 Iniciando servidor en http://localhost:8000"
python manage.py runserver 