#!/usr/bin/env bash
# Levanta todo el stack de Kidsfun Platform en local.
# Requisitos: Node 20+, pnpm 10+, MariaDB (o usar docker compose para solo DB)

set -e

cd "$(dirname "$0")/.."

echo "🚀 Kidsfun Platform — Local dev"
echo ""

# 1. Dependencias
if [ ! -d "node_modules" ]; then
  echo "📦 Instalando dependencias..."
  pnpm install
fi

# 2. Variables de entorno
if [ ! -f "apps/api/.env" ]; then
  echo "🔑 Creando apps/api/.env desde .env.example..."
  if [ -f "apps/api/.env.example" ]; then
    cp apps/api/.env.example apps/api/.env
  fi
fi

if [ ! -f "apps/web/.env.local" ]; then
  echo "🔑 Creando apps/web/.env.local desde .env.example..."
  if [ -f "apps/web/.env.example" ]; then
    cp apps/web/.env.example apps/web/.env.local 2>/dev/null || true
  fi
fi

# 3. Base de datos (opcional: usar docker compose solo-db)
if command -v docker &> /dev/null; then
  if ! nc -z localhost 3306 2>/dev/null; then
    echo "🗄️  MariaDB no detectada en :3306 — iniciando contenedor 'kidsfun-db'..."
    docker compose up -d db
    echo "⏳ Esperando que MariaDB esté lista (max 30s)..."
    for i in {1..30}; do
      if nc -z localhost 3306 2>/dev/null; then
        echo "✅ MariaDB lista"
        break
      fi
      sleep 1
    done
  else
    echo "✅ MariaDB ya corriendo en :3306"
  fi
else
  echo "⚠️  Docker no instalado. Asegúrate de tener MariaDB corriendo en :3306"
fi

# 4. Prisma
echo "🔄 Generando Prisma Client..."
cd apps/api
pnpm prisma generate --silent 2>/dev/null || true
cd ../..

# 5. Dev servers
echo ""
echo "✅ Todo listo. Iniciando API (3001) + Web (3000)..."
echo ""
echo "   Web pública:  http://localhost:3000"
echo "   Admin:        http://localhost:3000/admin/dashboard"
echo "   API:          http://localhost:3001"
echo "   Prisma GUI:   pnpm db:studio"
echo ""
echo "   Presiona Ctrl+C para detener"
echo ""

pnpm dev
