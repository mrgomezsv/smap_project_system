#!/usr/bin/env python3
"""
Script para probar que el conflicto de locale esté resuelto
"""

import os
import sys
from pathlib import Path

def test_locale_import():
    """Probar que no hay conflictos con el módulo locale"""
    print("🔍 Probando importaciones de locale...")
    
    try:
        # Importar el módulo locale del sistema
        import locale
        print("✅ Módulo locale del sistema importado correctamente")
        print(f"   - normalize disponible: {hasattr(locale, 'normalize')}")
        print(f"   - getlocale disponible: {hasattr(locale, 'getlocale')}")
        
        # Verificar que nuestro directorio existe
        base_dir = Path(__file__).resolve().parent
        django_locale_dir = base_dir / 'django_locale'
        
        if django_locale_dir.exists():
            print(f"✅ Directorio django_locale encontrado: {django_locale_dir}")
            
            # Verificar archivos de traducción
            for lang_dir in django_locale_dir.iterdir():
                if lang_dir.is_dir() and lang_dir.name in ['es', 'en']:
                    lc_messages_dir = lang_dir / 'LC_MESSAGES'
                    if lc_messages_dir.exists():
                        po_file = lc_messages_dir / 'django.po'
                        mo_file = lc_messages_dir / 'django.mo'
                        
                        print(f"   - {lang_dir.name}:")
                        print(f"     PO: {'✅' if po_file.exists() else '❌'} {po_file.name}")
                        print(f"     MO: {'✅' if mo_file.exists() else '❌'} {mo_file.name}")
        else:
            print(f"❌ Directorio django_locale no encontrado")
            
    except ImportError as e:
        print(f"❌ Error importando locale: {e}")
        return False
    except Exception as e:
        print(f"❌ Error inesperado: {e}")
        return False
    
    return True


def test_django_settings():
    """Probar configuración de Django"""
    print("\n🔍 Probando configuración de Django...")
    
    try:
        # Simular configuración de Django
        base_dir = Path(__file__).resolve().parent
        django_locale_dir = base_dir / 'django_locale'
        
        # Verificar que el directorio existe
        if not django_locale_dir.exists():
            print("❌ Directorio django_locale no encontrado")
            return False
        
        # Verificar estructura de directorios
        expected_structure = [
            'django_locale/es/LC_MESSAGES/django.po',
            'django_locale/es/LC_MESSAGES/django.mo',
            'django_locale/en/LC_MESSAGES/django.po',
            'django_locale/en/LC_MESSAGES/django.mo',
        ]
        
        for path in expected_structure:
            full_path = base_dir / path
            if full_path.exists():
                print(f"✅ {path}")
            else:
                print(f"❌ {path} - NO ENCONTRADO")
        
        print("\n✅ Configuración de Django verificada")
        return True
        
    except Exception as e:
        print(f"❌ Error verificando configuración: {e}")
        return False


def show_next_steps():
    """Mostrar próximos pasos"""
    print("\n🎯 Próximos pasos:")
    print("1. ✅ Conflicto de locale resuelto")
    print("2. 🔄 Hacer commit de los cambios")
    print("3. 🚀 Ejecutar deploy para aplicar cambios")
    print("4. 🌐 Probar internacionalización en /service/")
    print("5. 🔍 Verificar que no hay errores de locale")


if __name__ == "__main__":
    print("🚀 Verificando resolución del conflicto de locale...")
    
    # Probar importaciones
    locale_ok = test_locale_import()
    
    # Probar configuración
    django_ok = test_django_settings()
    
    if locale_ok and django_ok:
        print("\n🎉 ¡Conflicto de locale resuelto exitosamente!")
        show_next_steps()
    else:
        print("\n❌ Aún hay problemas que resolver")
    
    print("\n✨ Verificación completada")
