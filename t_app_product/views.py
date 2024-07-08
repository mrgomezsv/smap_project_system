import os

from django.db.models import Q
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.forms import AuthenticationForm
from django.contrib.auth.models import User
from django.contrib.auth import login, logout, authenticate
from django.db import IntegrityError
from .forms import ProductForm, CustomUserCreationForm
from .models import Product, ProductImage, ProductVideo
from django.contrib.auth.decorators import login_required, user_passes_test
from django.http import HttpResponse
from firebase_admin import auth
from datetime import datetime


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

            # Guardar imágenes adicionales si se proporcionan
            for i in range(1, 6):
                image_field = request.FILES.get(f'img{i}')
                if image_field:
                    ProductImage.objects.create(product=new_product, image=image_field)

            # Guardar video de YouTube si se proporciona
            youtube_url = request.POST.get('youtube_url')
            if youtube_url:
                ProductVideo.objects.create(product=new_product, youtube_url=youtube_url)

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
        additional_images = ProductImage.objects.filter(product=product)

        # Obtiene los videos de YouTube del producto
        videos = ProductVideo.objects.filter(product=product)

        # Renderiza la página de detalle del producto con el formulario, el producto, las imágenes adicionales y los videos
        return render(request, 'product/product_detail.html',
                      {'product': product, 'form': form, 'additional_images': additional_images, 'videos': videos})
    else:
        try:
            # Obtiene el producto con el ID dado, sin importar el usuario
            product = get_object_or_404(Product, pk=product_id)

            # Guarda los detalles del formulario en la base de datos
            form = ProductForm(request.POST, request.FILES, instance=product)

            if form.is_valid():
                # Si se proporciona una nueva imagen principal, maneja la eliminación de la imagen anterior
                if 'img' in request.FILES:
                    old_image_path = product.img.path
                    if os.path.exists(old_image_path):
                        os.remove(old_image_path)

                # Guarda el formulario
                form.save()

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
            creation_timestamp = datetime.fromtimestamp(user.user_metadata.creation_timestamp / 1000)
            last_sign_in_timestamp = datetime.fromtimestamp(user.user_metadata.last_sign_in_timestamp / 1000)

            processed_data.append({
                'uid': user.uid,
                'email': user.email,
                'display_name': user.display_name,
                'phone_number': user.phone_number,
                'photo_url': user.photo_url,
                'provider_id': user.provider_id,
                'creation_timestamp': creation_timestamp,
                'last_sign_in_timestamp': last_sign_in_timestamp
            })

        # Verificar si hay más páginas y procesarlas
        while page.has_next_page:
            page = auth.list_users(page.next_page_token)
            for user in page.users:
                creation_timestamp = datetime.fromtimestamp(user.user_metadata.creation_timestamp / 1000)
                last_sign_in_timestamp = datetime.fromtimestamp(user.user_metadata.last_sign_in_timestamp / 1000)

                processed_data.append({
                    'uid': user.uid,
                    'email': user.email,
                    'display_name': user.display_name,
                    'phone_number': user.phone_number,
                    'photo_url': user.photo_url,
                    'provider_id': user.provider_id,
                    'creation_timestamp': creation_timestamp,
                    'last_sign_in_timestamp': last_sign_in_timestamp
                })

        # Ordenar la lista por last_sign_in_timestamp descendente
        processed_data.sort(key=lambda x: x['last_sign_in_timestamp'], reverse=True)

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
        products = Product.objects.all()  # Selecciona todos los productos

        if query:
            products = products.filter(Q(title__icontains=query) | Q(description__icontains=query))
        if category:
            products = products.filter(category=category)
    else:
        products = Product.objects.all()  # Muestra todos los productos si no hay consulta

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
