#!/bin/bash

# dev.sh - Script de automatización para desarrollo local de Kidsfun Django
# Este script levanta la BD en Docker y corre Django localmente en macOS.

set -e # Salir si hay errores

echo "🚀 Iniciando entorno de desarrollo para Kidsfun Django..."

# 1. Verificar Docker
if ! docker info >/dev/null 2>&1; then
    echo "❌ Error: Docker no parece estar corriendo. Por favor inicia Docker Desktop e intenta de nuevo."
    exit 1
fi

# 2. Levantar la base de datos si no está corriendo
echo "🔌 Verificando puerto 3307 para la base de datos..."
if lsof -Pi :3307 -sTCP:LISTEN -t >/dev/null ; then
    echo "✅ Base de datos ya activa en el puerto 3307."
else
    echo "📦 Levantando MariaDB en Docker (puerto 3307)..."
    docker compose up -d db
fi

# 3. Preparar Entorno Virtual (venv)
if [ ! -f "venv/bin/activate" ]; then
    echo "🐍 Creando o recreando entorno virtual..."
    rm -rf venv
    python3 -m venv venv
fi

echo "🔌 Activando entorno virtual..."
source venv/bin/activate

# 4. Actualizar pip e instalar dependencias
echo "🛠️ Instalando dependencias (esto puede tomar un momento)..."
./venv/bin/python -m pip install --upgrade pip
# Intentar instalar mysqlclient con optimización para macOS arm64
if [[ $(uname -m) == 'arm64' ]]; then
    export LDFLAGS="-L/opt/homebrew/opt/mariadb-connector-c/lib"
    export CPPFLAGS="-I/opt/homebrew/opt/mariadb-connector-c/include"
fi
./venv/bin/python -m pip install -r requirements.txt

# 5. Configurar variables de entorno para desarrollo local (.env.dev)
if [ ! -f ".env.dev" ]; then
    echo "📝 Generando .env.dev automático..."
    if [ -f ".env.local" ]; then
        cp .env.local .env.dev
        # Ajustar host y puerto para desarrollo fuera de Docker
        sed -i '' 's/DB_HOST=db/DB_HOST=127.0.0.1/' .env.dev
        sed -i '' 's/DB_PORT=3306/DB_PORT=3307/' .env.dev
        echo "✅ .env.dev creado a partir de .env.local (ajustado para 127.0.0.1:3307)"
    else
        echo "⚠️ .env.local no encontrado. Por favor crea un .env.dev manualmente."
        exit 1
    fi
fi

# 6. Exportar variables de entorno para que Django las vea
export ENV_FILE=.env.dev

# 7. Ejecutar migraciones
echo "📂 Ejecutando migraciones de base de datos..."
./venv/bin/python manage.py migrate

# 8. Iniciar el servidor
echo "🔥 Iniciando servidor de desarrollo en http://127.0.0.1:8000"
echo "💡 Usa Ctrl+C para detener el servidor."
./venv/bin/python manage.py runserver
