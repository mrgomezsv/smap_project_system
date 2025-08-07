#!/usr/bin/env python
import os
import django

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'smap_project.settings')
django.setup()

from django.test import RequestFactory
from kidsfun_web.views import service

def test_service_view():
    print("Probando vista service...")
    try:
        rf = RequestFactory()
        request = rf.get('/service/')
        response = service(request)
        print("Vista service funciona correctamente")
        print(f"Status code: {response.status_code}")
        return True
    except Exception as e:
        print(f"Error en vista service: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    test_service_view() 