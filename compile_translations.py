#!/usr/bin/env python3
"""
Script para compilar las traducciones de Django
"""

import os
import subprocess
import sys
from pathlib import Path

def compile_translations():
    """Compilar todas las traducciones"""
    print("🔧 Compilando traducciones de Django...")
    
    # Directorio base del proyecto
    base_dir = Path(__file__).resolve().parent
    locale_dir = base_dir / 'locale'
    
    if not locale_dir.exists():
        print("❌ Directorio locale no encontrado")
        return False
    
    success = True
    
    # Compilar traducciones para cada idioma
    for lang_dir in locale_dir.iterdir():
        if lang_dir.is_dir() and lang_dir.name in ['es', 'en']:
            lc_messages_dir = lang_dir / 'LC_MESSAGES'
            if lc_messages_dir.exists():
                po_file = lc_messages_dir / 'django.po'
                mo_file = lc_messages_dir / 'django.mo'
                
                if po_file.exists():
                    print(f"📝 Compilando {lang_dir.name}...")
                    
                    try:
                        # Usar msgfmt para compilar .po a .mo
                        result = subprocess.run([
                            'msgfmt', 
                            str(po_file), 
                            '-o', str(mo_file)
                        ], capture_output=True, text=True)
                        
                        if result.returncode == 0:
                            print(f"✅ {lang_dir.name} compilado exitosamente")
                        else:
                            print(f"❌ Error compilando {lang_dir.name}: {result.stderr}")
                            success = False
                            
                    except FileNotFoundError:
                        print(f"⚠️  msgfmt no encontrado. Instalando gettext...")
                        
                        # Intentar instalar gettext en macOS
                        try:
                            subprocess.run(['brew', 'install', 'gettext'], check=True)
                            print("✅ gettext instalado. Reintentando compilación...")
                            
                            result = subprocess.run([
                                'msgfmt', 
                                str(po_file), 
                                '-o', str(mo_file)
                            ], capture_output=True, text=True)
                            
                            if result.returncode == 0:
                                print(f"✅ {lang_dir.name} compilado exitosamente")
                            else:
                                print(f"❌ Error compilando {lang_dir.name}: {result.stderr}")
                                success = False
                                
                        except (subprocess.CalledProcessError, FileNotFoundError):
                            print(f"❌ No se pudo instalar gettext. Compilación manual requerida.")
                            success = False
                else:
                    print(f"⚠️  Archivo {po_file} no encontrado para {lang_dir.name}")
    
    if success:
        print("\n🎉 Todas las traducciones compiladas exitosamente")
        print("📁 Archivos .mo creados en:")
        for lang_dir in locale_dir.iterdir():
            if lang_dir.is_dir() and lang_dir.name in ['es', 'en']:
                mo_file = lang_dir / 'LC_MESSAGES' / 'django.mo'
                if mo_file.exists():
                    print(f"   - {mo_file}")
    else:
        print("\n⚠️  Algunas traducciones no se pudieron compilar")
        print("💡 Puedes compilar manualmente usando:")
        print("   msgfmt locale/es/LC_MESSAGES/django.po -o locale/es/LC_MESSAGES/django.mo")
        print("   msgfmt locale/en/LC_MESSAGES/django.po -o locale/en/LC_MESSAGES/django.mo")
    
    return success


def create_init_files():
    """Crear archivos __init__.py necesarios"""
    print("\n📁 Creando archivos __init__.py...")
    
    base_dir = Path(__file__).resolve().parent
    
    # Crear __init__.py en locale
    locale_dir = base_dir / 'locale'
    if locale_dir.exists():
        init_file = locale_dir / '__init__.py'
        if not init_file.exists():
            init_file.touch()
            print("✅ __init__.py creado en locale/")
    
    # Crear __init__.py en locale/es
    es_dir = locale_dir / 'es'
    if es_dir.exists():
        init_file = es_dir / '__init__.py'
        if not init_file.exists():
            init_file.touch()
            print("✅ __init__.py creado en locale/es/")
    
    # Crear __init__.py en locale/en
    en_dir = locale_dir / 'en'
    if en_dir.exists():
        init_file = en_dir / '__init__.py'
        if not init_file.exists():
            init_file.touch()
            print("✅ __init__.py creado en locale/en/")
    
    # Crear __init__.py en locale/es/LC_MESSAGES
    es_lc_dir = es_dir / 'LC_MESSAGES'
    if es_lc_dir.exists():
        init_file = es_lc_dir / '__init__.py'
        if not init_file.exists():
            init_file.touch()
            print("✅ __init__.py creado en locale/es/LC_MESSAGES/")
    
    # Crear __init__.py en locale/en/LC_MESSAGES
    en_lc_dir = en_dir / 'LC_MESSAGES'
    if en_lc_dir.exists():
        init_file = en_lc_dir / '__init__.py'
        if not init_file.exists():
            init_file.touch()
            print("✅ __init__.py creado en locale/en/LC_MESSAGES/")


if __name__ == "__main__":
    print("🚀 Iniciando proceso de traducciones...")
    
    # Crear archivos __init__.py
    create_init_files()
    
    # Compilar traducciones
    success = compile_translations()
    
    if success:
        print("\n🎯 Próximos pasos:")
        print("1. Reiniciar el servidor Django")
        print("2. Verificar que las traducciones funcionen en /service/")
        print("3. Cambiar el idioma del navegador para probar")
    else:
        print("\n⚠️  Algunos pasos requieren intervención manual")
    
    print("\n✨ Proceso completado")
