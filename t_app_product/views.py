import os

from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.forms import UserCreationForm, AuthenticationForm
from django.contrib.auth.models import User
from django.contrib.auth import login, logout, authenticate
from django.db import IntegrityError
from .forms import ProductForm
from .models import Product
from django.contrib.auth.decorators import login_required

@login_required
def home(request):
    return render(request, 'home.html')

def signup(request):
    if request.method == "GET":
        return render(request, "signup.html", {"form": UserCreationForm()})
    else:
        if request.POST["password1"] == request.POST["password2"]:
            try:
                user = User.objects.create_user(
                    username=request.POST["username"],
                    password=request.POST["password1"],
                )
                user.save()
                login(request, user)
                return redirect('home')  # Redirigir a 'home' después del inicio de sesión
            except IntegrityError:
                return render(
                    request,
                    "signup.html",
                    {"form": UserCreationForm(), "error": "User already exists"},
                )
        else:
            return render(
                request,
                "signup.html",
                {"form": UserCreationForm(), "error": "Passwords do not match"},
            )

@login_required
def product(request):
    products = Product.objects.filter(user=request.user)
    return render(request, 'product.html', {'products': products})

@login_required
def create_product(request):
    if request.method == 'GET':
        return render(request, 'create_product.html', {'form': ProductForm()})
    else:
        try:
            form = ProductForm(request.POST, request.FILES)
            new_product = form.save(commit=False)
            new_product.user = request.user
            new_product.save()
            return redirect('product')
        except ValueError:
            return render(request, 'create_product.html', {
                'form': ProductForm(),
                'error': 'Please provide valid data'
            })

@login_required
def product_detail(request, product_id):
    if request.method == 'GET':
        # Obtiene el producto con el ID dado, si existe y pertenece al usuario actual
        product = get_object_or_404(Product, pk=product_id, user=request.user)

        # Crea un formulario para el producto
        form = ProductForm(instance=product)

        # Obtiene las imágenes adicionales del producto
        additional_images = [getattr(product, f'img{i}') for i in range(1, 6)]

        # Renderiza la página de detalle del producto con el formulario, el producto y las imágenes adicionales
        return render(request, 'product_detail.html', {'product': product, 'form': form, 'additional_images': additional_images})
    else:
        try:
            # Obtiene el producto con el ID dado, si existe y pertenece al usuario actual
            product = get_object_or_404(Product, pk=product_id, user=request.user)

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
            return render(request, 'product_detail.html',
                          {'product': product, 'form': form, 'error': "Error updating product"})

@login_required
def delete_product(request, product_id):
    product = get_object_or_404(Product, pk=product_id, user=request.user)
    if request.method == 'POST':
        # Guarda la ruta de la imagen antes de eliminar el producto
        image_path = product.img.path  # Actualiza para usar el campo 'img'

        product.delete()

        # Elimina la imagen del directorio de destino
        if os.path.exists(image_path):
            os.remove(image_path)

        return redirect('product')


@login_required
def signout(request):
    logout(request)
    return redirect('home')


def signin(request):
    if request.method == 'GET':
        return render(request, 'signin.html', {'form': AuthenticationForm()})
    else:
        username = request.POST['username']
        password = request.POST['password']

        # Verificar si el usuario y la contraseña coinciden con los valores específicos
        if username == 'wletona' and password == 'Karin2100':
            return redirect('signup')  # Redirigir a signup.html si las credenciales son correctas
        else:
            # Autenticar al usuario normalmente si las credenciales no son las específicas
            user = authenticate(request, username=username, password=password)
            if user is not None:
                login(request, user)
                return redirect(
                    'product')  # Redirigir a la página de producto si el usuario es autenticado correctamente
            else:
                error_message = 'Username or password is incorrect'
                return render(request, 'signin.html', {'form': AuthenticationForm(), 'error': error_message})
