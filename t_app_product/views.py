import os
import json

from django.db.models import Q
from django.contrib.auth.forms import AuthenticationForm
from django.contrib.auth.models import User
from django.contrib.auth import login, logout, authenticate, update_session_auth_hash
from django.db import IntegrityError
from .forms import ProductForm, CustomPasswordChangeForm
from .models import Product
from django.contrib.auth.decorators import user_passes_test
from django.http import HttpResponse
from .forms import CustomUserCreationForm
from firebase_admin import auth
from datetime import datetime
from .models import Event
from .forms import EventForm
from django.views.decorators.csrf import csrf_protect
from django.contrib.auth.decorators import login_required
from django.shortcuts import get_object_or_404
from django.contrib import messages
from .models import WaiverDataDB, WaiverValidator
from .forms import WaiverValidatorForm
from django.shortcuts import render, redirect
from django.http import JsonResponse
from firebase_admin import messaging
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from .models import ChatAdministrator, ChatRoom, ChatMessage
import firebase_admin


@login_required
def about_smap(request):
    return render(request, 'about_smap.html')

@csrf_protect
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
                # Redirigir al dashboard de productos después del login exitoso
                return redirect('product')
            else:
                error_message = 'Usuario o contraseña incorrectos'
                return render(request, 'login/signin.html', {'form': form, 'error': error_message})
        else:
            error_message = 'Por favor, verifica tus credenciales'
            return render(request, 'login/signin.html', {'form': form, 'error': error_message})


def change_password(request):
    if request.method == 'POST':
        # Si el usuario está autenticado, usar el formulario normal
        if request.user.is_authenticated:
            form = CustomPasswordChangeForm(request.user, request.POST)
            if form.is_valid():
                user = form.save()
                # Actualizar la sesión para evitar que el usuario sea desconectado
                update_session_auth_hash(request, user)
                messages.success(request, '¡Tu contraseña ha sido cambiada exitosamente!')
                return redirect('home')
            else:
                messages.error(request, 'Por favor, corrige los errores a continuación.')
        else:
            # Si no está autenticado, mostrar formulario para cambiar por email
            email = request.POST.get('email')
            if email:
                try:
                    user = User.objects.get(email=email)
                    # Aquí podrías implementar un sistema de reset por email
                    messages.success(request, f'Se ha enviado un enlace de restablecimiento a {email}')
                    return redirect('signin')
                except User.DoesNotExist:
                    messages.error(request, 'No se encontró un usuario con ese email.')
            else:
                messages.error(request, 'Por favor, ingresa tu email.')
    else:
        if request.user.is_authenticated:
            form = CustomPasswordChangeForm(request.user)
        else:
            form = None
    
    return render(request, 'login/change_password.html', {'form': form})


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
                return redirect('product')  # Redirigir al dashboard de productos después del registro
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
        # Obtiene el producto con el ID dado
        product = get_object_or_404(Product, pk=product_id)

        # Crea un formulario para el producto
        form = ProductForm(instance=product)

        # Obtiene las imágenes adicionales del producto
        additional_images = [getattr(product, f'img{i}') for i in range(1, 6)]

        # Renderiza la página de detalle del producto
        return render(request, 'product/product_detail.html',
                      {'product': product, 'form': form, 'additional_images': additional_images})
    else:
        try:
            # Obtiene el producto con el ID dado
            product = get_object_or_404(Product, pk=product_id)

            # Crea un formulario con los datos del POST y las imágenes
            form = ProductForm(request.POST, request.FILES, instance=product)

            if form.is_valid():
                # Guarda el producto para acceder a las imágenes antiguas después
                old_product = Product.objects.get(pk=product_id)

                # Guarda el formulario para actualizar el producto
                form.save()

                # Verifica y elimina la imagen principal si ha sido reemplazada
                new_image = request.FILES.get('img')  # Ajusta el nombre del campo si es necesario
                old_image = old_product.img
                if new_image and old_image and old_image != new_image:
                    old_image_path = old_image.path
                    if os.path.exists(old_image_path):
                        os.remove(old_image_path)

                # Elimina las imágenes adicionales si hay nuevas imágenes proporcionadas
                for i in range(1, 6):
                    new_image = request.FILES.get(f'img{i}')
                    old_image = getattr(old_product, f'img{i}')
                    if new_image and old_image and old_image != new_image:
                        old_image_path = old_image.path
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
@csrf_exempt
def send_push_notification(request):
    if request.method == 'POST':
        title = request.POST.get('title')
        body = request.POST.get('body')
        user_token = request.POST.get('user')
        image = request.FILES.get('image')

        # Preparar la notificación
        message = messaging.Message(
            notification=messaging.Notification(
                title=title,
                body=body,
                image=image.url if image else None
            ),
            token=user_token,
        )

        try:
            # Enviar la notificación
            response = messaging.send(message)
            return JsonResponse({'success': True, 'message_id': response})
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)})

    return render(request, 'tu_template.html')  # Redirige a la página deseada después del POST


