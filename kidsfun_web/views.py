# En kidsfun_web/views.py
from django.shortcuts import render, get_object_or_404
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


def service_product(request, product_id):
    # Obtener el producto correspondiente al product_id o mostrar una página 404 si no existe
    product = get_object_or_404(Product, pk=product_id)

    # Imprimir los datos del producto en la consola
    # print("Datos del producto:")
    # print("ID:", product.id)
    # print("Título:", product.title)
    # print("Descripción:", product.description)
    # print("Categoria:", product.category)
    # print("Dimensiones:", product.dimensions)
    # print("Usiario:", product.user.username)
    # Continúa imprimiendo cualquier otro dato que desees

    # Devolver la renderización de la plantilla con el producto
    return render(request, 'kidsfun_web/service/product/product.html', {'product': product})


def contact(request):
    return render(request, 'kidsfun_web/contact/contact.html')
