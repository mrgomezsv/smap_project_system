# kidsfun_web/views.py
from django.shortcuts import render, get_object_or_404, redirect
from django.db.models import Count
from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from django.conf import settings
import json
import io
import base64

# Importación condicional de qrcode
try:
    import qrcode
    QRCODE_AVAILABLE = True
except ImportError:
    QRCODE_AVAILABLE = False
    print("Warning: qrcode module not available. QR code functionality will be disabled.")

from t_app_product.models import Product
# from api_like.models import Like  # Comentado - API eliminada
# from api_commentary.models import Commentary  # Comentado - API eliminada


def home(request):
    return render(request, 'kidsfun_web/home.html')

def kidsfun_web(request):
    return render(request, 'kidsfun_web/home.html')

def service(request):
    """Vista para mostrar productos y servicios"""
    try:
        # Verificar si el modelo Product está disponible
        from django.apps import apps
        if not apps.is_installed('t_app_product'):
            raise Exception("La aplicación t_app_product no está instalada")
        
        # Obtener todos los products que están publicados
        products = Product.objects.filter(publicated=True).order_by('category', 'title')
        print(f"Productos encontrados: {products.count()}")
        
        # Crear un diccionario para almacenar los products agrupados por categoría
        products_or_category = {}
        
        if products.exists():
            for product in products:
                try:
                    # Agregar los conteos al producto
                    product.likes_count = 0  # Valor por defecto
                    product.comments_count = 0  # Valor por defecto
                    
                    category = product.category
                    if category not in products_or_category:
                        products_or_category[category] = []
                    products_or_category[category].append(product)
                except Exception as product_error:
                    print(f"Error procesando producto {product.id}: {str(product_error)}")
                    continue
        
        print(f"Categorías encontradas: {list(products_or_category.keys())}")
        
        context = {
            'products_or_category': products_or_category
        }
        
        return render(request, 'kidsfun_web/service/service.html', context)
        
    except ImportError as e:
        print(f"Error de importación en vista service: {str(e)}")
        context = {
            'error_message': 'Error de configuración del sistema. Por favor, contacta al administrador.',
            'products_or_category': {}
        }
        return render(request, 'kidsfun_web/service/service.html', context)
    except Exception as e:
        # Log del error para debugging
        print(f"Error en vista service: {str(e)}")
        import traceback
        traceback.print_exc()
        # Retornar una página de error más amigable
        context = {
            'error_message': f'Lo sentimos, hubo un problema al cargar los productos. Por favor, intenta de nuevo más tarde.',
            'products_or_category': {}
        }
        return render(request, 'kidsfun_web/service/service.html', context)

def service_product(request, product_id):
    # Obtener el producto correspondiente al product_id o mostrar una página 404 si no existe
    product = get_object_or_404(Product, pk=product_id)

    # Comentado: Obtener el conteo de likes para este producto
    # likes_count = Like.objects.filter(product=str(product.id), is_favorite=True).count()
    likes_count = 0  # Valor por defecto
    
    # Comentado: Obtener todos los comentarios para este producto
    # comments = Commentary.objects.filter(product_id=product.id).order_by('-id')
    comments = []  # Lista vacía por defecto
    
    # Agregar los datos al contexto
    context = {
        'product': product,
        'likes_count': likes_count,
        'comments': comments,
        'comments_count': len(comments)
    }

    # Devolver la renderización de la plantilla con el producto
    return render(request, 'kidsfun_web/service/product/product_consistent.html', context)


@csrf_exempt
@require_POST
def web_like(request, product_id):
    """Vista para manejar likes desde la web (versión local sin base de datos)"""
    try:
        # Obtener datos del request
        data = json.loads(request.body)
        user_id = data.get('user_id', 'web_user')  # Usuario por defecto para web
        
        # Comentado: Verificar si ya existe un like para este usuario y producto
        # like, created = Like.objects.get_or_create(
        #     user=user_id,
        #     product=str(product_id),
        #     defaults={'is_favorite': True}
        # )
        
        # if not created:
        #     # Si ya existe, cambiar el estado
        #     like.is_favorite = not like.is_favorite
        #     like.save()
        
        # Comentado: Obtener el conteo total de likes
        # total_likes = Like.objects.filter(product=str(product_id), is_favorite=True).count()
        total_likes = 0  # Valor por defecto
        
        return JsonResponse({
            'success': True,
            'is_favorite': True,  # Valor por defecto
            'total_likes': total_likes
        })
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=400)


@csrf_exempt
@require_POST
def web_comment(request, product_id):
    """Vista para manejar comentarios desde la web (versión local sin base de datos)"""
    try:
        # Obtener datos del request
        data = json.loads(request.body)
        comment_text = data.get('comment')
        user_id = data.get('user_id', 'web_user')  # Usuario por defecto para web
        
        if not comment_text:
            return JsonResponse({
                'success': False,
                'error': 'Comment text is required'
            }, status=400)
        
        # Comentado: Crear el comentario
        # comment = Commentary.objects.create(
        #     comment=comment_text,
        #     user_id=user_id,
        #     product_id=product_id
        # )
        
        # Comentado: Obtener el conteo total de comentarios
        # total_comments = Commentary.objects.filter(product_id=product_id).count()
        total_comments = 0  # Valor por defecto
        
        return JsonResponse({
            'success': True,
            'comment': {
                'id': 1,  # Valor por defecto
                'comment': comment_text,
                'user_id': user_id,
                'product_id': product_id
            },
            'total_comments': total_comments
        })
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=400)


def contact(request):
    return render(request, 'kidsfun_web/contact/contact.html')

def mobile_app(request):
    """Vista para la página de la aplicación móvil con QR code"""
    # Generar el QR code para la app
    qr_code_base64 = generate_app_qr(request)
    
    context = {
        'qr_code_base64': qr_code_base64,
        'app_download_url': "https://play.google.com/store/apps/details?id=com.kidsfun.app.kidsfun",
        'qr_available': qr_code_base64 is not None
    }
    
    return render(request, 'kidsfun_web/mobile_app.html', context)

def custom_404(request, exception):
    return render(request, '404.html', status=404)

def terms_conditions(request):
    """Vista para la página de términos y condiciones"""
    return render(request, 'kidsfun_web/terms_conditions.html')

def generate_app_qr(request):
    """Genera un QR code para descargar la app de Kidsfun"""
    if not QRCODE_AVAILABLE:
        # Si qrcode no está disponible, retornar una imagen placeholder o None
        return None
    
    try:
        # URL de descarga de la app (Google Play Store)
        app_download_url = "https://play.google.com/store/apps/details?id=com.kidsfun.app.kidsfun"
        
        # Crear el QR code
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
        qr.add_data(app_download_url)
        qr.make(fit=True)
        
        # Crear la imagen del QR code
        img = qr.make_image(fill_color="black", back_color="white")
        
        # Convertir la imagen a base64
        buffer = io.BytesIO()
        img.save(buffer, format='PNG')
        img_str = base64.b64encode(buffer.getvalue()).decode()
        
        return img_str
    except Exception as e:
        print(f"Error generating QR code: {str(e)}")
        return None