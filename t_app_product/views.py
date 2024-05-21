import os

from django.db.models import Q
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.forms import UserCreationForm, AuthenticationForm
from django.contrib.auth.models import User
from django.contrib.auth import login, logout, authenticate
from django.db import IntegrityError
from .forms import ProductForm
from .models import Product
from django.contrib.auth.decorators import login_required, user_passes_test
from django.http import HttpResponse
from .forms import CustomUserCreationForm
from firebase_admin import auth


@login_required
def about_smap(request):
    return render(request, 'about_smap.html')


def signin(request):
    if request.method == 'GET':
        form = AuthenticationForm()
        return render(request, 'login/signin.html', {'form': form})
    else:
        form = AuthenticationForm(request, data=request.POST)
        if form.is_valid():
            username = form.cleaned_data.get('username')
            password = form.cleaned_data.get('password')
            user = authenticate(username=username, password=password)
            if user is not None:
                login(request, user)
                return redirect('product')  # Asegúrate de que 'product' esté definido en tus URLs
            else:
                error_message = 'Username or password is incorrect'
                return render(request, 'login/signin.html', {'form': form, 'error': error_message})
        else:
            return render(request, 'login/signin.html', {'form': form})


def signup(request):
    if request.method == "GET":
        return render(request, "login/signup.html", {"form": CustomUserCreationForm()})
    else:
        if request.POST["password1"] == request.POST["password2"]:
            try:
                user = User.objects.create_user(
                    username=request.POST["username"],
                    password=request.POST["password1"],
                    first_name=request.POST["first_name"],  # Agrega estos campos
                    last_name=request.POST["last_name"],  # Agrega estos campos
                    email=request.POST["email"],  # Agrega este campo
                )
                user.save()
                login(request, user)
                return redirect('home')  # Redirigir a 'home' después del inicio de sesión
            except IntegrityError:
                return render(
                    request,
                    "login/signup.html",
                    {"form": CustomUserCreationForm(), "error": "User already exists"},
                )
        else:
            return render(
                request,
                "login/signup.html",
                {"form": CustomUserCreationForm(), "error": "Passwords do not match"},
            )


@login_required
def product(request):
    query = request.GET.get('q')
    category = request.GET.get('category')

    # Filtrar productos por nombre, categoría y/o estado de publicación si hay consultas de búsqueda
    if query or category:
        products = Product.objects.all()  # Selecciona todos los productos

        if query:
            # Verificar si el texto de búsqueda contiene "publicado" o "creado"
            if "publicado" in query.lower():
                products = products.filter(publicated=True)
            elif "creado" in query.lower():
                products = products.filter(publicated=False)

            # Continuar con la búsqueda por título y descripción si no se encontraron coincidencias de estado
            else:
                products = products.filter(Q(title__icontains=query) | Q(description__icontains=query))

        if category:
            products = products.filter(category=category)  # Filtra por categoría

    else:
        products = Product.objects.all()  # Muestra todos los productos si no hay consulta

    return render(request, 'product/product.html', {'products': products})


@login_required
def create_product(request):
    if request.method == 'GET':
        return render(request, 'product/create_product.html', {'form': ProductForm()})
    else:
        try:
            form = ProductForm(request.POST, request.FILES)
            new_product = form.save(commit=False)
            new_product.user = request.user
            new_product.save()
            return redirect('product')
        except ValueError:
            return render(request, 'product/create_product.html', {
                'form': ProductForm(),
                'error': 'Please provide valid data'
            })


@login_required
def product_detail(request, product_id):
    if request.method == 'GET':
        # Obtiene el producto con el ID dado, sin importar el usuario
        product = get_object_or_404(Product, pk=product_id)

        # Crea un formulario para el producto
        form = ProductForm(instance=product)

        # Obtiene las imágenes adicionales del producto
        additional_images = [getattr(product, f'img{i}') for i in range(1, 6)]

        # Renderiza la página de detalle del producto con el formulario, el producto y las imágenes adicionales
        return render(request, 'product/product_detail.html',
                      {'product': product, 'form': form, 'additional_images': additional_images})
    else:
        try:
            # Obtiene el producto con el ID dado, sin importar el usuario
            product = get_object_or_404(Product, pk=product_id)

            # Guarda los detalles del formulario en la base de datos
            form = ProductForm(request.POST, request.FILES, instance=product)
            form.save()

            # Elimina la imagen antigua del directorio de destino si se actualizó la imagen
            old_image_path = product.img.path
            if 'img' in request.FILES:
                if os.path.exists(old_image_path):
                    os.remove(old_image_path)

            # Redirige al usuario a la página de productos después de guardar los cambios
            return redirect('product')
        except ValueError:
            # Si ocurre algún error, muestra un mensaje de error en la página de detalle del producto
            return render(request, 'product/product_detail.html',
                          {'product': product, 'form': form, 'error': "Error updating product"})