@login_required
def event(request):
    events = Event.objects.all()
    return render(request, 'event.html', {'events': events})

@login_required
def create_event(request):
    if request.method == 'POST':
        form = EventForm(request.POST)
        if form.is_valid():
            event = form.save(commit=False)
            event.organizer = request.user
            event.save()
            return redirect('event')
    else:
        form = EventForm()
    return render(request, 'event.html', {'form': form})


@login_required
def firebase_auth(request):
    try:
        # Función para obtener los usuarios de Firebase
        def get_firebase_users():
            # Verificar si Firebase está configurado
            if not firebase_admin._apps:
                return []
            
            try:
                # Obtener la primera página de usuarios
                page = auth.list_users()
            except Exception as e:
                # Si hay un error al listar usuarios, probablemente las credenciales no son válidas
                print(f"Error al listar usuarios de Firebase: {str(e)}")
                return []

            # Procesar los usuarios de la página actual
            processed_data = []
            for user in page.users:
                try:
                    creation_timestamp = datetime.fromtimestamp(user.user_metadata.creation_timestamp / 1000)
                    last_sign_in_timestamp = datetime.fromtimestamp(user.user_metadata.last_sign_in_timestamp / 1000)
                except:
                    creation_timestamp = datetime.now()
                    last_sign_in_timestamp = datetime.now()

                processed_data.append({
                    'uid': user.uid,
                    'email': user.email or 'N/A',
                    'display_name': user.display_name or 'N/A',
                    'phone_number': user.phone_number or 'N/A',
                    'photo_url': user.photo_url or 'N/A',
                    'provider_id': user.provider_id or 'N/A',
                    'creation_timestamp': creation_timestamp,
                    'last_sign_in_timestamp': last_sign_in_timestamp
                })

            # Verificar si hay más páginas y procesarlas
            while page.has_next_page:
                try:
                    page = auth.list_users(page.next_page_token)
                    for user in page.users:
                        try:
                            creation_timestamp = datetime.fromtimestamp(user.user_metadata.creation_timestamp / 1000)
                            last_sign_in_timestamp = datetime.fromtimestamp(user.user_metadata.last_sign_in_timestamp / 1000)
                        except:
                            creation_timestamp = datetime.now()
                            last_sign_in_timestamp = datetime.now()

                        processed_data.append({
                            'uid': user.uid,
                            'email': user.email or 'N/A',
                            'display_name': user.display_name or 'N/A',
                            'phone_number': user.phone_number or 'N/A',
                            'photo_url': user.photo_url or 'N/A',
                            'provider_id': user.provider_id or 'N/A',
                            'creation_timestamp': creation_timestamp,
                            'last_sign_in_timestamp': last_sign_in_timestamp
                        })
                except Exception as e:
                    print(f"Error al procesar página adicional: {str(e)}")
                    break

            # Ordenar la lista por last_sign_in_timestamp descendente
            processed_data.sort(key=lambda x: x['last_sign_in_timestamp'], reverse=True)

            return processed_data

        # Obtener usuarios de Firebase
        users = get_firebase_users()

        # Enviar los datos al template
        return render(request, 'firebase_auth.html', {'users': users})
    
    except Exception as e:
        # Si hay un error, mostrar mensaje informativo
        error_message = f"Error al conectar con Firebase: {str(e)}"
        return render(request, 'firebase_auth.html', {
            'users': [],
            'error_message': error_message,
            'firebase_not_configured': True
        })


@login_required
def ticket_master(request):
    # Lógica de la vista aquí
    return render(request, 'ticket_master.html')

@login_required
def performance(request):
    # Lógica de la vista aquí
    return render(request, 'performance.html')


