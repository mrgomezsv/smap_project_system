# En kidsfun_web/views.py
from django.shortcuts import render
from t_app_product.models import Product  # Importa tu modelo de Producto

def home(request):
    return render(request, 'kidsfun_web/home/home.html')

def service(request):
    # Obtén solo los productos que están publicados
    productos = Product.objects.filter(publicated=True)

    # Imprimir los datos de los productos en la terminal
    for producto in productos:
        print(
            f"Nombre: {producto.title}, Descripción: {producto.description}, Precio: {producto.price}, Categoría: {producto.category}, Dimensiones: {producto.dimensions}, Usuario: {producto.user.username}")

    return render(request, 'kidsfun_web/service/service.html', {'productos': productos})

def contact(request):
    return render(request, 'kidsfun_web/contact/contact.html')
