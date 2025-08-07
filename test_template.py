#!/usr/bin/env python
import os
import django

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'smap_project.settings')
django.setup()

from django.template.loader import render_to_string

def test_template():
    print("Probando template service.html...")
    try:
        context = {
            'products_or_category': {
                'option1': [
                    {
                        'id': 1,
                        'title': 'Test Product',
                        'img': None,
                        'dimensions': '10x10',
                        'likes_count': 0,
                        'comments_count': 0,
                        'get_category_display': lambda: 'Bounce House'
                    }
                ]
            }
        }
        rendered = render_to_string('kidsfun_web/service/service.html', context)
        print("Template renderizado correctamente")
        return True
    except Exception as e:
        print(f"Error renderizando template: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    test_template() 