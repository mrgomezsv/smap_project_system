#!/usr/bin/env python3
"""
Script para verificar la configuración de codificación de la base de datos PostgreSQL
"""

import os
import sys
import django
from pathlib import Path

# Configurar Django
BASE_DIR = Path(__file__).resolve().parent
sys.path.append(str(BASE_DIR))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'smap_project.settings')
django.setup()

from django.db import connection


def check_database_encoding():
    """Verifica la configuración de codificación de la base de datos"""
    print("🔍 Verificando configuración de codificación de la base de datos...")
    print("=" * 60)
    
    try:
        with connection.cursor() as cursor:
            # Verificar codificación del cliente
            cursor.execute("SHOW client_encoding;")
            client_encoding = cursor.fetchone()[0]
            print(f"📝 Codificación del cliente: {client_encoding}")
            
            # Verificar codificación del servidor
            cursor.execute("SHOW server_encoding;")
            server_encoding = cursor.fetchone()[0]
            print(f"🖥️  Codificación del servidor: {server_encoding}")
            
            # Verificar codificación de la base de datos
            cursor.execute("SELECT datname, pg_encoding_to_char(encoding) FROM pg_database WHERE datname = current_database();")
            db_encoding = cursor.fetchone()
            if db_encoding:
                print(f"🗄️  Codificación de la base de datos '{db_encoding[0]}': {db_encoding[1]}")
            
            # Verificar configuración de locale
            cursor.execute("SHOW lc_collate;")
            lc_collate = cursor.fetchone()[0]
            print(f"🌍 Locale collate: {lc_collate}")
            
            cursor.execute("SHOW lc_ctype;")
            lc_ctype = cursor.fetchone()[0]
            print(f"🔤 Locale ctype: {lc_ctype}")
            
            # Verificar si hay comentarios con caracteres problemáticos
            cursor.execute("""
                SELECT COUNT(*) FROM t_app_product_comment 
                WHERE comment ~ '[^\x00-\x7F\u00A0-\uFFFF]' 
                   OR comment ~ '[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]';
            """)
            problematic_comments = cursor.fetchone()[0]
            print(f"⚠️  Comentarios con caracteres problemáticos: {problematic_comments}")
            
            if problematic_comments > 0:
                print("\n🔧 RECOMENDACIONES:")
                print("1. Ejecutar: python manage.py clean_comments --dry-run")
                print("2. Revisar comentarios problemáticos")
                print("3. Ejecutar: python manage.py clean_comments")
            
            print("\n✅ Verificación completada")
            
    except Exception as e:
        print(f"❌ Error al verificar la base de datos: {e}")
        return False
    
    return True


def check_django_settings():
    """Verifica la configuración de Django"""
    print("\n🔍 Verificando configuración de Django...")
    print("=" * 60)
    
    try:
        from django.conf import settings
        
        print(f"📝 DEFAULT_CHARSET: {getattr(settings, 'DEFAULT_CHARSET', 'No configurado')}")
        print(f"📄 FILE_CHARSET: {getattr(settings, 'FILE_CHARSET', 'No configurado')}")
        
        # Verificar configuración de base de datos
        db_config = settings.DATABASES['default']
        print(f"🗄️  Motor de BD: {db_config['ENGINE']}")
        
        if 'OPTIONS' in db_config:
            options = db_config['OPTIONS']
            print(f"⚙️  Opciones de BD:")
            for key, value in options.items():
                print(f"    {key}: {value}")
        else:
            print("⚙️  No hay opciones específicas de BD configuradas")
        
        print("✅ Verificación de Django completada")
        
    except Exception as e:
        print(f"❌ Error al verificar Django: {e}")
        return False
    
    return True


if __name__ == "__main__":
    print("🚀 Iniciando verificación de codificación...")
    print()
    
    success = True
    success &= check_django_settings()
    success &= check_database_encoding()
    
    print("\n" + "=" * 60)
    if success:
        print("🎉 Todas las verificaciones completadas exitosamente")
    else:
        print("⚠️  Algunas verificaciones fallaron")
    
    print("\n💡 Para limpiar comentarios problemáticos:")
    print("   python manage.py clean_comments --dry-run")
    print("   python manage.py clean_comments")
