# En kidsfun_web/views.py
from django.shortcuts import render
from t_app_product.models import Product  # Importa tu modelo de Producto

def home(request):
    return render(request, 'kidsfun_web/home/home.html')

def service(request):
    # Obtener todos los productos que están publicados
    productos = Product.objects.filter(publicated=True)

    # Crear un diccionario para almacenar los productos agrupados por categoría
    productos_por_categoria = {}
    for producto in productos:
        categoria = producto.category
        if categoria not in productos_por_categoria:
            productos_por_categoria[categoria] = []
        productos_por_categoria[categoria].append(producto)

    return render(request, 'kidsfun_web/service/service.html', {'productos_por_categoria': productos_por_categoria})

def contact(request):
    return render(request, 'kidsfun_web/contact/contact.html')
