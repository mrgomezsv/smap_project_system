#!/usr/bin/env python
"""
Script de prueba para la nueva funcionalidad de waivers v2
"""
import os
import sys
import django
import requests
import json

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'smap_project.settings')
django.setup()

from waiver_v2.models import WaiverQRV2, WaiverDataV2
from django.utils import timezone

def test_waiver_v2_creation():
    """Prueba la creación de un waiver v2"""
    
    print("🧪 Probando creación de waiver v2...")
    print("=" * 60)
    
    # Datos de prueba
    test_data = {
        "user_id": "test_user_123",
        "user_name": "Juan Pérez",
        "user_email": "juan.perez@test.com",
        "relatives": [
            {
                "name": "María Pérez",
                "age": 8
            },
            {
                "name": "Carlos Pérez", 
                "age": 12
            }
        ]
    }
    
    try:
        # Crear waiver usando la API
        response = requests.post(
            'http://localhost:8000/api/v2/waiver/',
            json=test_data,
            headers={'Content-Type': 'application/json'}
        )
        
        if response.status_code == 201:
            result = response.json()
            print("✅ Waiver creado exitosamente!")
            print(f"📧 QR Code: {result['waiver']['qr_code']}")
            print(f"👤 Usuario: {result['waiver']['user_name']}")
            print(f"📅 Creado: {result['waiver']['created_at']}")
            print(f"⏰ Expira: {result['waiver']['expires_at']}")
            print(f"📊 Estado: {result['waiver']['status']}")
            print(f"📧 Email enviado: {result['email_sent']}")
            
            return result['waiver']['qr_code']
        else:
            print(f"❌ Error al crear waiver: {response.status_code}")
            print(f"Respuesta: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Error en la prueba: {str(e)}")
        return None

def test_waiver_validation(qr_code):
    """Prueba la validación de un waiver"""
    
    if not qr_code:
        print("❌ No hay QR code para validar")
        return
    
    print(f"\n🔍 Probando validación del waiver {qr_code}...")
    print("-" * 40)
    
    try:
        # Validar waiver usando la API
        response = requests.post(
            'http://localhost:8000/api/v2/waiver/validate/',
            json={'qr_code': qr_code},
            headers={'Content-Type': 'application/json'}
        )
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Validación exitosa!")
            print(f"📊 Válido: {result['valid']}")
            print(f"💬 Mensaje: {result['message']}")
            print(f"👤 Usuario: {result['waiver']['user_name']}")
            print(f"📊 Estado: {result['waiver']['status']}")
        else:
            print(f"❌ Error en validación: {response.status_code}")
            print(f"Respuesta: {response.text}")
            
    except Exception as e:
        print(f"❌ Error en la validación: {str(e)}")

def test_waiver_retrieval(qr_code):
    """Prueba la obtención de datos de un waiver"""
    
    if not qr_code:
        print("❌ No hay QR code para obtener")
        return
    
    print(f"\n📋 Probando obtención de datos del waiver {qr_code}...")
    print("-" * 40)
    
    try:
        # Obtener datos del waiver usando la API
        response = requests.get(
            f'http://localhost:8000/api/v2/waiver/{qr_code}/'
        )
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Datos obtenidos exitosamente!")
            print(f"📊 Válido: {result['is_valid']}")
            print(f"👤 Usuario: {result['waiver']['user_name']}")
            print(f"📧 Email: {result['waiver']['user_email']}")
            print(f"👥 Familiares: {len(result['waiver']['relatives'])}")
            
            for relative in result['waiver']['relatives']:
                print(f"  - {relative['relative_name']} ({relative['relative_age']} años)")
        else:
            print(f"❌ Error al obtener datos: {response.status_code}")
            print(f"Respuesta: {response.text}")
            
    except Exception as e:
        print(f"❌ Error al obtener datos: {str(e)}")

def test_user_waivers(user_id):
    """Prueba la obtención de todos los waivers de un usuario"""
    
    print(f"\n👤 Probando obtención de waivers del usuario {user_id}...")
    print("-" * 40)
    
    try:
        # Obtener waivers del usuario usando la API
        response = requests.get(
            f'http://localhost:8000/api/v2/waiver/user/{user_id}/'
        )
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Waivers obtenidos exitosamente!")
            print(f"📊 Total de waivers: {result['total_count']}")
            
            for i, waiver in enumerate(result['waivers'], 1):
                print(f"\n{i}. Waiver {waiver['qr_code']}:")
                print(f"   📅 Creado: {waiver['created_at']}")
                print(f"   ⏰ Expira: {waiver['expires_at']}")
                print(f"   📊 Estado: {waiver['status']}")
                print(f"   👥 Familiares: {len(waiver['relatives'])}")
        else:
            print(f"❌ Error al obtener waivers: {response.status_code}")
            print(f"Respuesta: {response.text}")
            
    except Exception as e:
        print(f"❌ Error al obtener waivers: {str(e)}")

def test_database_models():
    """Prueba los modelos directamente"""
    
    print("\n🗄️ Probando modelos de base de datos...")
    print("-" * 40)
    
    try:
        # Contar waivers en la base de datos
        waiver_count = WaiverQRV2.objects.count()
        print(f"📊 Total de waivers en BD: {waiver_count}")
        
        # Mostrar waivers activos
        active_waivers = WaiverQRV2.objects.filter(status='ACTIVE')
        print(f"✅ Waivers activos: {active_waivers.count()}")
        
        # Mostrar waivers inactivos
        inactive_waivers = WaiverQRV2.objects.filter(status='INACTIVE')
        print(f"❌ Waivers inactivos: {inactive_waivers.count()}")
        
        # Mostrar últimos 3 waivers
        recent_waivers = WaiverQRV2.objects.all()[:3]
        print(f"\n📋 Últimos 3 waivers:")
        for waiver in recent_waivers:
            print(f"  - {waiver.qr_code}: {waiver.user_name} ({waiver.status})")
            
    except Exception as e:
        print(f"❌ Error al consultar BD: {str(e)}")

def main():
    """Función principal de pruebas"""
    
    print("🚀 Iniciando pruebas de Waiver V2...")
    print("=" * 60)
    
    # Prueba 1: Crear waiver
    qr_code = test_waiver_v2_creation()
    
    if qr_code:
        # Prueba 2: Validar waiver
        test_waiver_validation(qr_code)
        
        # Prueba 3: Obtener datos del waiver
        test_waiver_retrieval(qr_code)
        
        # Prueba 4: Obtener waivers del usuario
        test_user_waivers("test_user_123")
    
    # Prueba 5: Consultar base de datos
    test_database_models()
    
    print("\n" + "=" * 60)
    print("🎉 Pruebas completadas!")

if __name__ == "__main__":
    main() 