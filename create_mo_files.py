#!/usr/bin/env python3
"""
Script alternativo para crear archivos .mo sin gettext
"""

import os
import struct
from pathlib import Path

def create_mo_file(po_file_path, mo_file_path):
    """Crear un archivo .mo básico desde .po"""
    try:
        with open(po_file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Parsear el archivo .po básicamente
        messages = {}
        current_msgid = None
        current_msgstr = None
        
        lines = content.split('\n')
        for line in lines:
            line = line.strip()
            if line.startswith('msgid "'):
                current_msgid = line[7:-1]  # Remover 'msgid "' y '"'
            elif line.startswith('msgstr "'):
                current_msgstr = line[8:-1]  # Remover 'msgstr "' y '"'
                if current_msgid and current_msgstr:
                    messages[current_msgid] = current_msgstr
                    current_msgid = None
                    current_msgstr = None
        
        # Crear archivo .mo básico
        # Formato simplificado del archivo .mo
        mo_content = b''
        
        # Header básico
        magic = 0x950412de
        revision = 0
        count = len(messages)
        offset_originals = 28
        offset_translations = offset_originals + count * 8
        offset_strings = offset_translations + count * 8
        
        # Escribir header
        mo_content += struct.pack('<IIIII', magic, revision, count, offset_originals, offset_translations)
        
        # Preparar strings
        all_strings = []
        string_offsets = {}
        
        # Agregar strings vacíos al inicio (requerido por el formato)
        all_strings.append(b'')
        string_offsets[''] = 0
        current_offset = 1
        
        # Agregar msgid y msgstr
        for msgid, msgstr in messages.items():
            if msgid not in string_offsets:
                all_strings.append(msgid.encode('utf-8'))
                string_offsets[msgid] = current_offset
                current_offset += len(msgid.encode('utf-8')) + 1
            
            if msgstr not in string_offsets:
                all_strings.append(msgstr.encode('utf-8'))
                string_offsets[msgstr] = current_offset
                current_offset += len(msgstr.encode('utf-8')) + 1
        
        # Calcular offsets finales
        final_strings_offset = offset_strings + count * 8
        
        # Escribir offsets de originals
        for msgid in messages.keys():
            length = len(msgid.encode('utf-8'))
            offset = final_strings_offset + sum(len(s) + 1 for s in all_strings[:string_offsets[msgid]])
            mo_content += struct.pack('<II', length, offset)
        
        # Escribir offsets de translations
        for msgstr in messages.values():
            length = len(msgstr.encode('utf-8'))
            offset = final_strings_offset + sum(len(s) + 1 for s in all_strings[:string_offsets[msgstr]])
            mo_content += struct.pack('<II', length, offset)
        
        # Escribir strings
        for string in all_strings:
            mo_content += string + b'\x00'
        
        # Escribir archivo .mo
        with open(mo_file_path, 'wb') as f:
            f.write(mo_content)
        
        return True
        
    except Exception as e:
        print(f"Error creando {mo_file_path}: {e}")
        return False


def main():
    """Función principal"""
    print("🔧 Creando archivos .mo alternativos...")
    
    base_dir = Path(__file__).resolve().parent
    locale_dir = base_dir / 'locale'
    
    if not locale_dir.exists():
        print("❌ Directorio locale no encontrado")
        return
    
    success_count = 0
    
    # Crear archivos .mo para cada idioma
    for lang_dir in locale_dir.iterdir():
        if lang_dir.is_dir() and lang_dir.name in ['es', 'en']:
            lc_messages_dir = lang_dir / 'LC_MESSAGES'
            if lc_messages_dir.exists():
                po_file = lc_messages_dir / 'django.po'
                mo_file = lc_messages_dir / 'django.mo'
                
                if po_file.exists():
                    print(f"📝 Creando {mo_file}...")
                    
                    if create_mo_file(po_file, mo_file):
                        print(f"✅ {mo_file} creado exitosamente")
                        success_count += 1
                    else:
                        print(f"❌ Error creando {mo_file}")
                else:
                    print(f"⚠️  Archivo {po_file} no encontrado")
    
    if success_count > 0:
        print(f"\n🎉 {success_count} archivos .mo creados exitosamente")
        print("📁 Archivos creados en:")
        for lang_dir in locale_dir.iterdir():
            if lang_dir.is_dir() and lang_dir.name in ['es', 'en']:
                mo_file = lang_dir / 'LC_MESSAGES' / 'django.mo'
                if mo_file.exists():
                    print(f"   - {mo_file}")
        
        print("\n🎯 Próximos pasos:")
        print("1. Reiniciar el servidor Django")
        print("2. Verificar que las traducciones funcionen en /service/")
        print("3. Cambiar el idioma del navegador para probar")
    else:
        print("\n❌ No se pudo crear ningún archivo .mo")
    
    print("\n✨ Proceso completado")


if __name__ == "__main__":
    main()
