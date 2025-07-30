#!/usr/bin/env python
"""
Script simplificado para probar Gmail
"""
import os
import sys
import django

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'smap_project.settings')
django.setup()

from django.core.mail import send_mail
from django.conf import settings

def test_gmail():
    """Prueba el envío de correo con Gmail"""
    
    print("🧪 Probando configuración de Gmail...")
    print(f"📧 Email configurado: {settings.EMAIL_HOST_USER}")
    print(f"🔧 Host: {settings.EMAIL_HOST}")
    print(f"🔧 Puerto: {settings.EMAIL_PORT}")
    print(f"🔧 TLS: {settings.EMAIL_USE_TLS}")
    print("-" * 50)
    
    # Email de prueba (cambia esto por tu email)
    test_email = input("Ingresa tu email para la prueba: ").strip()
    
    if not test_email:
        print("❌ No se proporcionó email de prueba")
        return False
    
    try:
        # Enviar correo de prueba
        print("📤 Enviando correo de prueba...")
        
        subject = "Prueba de Gmail - KidsFun"
        message = """
        Hola,
        
        Este es un correo de prueba para verificar que la configuración de Gmail funciona correctamente.
        
        Si recibes este correo, significa que:
        ✅ La configuración de Gmail está correcta
        ✅ La contraseña de aplicación funciona
        ✅ El sistema de correos está listo
        
        Saludos,
        El equipo de KidsFun
        """
        
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[test_email],
            fail_silently=False,
        )
        
        print("✅ ¡Correo enviado exitosamente!")
        print(f"📧 Revisa tu bandeja de entrada: {test_email}")
        print("🎉 La configuración de Gmail está funcionando correctamente")
        
        return True
        
    except Exception as e:
        print(f"❌ Error enviando correo: {str(e)}")
        print("\n🔧 Posibles soluciones:")
        print("1. Verifica que la contraseña de aplicación sea correcta")
        print("2. Asegúrate de que la verificación en dos pasos esté activada")
        print("3. Confirma que el email esté correctamente escrito")
        print("4. Revisa que no haya espacios extra en la contraseña")
        
        return False

if __name__ == "__main__":
    test_gmail() 