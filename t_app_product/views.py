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

# Si quisiera filtrar que se muestren solo los productos creados correspondientes a cada usuario...!!!
# def product(request):
#     products = Product.objects.filter(user=request.user)
#     return render(request, 'product.html', {'products': products})

@login_required
def product(request):
    products = Product.objects.all()
    return render(request, 'product.html', {'products': products})

@login_required
def create_product(request):
    
    if request.method == 'GET':
        return render(request, 'create_product.html', {
        'form': ProductForm
        })
    else:
        try:
            form = ProductForm(request.POST)
            new_product = form.save(commit=False)
            new_product.user = request.user
            new_product.save()
            return redirect('product')
        except ValueError:
            return render(request, 'create_product.html', {
            'form': ProductForm,
            'error': 'Please provide valida data'
            })

@login_required
def product_detail(request, product_id):
    if request.method == 'GET':
        print(product_id)
        #product = Product.objects.get(pk=product_id)
        product = get_object_or_404(Product, pk=product_id)
        #product = get_object_or_404(Product, pk=product_id, user=request.user) #para buscar los productos solo de ese usuario
        form = ProductForm(instance=product)
        return render(request, 'product_detail.html', {'product': product, 'form': form})
    else:
        try:
            product = get_object_or_404(Product, pk=product_id)
            #product = get_object_or_404(Product, pk=product_id, user=request.user) #para buscar los productos solo de ese usuario
            form = ProductForm(request.POST, instance=product)
            form.save()
            return redirect('product')
        except ValueError:
            return render(request, 'product_detail.html', {'product': product, 'form': form, 'error': "Error updating product"})

@login_required
def delete_product(request, product_id):
    # product = get_object_or_404(Product, pk=product_id, user=request.user) #para eliminar productos solo de ese usuario
    product = get_object_or_404(Product, pk=product_id)
    if request.method == 'POST':
        product.delete()
        return redirect('product')

@login_required
def signout(request):
    logout(request)
    return redirect('home')

def signin(request):
    if request.method == 'GET':
        return render (request, 'signin.html', {
            'form': AuthenticationForm
        })
    else:
        user = authenticate(request, username=request.POST['username'], password=request.POST['password'])
    if user is None:
        return render (request, 'signin.html', {
            'form': AuthenticationForm,
            'error': 'Username or password is incorrect'
            })
    else:
        login(request, user)
        return redirect('product')
    