@login_required
def delete_product(request, product_id):
    # Obtiene el producto con el ID dado, sin importar el usuario
    product = get_object_or_404(Product, pk=product_id)

    if request.method == 'POST':
        # Guarda las rutas de las imágenes antes de eliminar el producto
        image_paths = [product.img.path]  # Agrega la imagen principal a la lista

        # Agrega las rutas de las imágenes adicionales
        for i in range(1, 6):
            image_field = getattr(product, f'img{i}')
            if image_field:
                image_paths.append(image_field.path)

        product.delete()

        # Elimina todas las imágenes del directorio de destino
        for image_path in image_paths:
            if os.path.exists(image_path):
                os.remove(image_path)

        return redirect('product')


@login_required
def signout(request):
    logout(request)
    return redirect('home')


@login_required
def push_notification(request):
    return render(request, 'push_notification.html')


@login_required
def services(request):
    # Lógica de la vista aquí
    return render(request, 'services.html')


@login_required
def advance_payments(request):
    # Lógica de la vista aquí
    return render(request, 'advance_payments.html')


@login_required
def firebase_auth(request):
    # Función para obtener los usuarios de Firebase
    def get_firebase_users():
        # Obtener la primera página de usuarios
        page = auth.list_users()

        # Procesar los usuarios de la página actual
        processed_data = []
        for user in page.users:
            processed_data.append({
                'uid': user.uid,
                'email': user.email,
                'display_name': user.display_name,
                'phone_number': user.phone_number,
                'photo_url': user.photo_url,
                'provider_id': user.provider_id,
                'creation_timestamp': user.user_metadata.creation_timestamp / 1000,  # Convertir a segundos
                'last_sign_in_timestamp': user.user_metadata.last_sign_in_timestamp / 1000  # Convertir a segundos
            })

        # Verificar si hay más páginas y procesarlas
        while page.has_next_page:
            page = auth.list_users(page.next_page_token)
            for user in page.users:
                processed_data.append({
                    'uid': user.uid,
                    'email': user.email,
                    'display_name': user.display_name,
                    'phone_number': user.phone_number,
                    'photo_url': user.photo_url,
                    'provider_id': user.provider_id,
                    'creation_timestamp': user.user_metadata.creation_timestamp / 1000,  # Convertir a segundos
                    'last_sign_in_timestamp': user.user_metadata.last_sign_in_timestamp / 1000  # Convertir a segundos
                })

        return processed_data

    # Obtener usuarios de Firebase
    users = get_firebase_users()

    # Enviar los datos al template
    return render(request, 'firebase_auth.html', {'users': users})


@login_required
def ticket_master(request):
    # Lógica de la vista aquí
    return render(request, 'ticket_master.html')


@login_required
def disclaimer(request):
    # Lógica de la vista aquí
    return render(request, 'disclaimer.html')


@login_required
def redirect_productc(request):
    return render(request, 'product/productc.html')


@login_required
def process_checkbox(request):
    if request.method == 'POST':
        checkbox_state = request.POST.get('checkbox_state')
        print("El estado del checkbox es:", checkbox_state)

        if checkbox_state == 'true':
            # Redirige a la nueva página HTML
            return redirect('productc')
        else:
            # Redirige a product.html si el checkbox está marcado como false
            print("Redirigiendo a product.html")
            return redirect('product')
    else:
        return HttpResponse("Método de solicitud no válido.")


@login_required
def productc(request):
    query = request.GET.get('q')
    category = request.GET.get('category')

    # Filtrar productos por nombre y/o categoría si hay consultas de búsqueda
    if query or category:
        # products = Product.objects.filter(user=request.user)  # Comentario: Se elimina la filtración por usuario
        products = Product.objects.all()  # Comentario: Se seleccionan todos los productos

        if query:
            products = products.filter(Q(title__icontains=query) | Q(description__icontains=query))
        if category:
            products = products.filter(category=category)
    else:
        # Si no hay consulta, mostrar todos los productos del usuario
        # products = Product.objects.filter(user=request.user)  # Comentario: Se elimina la filtración por usuario
        products = Product.objects.all()  # Comentario: Se seleccionan todos los productos

    # Agrupar productos por categoría
    categorized_products = {}
    for product in products:
        if product.category not in categorized_products:
            categorized_products[product.category] = []
        categorized_products[product.category].append(product)

    return render(request, 'product/productc.html', {'products': categorized_products})


def is_mrgomez(user):
    return user.username == 'mrgomez'


@login_required
@user_passes_test(is_mrgomez)
def sudo_admin(request):
    users = User.objects.all()
    return render(request, 'sudo/sudo_admin.html', {'users': users})