@login_required
def waiver(request):
    # Obtener todos los datos de WaiverDataDB desde la base de datos
    waiver_data = WaiverDataDB.objects.all()

    # Obtener los colaboradores registrados
    waiver_validators = WaiverValidator.objects.all()

    # Filas específicas para la tabla de clientes registrados en el waiver
    waiver_clientes = WaiverDataDB.objects.values(
        'id', 'user_id', 'user_name', 'relative_name', 'relative_age', 'timestamp', 'user_email'
    )

    if request.method == 'POST':
        form = WaiverValidatorForm(request.POST)
        if form.is_valid():
            form.save()  # Guarda el formulario sin asignar 'user'
            return redirect('waiver')  # Redirigir de nuevo para evitar reenvíos
    else:
        form = WaiverValidatorForm()

    context = {
        'waiver_data': waiver_data,
        'waiver_clientes': waiver_clientes,
        'waiver_validators': waiver_validators,  # Pasamos los validadores al contexto
        'form': form
    }

    return render(request, 'waiver.html', context)

def delete_validator(request, validator_id):
    validator = get_object_or_404(WaiverValidator, pk=validator_id)
    if request.method == 'POST':
        validator.delete()
        messages.success(request, 'Colaborador eliminado exitosamente.')
        return redirect('waiver')
    return render(request, 'delete_validator_confirm.html', {'validator': validator})


@login_required
def redirect_productc(request):
    return render(request, 'product/productc.html')

@login_required
def redirect_chats(request):
    if request.method == 'POST':
        # Manejar la creación de un nuevo chat
        initial_message = request.POST.get('initial_message')
        if not initial_message:
            messages.error(request, 'El mensaje inicial es requerido.')
            return redirect('chats')

        try:
            # Crear nuevo chat
            chat = ChatRoom.objects.create(user=request.user)
            
            # Crear mensaje inicial
            ChatMessage.objects.create(
                chat_room=chat,
                sender=request.user,
                content=initial_message
            )
            
            messages.success(request, 'Chat iniciado exitosamente.')
            return redirect('chats')
        except Exception as e:
            messages.error(request, f'Error al iniciar el chat: {str(e)}')
            return redirect('chats')

    # Obtener todos los chats del usuario
    user_chats = ChatRoom.objects.filter(user=request.user).order_by('-last_message_at')
    
    # Obtener el chat actual si se especifica en la URL
    current_chat_id = request.GET.get('chat_id')
    current_chat = None
    
    if current_chat_id:
        try:
            current_chat = ChatRoom.objects.get(id=current_chat_id, user=request.user)
        except ChatRoom.DoesNotExist:
            pass
    
    return render(request, 'chats/chats.html', {
        'user_chats': user_chats,
        'current_chat': current_chat
    })


@login_required
def process_checkbox(request):
    if request.method == 'POST':
        checkbox_state = request.POST.get('checkbox_state')
        print("El estado del checkbox es:", checkbox_state)

        if checkbox_state == 'true':
            # Guardar el estado en la sesión
            request.session['show_categories'] = True
            # Redirige a la página con categorías
            return redirect('productc')
        else:
            # Guardar el estado en la sesión
            request.session['show_categories'] = False
            # Redirige a la página sin categorías
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
    try:
        users = User.objects.all().order_by('-date_joined')
        return render(request, 'sudo/sudo_admin.html', {'users': users})
    except Exception as e:
        # Si hay un error, mostrar mensaje informativo
        error_message = f"Error al cargar usuarios: {str(e)}"
        return render(request, 'sudo/sudo_admin.html', {
            'users': [],
            'error_message': error_message
        })


@login_required
@user_passes_test(is_mrgomez)
@require_http_methods(['POST'])
def delete_user(request, user_id):
    try:
        # Obtener el usuario a eliminar
        user_to_delete = User.objects.get(id=user_id)
        
        # No permitir eliminar al usuario actual (mrgomez)
        if user_to_delete.username == 'mrgomez':
            messages.error(request, 'No puedes eliminar tu propia cuenta de administrador.')
            return redirect('sudo_admin')
        
        # Obtener el nombre del usuario antes de eliminarlo
        username = user_to_delete.username
        
        # Eliminar el usuario
        user_to_delete.delete()
        
        messages.success(request, f'Usuario "{username}" eliminado exitosamente.')
        
    except User.DoesNotExist:
        messages.error(request, 'Usuario no encontrado.')
    except Exception as e:
        messages.error(request, f'Error al eliminar usuario: {str(e)}')
    
    return redirect('sudo_admin')

