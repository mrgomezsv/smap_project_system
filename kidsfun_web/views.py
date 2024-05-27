# En kidsfun_web/views.py
from django.shortcuts import render
from t_app_product.models import Product  # Importa tu modelo de product


def home(request):
    return render(request, 'kidsfun_web/home/home.html')


def service(request):
    # Obtener todos los products que están publicados
    products = Product.objects.filter(publicated=True)

    # Crear un diccionario para almacenar los products agrupados por categoría
    products_or_category = {}
    for product in products:
        # print(
        #     f"Nombre: {product.title}, Descripción: {product.description}, Precio: {product.price}, "
        #     f"Categoría: {product.category}, Dimensiones: {product.dimensions}, Usuario: {product.user.username}")
        category = product.category
        if category not in products_or_category:
            products_or_category[category] = []
        products_or_category[category].append(product)

    return render(request, 'kidsfun_web/service/service.html', {'products_or_category': products_or_category})


def service_product(request):
    return render(request, 'kidsfun_web/service/product/product.html')


def contact(request):
    return render(request, 'kidsfun_web/contact/contact.html')
