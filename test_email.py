#!/usr/bin/env python
"""
Script de prueba para verificar el envío de correos electrónicos
"""
import os
import sys
import django

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'smap_project.settings')
django.setup()

from t_app_product.utils import send_welcome_email, send_notification_email

def test_email_sending():
    """Prueba el envío de correos electrónicos"""
    
    # Email de prueba (cambia por tu email real)
    test_email = "tu_email@gmail.com"  # CAMBIA ESTO
    
    print("🧪 Probando envío de correos electrónicos...")
    print(f"📧 Email de prueba: {test_email}")
    print("-" * 50)
    
    # Prueba 1: Correo de bienvenida
    print("1. Probando correo de bienvenida...")
    success1 = send_welcome_email(
        user_email=test_email,
        user_name="Usuario de Prueba"
    )
    
    if success1:
        print("✅ Correo de bienvenida enviado correctamente")
    else:
        print("❌ Error enviando correo de bienvenida")
    
    print("-" * 30)
    
    # Prueba 2: Correo de notificación
    print("2. Probando correo de notificación...")
    success2 = send_notification_email(
        user_email=test_email,
        subject="Prueba de Sistema - KidsFun",
        message="Este es un correo de prueba para verificar que el sistema de correos funciona correctamente."
    )
    
    if success2:
        print("✅ Correo de notificación enviado correctamente")
    else:
        print("❌ Error enviando correo de notificación")
    
    print("-" * 50)
    
    if success1 and success2:
        print("🎉 ¡Todas las pruebas pasaron! El sistema de correos funciona correctamente.")
    else:
        print("⚠️  Algunas pruebas fallaron. Revisa la configuración de correos.")
    
    return success1 and success2

if __name__ == "__main__":
    # Verificar que se proporcione un email de prueba
    if len(sys.argv) > 1:
        test_email = sys.argv[1]
        print(f"Usando email de prueba: {test_email}")
    else:
        print("⚠️  No se proporcionó email de prueba.")
        print("Uso: python test_email.py tu_email@gmail.com")
        print("O edita el script y cambia la variable test_email")
        sys.exit(1)
    
    test_email_sending() 