def handler404(request, exception):
    return render(request, 'errors/404.html', status=404)

def handler500(request):
    return render(request, 'errors/500.html', status=500)

@login_required
def chat_dashboard(request):
    # Verificar si el usuario es un administrador de chat
    if not ChatAdministrator.objects.filter(user=request.user, is_active=True).exists():
        messages.error(request, 'No tiene permisos para acceder al panel de chat.')
        return redirect('home')

    active_chats = ChatRoom.objects.filter(is_active=True).order_by('-last_message_at')
    chat_admins = ChatAdministrator.objects.all().order_by('-created_at')
    
    return render(request, 'chat/chat.html', {
        'active_chats': active_chats,
        'chat_admins': chat_admins
    })

@login_required
@require_http_methods(['POST'])
def add_chat_admin(request):
    if not request.user.is_staff:
        messages.error(request, 'No tiene permisos para realizar esta acción.')
        return redirect('chat_dashboard')

    email = request.POST.get('email')
    if not email:
        messages.error(request, 'El correo electrónico es requerido.')
        return redirect('chat_dashboard')

    try:
        user = User.objects.get(email=email)
        ChatAdministrator.objects.create(user=user, email=email)
        messages.success(request, 'Administrador agregado exitosamente.')
    except User.DoesNotExist:
        messages.error(request, 'El usuario con este correo electrónico no existe.')
    except Exception as e:
        messages.error(request, f'Error al agregar administrador: {str(e)}')

    return redirect('chat_dashboard')

@login_required
@require_http_methods(['POST'])
def toggle_chat_admin(request, admin_id):
    if not request.user.is_staff:
        messages.error(request, 'No tiene permisos para realizar esta acción.')
        return redirect('chat_dashboard')

    try:
        admin = ChatAdministrator.objects.get(id=admin_id)
        admin.is_active = not admin.is_active
        admin.save()
        messages.success(request, f'Administrador {"desactivado" if not admin.is_active else "activado"} exitosamente.')
    except ChatAdministrator.DoesNotExist:
        messages.error(request, 'Administrador no encontrado.')
    except Exception as e:
        messages.error(request, f'Error al actualizar administrador: {str(e)}')

    return redirect('chat_dashboard')

@login_required
def get_chat_messages(request, chat_id):
    if not ChatAdministrator.objects.filter(user=request.user, is_active=True).exists():
        return JsonResponse({'error': 'No autorizado'}, status=403)

    try:
        chat = ChatRoom.objects.get(id=chat_id)
        messages = ChatMessage.objects.filter(chat_room=chat).order_by('timestamp')
        
        return JsonResponse({
            'messages': [{
                'sender': msg.sender.username,
                'content': msg.content,
                'timestamp': msg.timestamp.strftime('%Y-%m-%d %H:%M:%S'),
                'is_admin': msg.sender == request.user
            } for msg in messages]
        })
    except ChatRoom.DoesNotExist:
        return JsonResponse({'error': 'Chat no encontrado'}, status=404)

