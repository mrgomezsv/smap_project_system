#!/bin/bash

# 🚀 Script de Instalación - Kidsfun Django Project
# Este script configura el entorno de desarrollo

echo "🎉 Bienvenido al setup de Kidsfun Django Project"
echo "================================================"

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para imprimir mensajes
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar si Python está instalado
print_status "Verificando Python..."
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version)
    print_success "Python encontrado: $PYTHON_VERSION"
else
    print_error "Python3 no está instalado. Por favor instala Python 3.8+"
    exit 1
fi

# Verificar si pip está instalado
print_status "Verificando pip..."
if command -v pip3 &> /dev/null; then
    print_success "pip encontrado"
else
    print_error "pip no está instalado. Por favor instala pip"
    exit 1
fi

# Crear entorno virtual
print_status "Creando entorno virtual..."
if [ ! -d "venv" ]; then
    python3 -m venv venv
    print_success "Entorno virtual creado"
else
    print_warning "El entorno virtual ya existe"
fi

# Activar entorno virtual
print_status "Activando entorno virtual..."
source venv/bin/activate
print_success "Entorno virtual activado"

# Actualizar pip
print_status "Actualizando pip..."
pip install --upgrade pip
print_success "pip actualizado"

# Instalar dependencias
print_status "Instalando dependencias..."
if [ -f "requirements.txt" ]; then
    pip install -r requirements.txt
    print_success "Dependencias instaladas"
else
    print_error "Archivo requirements.txt no encontrado"
    exit 1
fi

# Crear archivo .env si no existe
print_status "Configurando variables de entorno..."
if [ ! -f ".env" ]; then
    if [ -f "env.example" ]; then
        cp env.example .env
        print_success "Archivo .env creado desde env.example"
        print_warning "⚠️  IMPORTANTE: Edita el archivo .env con tus credenciales reales"
    else
        print_warning "Archivo env.example no encontrado. Crea manualmente el archivo .env"
    fi
else
    print_warning "El archivo .env ya existe"
fi

# Crear directorio de logs si no existe
print_status "Creando directorio de logs..."
mkdir -p logs
print_success "Directorio de logs creado"

# Crear directorio de media si no existe
print_status "Creando directorio de media..."
mkdir -p media
print_success "Directorio de media creado"

# Ejecutar migraciones
print_status "Ejecutando migraciones..."
python manage.py makemigrations
python manage.py migrate
print_success "Migraciones completadas"

# Crear superusuario
print_status "¿Deseas crear un superusuario? (y/n)"
read -r create_superuser
if [[ $create_superuser =~ ^[Yy]$ ]]; then
    python manage.py createsuperuser
    print_success "Superusuario creado"
fi

# Recolectar archivos estáticos
print_status "Recolectando archivos estáticos..."
python manage.py collectstatic --noinput
print_success "Archivos estáticos recolectados"

# Verificar configuración
print_status "Verificando configuración..."
python manage.py check
print_success "Configuración verificada"

# Mostrar información final
echo ""
echo "🎉 ¡Setup completado exitosamente!"
echo "=================================="
echo ""
echo "📋 Próximos pasos:"
echo "1. Edita el archivo .env con tus credenciales reales"
echo "2. Ejecuta: python manage.py runserver"
echo "3. Abre http://localhost:8000 en tu navegador"
echo ""
echo "🔧 Comandos útiles:"
echo "- Activar entorno virtual: source venv/bin/activate"
echo "- Ejecutar servidor: python manage.py runserver"
echo "- Crear migraciones: python manage.py makemigrations"
echo "- Aplicar migraciones: python manage.py migrate"
echo "- Crear superusuario: python manage.py createsuperuser"
echo ""
echo "📚 Documentación:"
echo "- Lee README_MEJORAS.md para más información"
echo "- Consulta la documentación de Django: https://docs.djangoproject.com/"
echo ""

# Verificar si el servidor debe iniciarse
print_status "¿Deseas iniciar el servidor de desarrollo? (y/n)"
read -r start_server
if [[ $start_server =~ ^[Yy]$ ]]; then
    print_status "Iniciando servidor de desarrollo..."
    python manage.py runserver
else
    print_success "Setup completado. Ejecuta 'python manage.py runserver' cuando estés listo."
fi 