#!/usr/bin/env python
import os
import django

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'smap_project.settings')
django.setup()

from django.test import RequestFactory
from kidsfun_web.views import service
from t_app_product.models import Product

def test_service_view_complete():
    print("=== Prueba completa de la vista service ===")
    
    # Verificar productos en la base de datos
    total_products = Product.objects.count()
    published_products = Product.objects.filter(publicated=True).count()
    print(f"Total productos: {total_products}")
    print(f"Productos publicados: {published_products}")
    
    # Crear request
    rf = RequestFactory()
    request = rf.get('/service/')
    
    try:
        # Llamar a la vista
        response = service(request)
        print(f"Status code: {response.status_code}")
        
        # Verificar el contenido
        if hasattr(response, 'content'):
            content_length = len(response.content)
            print(f"Contenido generado: {content_length} bytes")
            
            # Verificar si hay errores en el contenido
            if b'error' in response.content.lower():
                print("⚠️  Se detectó la palabra 'error' en el contenido")
            
            if b'exception' in response.content.lower():
                print("⚠️  Se detectó la palabra 'exception' en el contenido")
        
        return True
        
    except Exception as e:
        print(f"❌ Error en vista service: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    test_service_view_complete() 