@login_required
@require_http_methods(['POST'])
def send_message(request, chat_id):
    if not ChatAdministrator.objects.filter(user=request.user, is_active=True).exists():
        return JsonResponse({'error': 'No autorizado'}, status=403)

    try:
        chat = ChatRoom.objects.get(id=chat_id)
        data = json.loads(request.body)
        message_content = data.get('message')

        if not message_content:
            return JsonResponse({'error': 'El mensaje no puede estar vacío'}, status=400)

        message = ChatMessage.objects.create(
            chat_room=chat,
            sender=request.user,
            content=message_content
        )

        chat.last_message_at = message.timestamp
        chat.save()

        return JsonResponse({'success': True})
    except ChatRoom.DoesNotExist:
        return JsonResponse({'error': 'Chat no encontrado'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@login_required
def user_chats(request):
    if request.method == 'POST':
        # Manejar la creación de un nuevo chat
        initial_message = request.POST.get('initial_message')
        if not initial_message:
            messages.error(request, 'El mensaje inicial es requerido.')
            return redirect('user_chats')

        try:
            # Crear nuevo chat
            chat = ChatRoom.objects.create(user=request.user)
            
            # Crear mensaje inicial
            ChatMessage.objects.create(
                chat_room=chat,
                sender=request.user,
                content=initial_message
            )
            
            messages.success(request, 'Chat iniciado exitosamente.')
            return redirect(f'user_chats?chat_id={chat.id}')
        except Exception as e:
            messages.error(request, f'Error al iniciar el chat: {str(e)}')
            return redirect('user_chats')

    # Obtener todos los chats del usuario
    user_chats = ChatRoom.objects.filter(user=request.user).order_by('-last_message_at')
    
    # Obtener el chat actual si se especifica en la URL
    current_chat_id = request.GET.get('chat_id')
    current_chat = None
    
    if current_chat_id:
        try:
            current_chat = ChatRoom.objects.get(id=current_chat_id, user=request.user)
        except ChatRoom.DoesNotExist:
            pass
    
    return render(request, 'chats/chats.html', {
        'user_chats': user_chats,
        'current_chat': current_chat
    })

@login_required
@require_http_methods(['POST'])
def start_new_chat(request):
    if not ChatAdministrator.objects.filter(user=request.user, is_active=True).exists():
        messages.error(request, 'No tiene permisos para iniciar chats.')
        return redirect('chat_dashboard')

    if request.method == 'POST':
        user_id = request.POST.get('user_id')
        if not user_id:
            messages.error(request, 'ID de usuario requerido.')
            return redirect('chat_dashboard')

        try:
            # Verificar si ya existe un chat activo con este usuario
            existing_chat = ChatRoom.objects.filter(
                user_id=user_id,
                is_active=True
            ).first()

            if existing_chat:
                messages.info(request, 'Ya existe un chat activo con este usuario.')
                return redirect('chat_dashboard')

            # Crear nuevo chat
            new_chat = ChatRoom.objects.create(
                user_id=user_id,
                is_active=True
            )

            messages.success(request, 'Chat iniciado exitosamente.')
            return redirect('chat_dashboard')

        except Exception as e:
            messages.error(request, f'Error al iniciar chat: {str(e)}')
            return redirect('chat_dashboard')

    return redirect('chat_dashboard')


# APIs del Sistema
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.core.serializers import serialize
import json

@api_view(['GET'])
def api_products(request):
    """API para obtener todos los productos"""
    try:
        products = Product.objects.all()
        products_data = []
        
        for product in products:
            # Manejar la URL de la imagen de forma segura
            image_url = None
            if product.img and hasattr(product.img, 'url'):
                try:
                    image_url = request.build_absolute_uri(product.img.url)
                except:
                    image_url = None
            
            # Manejar el usuario de forma segura
            user_name = 'Unknown'
            if product.user:
                user_name = product.user.username
            
            products_data.append({
                'id': product.id,
                'title': product.title,
                'description': product.description,
                'category': product.get_category_display(),
                'dimensions': product.dimensions,
                'price': str(product.price) if product.price else None,
                'youtube_url': product.youtube_url,
                'publicated': product.publicated,
                'user': user_name,
                'image_url': image_url,
                'created_at': product.created.isoformat() if product.created else None,
            })
        
        return Response({
            'products': products_data,
            'total_count': len(products_data)
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'error': f'Error al obtener productos: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def api_products_by_category(request, category):
    """API para obtener productos por categoría"""
    try:
        products = Product.objects.filter(category=category)
        products_data = []
        
        for product in products:
            # Manejar la URL de la imagen de forma segura
            image_url = None
            if product.img and hasattr(product.img, 'url'):
                try:
                    image_url = request.build_absolute_uri(product.img.url)
                except:
                    image_url = None
            
            # Manejar el usuario de forma segura
            user_name = 'Unknown'
            if product.user:
                user_name = product.user.username
            
            products_data.append({
                'id': product.id,
                'title': product.title,
                'description': product.description,
                'category': product.get_category_display(),
                'dimensions': product.dimensions,
                'price': str(product.price) if product.price else None,
                'youtube_url': product.youtube_url,
                'publicated': product.publicated,
                'user': user_name,
                'image_url': image_url,
                'created_at': product.created.isoformat() if product.created else None,
            })
        
        return Response({
            'products': products_data,
            'category': category,
            'total_count': len(products_data)
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'error': f'Error al obtener productos por categoría: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
