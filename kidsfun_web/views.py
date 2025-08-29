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
from t_app_product.models import ContactMessage
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
        
        # Obtener todos los products que están publicados con contadores optimizados
        try:
            from t_app_product.models import ProductLike, ProductComment
            from django.db.models import Count, Q
            
            # Usar annotate para obtener contadores de manera eficiente
            products = Product.objects.filter(publicated=True).annotate(
                likes_count=Count('productlike', filter=Q(productlike__is_favorite=True)),
                comments_count=Count('comments')
            ).order_by('category', 'title')
            
            print(f"Productos encontrados: {products.count()}")
            
        except Exception:
            # Fallback si hay error al obtener contadores optimizados
            products = Product.objects.filter(publicated=True).order_by('category', 'title')
            print(f"Productos encontrados (fallback): {products.count()}")
            
            # Agregar contadores manualmente como fallback
            for product in products:
                try:
                    likes_count = ProductLike.objects.filter(product_id=product.id, is_favorite=True).count()
                    comments_count = ProductComment.objects.filter(product_id=product.id).count()
                    product.likes_count = likes_count
                    product.comments_count = comments_count
                except Exception:
                    product.likes_count = 0
                    product.comments_count = 0
        
        # Crear un diccionario para almacenar los products agrupados por categoría
        products_or_category = {}
        
        if products.exists():
            for product in products:
                try:
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

    # Cargar likes y comentarios reales desde t_app_product
    try:
        from t_app_product.models import ProductLike, ProductComment, CommentReply
        likes_count = ProductLike.objects.filter(product_id=product.id, is_favorite=True).count()
        comments_qs = ProductComment.objects.filter(product_id=product.id).order_by('-created_at')
        
        # Estructura mejorada de comentarios con respuestas
        comments = []
        for c in comments_qs:
            # Obtener respuestas para este comentario
            replies = CommentReply.objects.filter(comment=c).order_by('created_at')
            replies_data = [
                {
                    'id': r.id,
                    'reply_text': r.reply_text,
                    'user_id': r.user_id,
                    'user_display_name': r.user_display_name or f'Usuario {r.user_id}',
                    'created_at': r.created_at,
                    'formatted_date': r.created_at.strftime('%d/%m/%Y %H:%M')
                }
                for r in replies
            ]
            
            comment_data = {
                'id': c.id,
                'comment': c.comment,
                'user_id': c.user_id,
                'user_display_name': c.user_display_name or f'Usuario {c.user_id}',
                'created_at': c.created_at,
                'formatted_date': c.created_at.strftime('%d/%m/%Y %H:%M'),
                'replies': replies_data,
                'replies_count': len(replies_data)
            }
            comments.append(comment_data)
        
        comments_count = len(comments)
    except Exception as e:
        print(f"Error loading comments: {e}")
        # Fallback seguro si el modelo no está disponible o hay error
        likes_count = 0
        comments = []
        comments_count = 0
    
    # Agregar los datos al contexto
    context = {
        'product': product,
        'likes_count': likes_count,
        'comments': comments,
        'comments_count': comments_count,
    }

    # Devolver la renderización de la plantilla con el producto
    return render(request, 'kidsfun_web/service/product/product_consistent.html', context)


@csrf_exempt
@require_POST
def web_like(request, product_id):
    """Vista para manejar likes desde la web"""
    try:
        # Obtener datos del request
        data = json.loads(request.body)
        user_id = data.get('user_id', 'web_user')  # Usuario por defecto para web
        
        # Verificar si ya existe un like para este usuario y producto
        from t_app_product.models import ProductLike
        
        like, created = ProductLike.objects.get_or_create(
            user_id=user_id,
            product_id=product_id,
            defaults={'is_favorite': True}
        )
        
        if not created:
            # Si ya existe, cambiar el estado
            like.is_favorite = not like.is_favorite
            like.save()
        
        # Obtener el conteo total de likes
        total_likes = ProductLike.objects.filter(product_id=product_id, is_favorite=True).count()
        
        return JsonResponse({
            'success': True,
            'is_favorite': like.is_favorite,
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
    """Vista para manejar comentarios desde la web"""
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
        
        # Crear el comentario
        from t_app_product.models import ProductComment
        
        comment = ProductComment.objects.create(
            product_id=product_id,  # Asociar al producto correcto
            comment=comment_text,
            user_id=user_id,
            user_display_name=f'Usuario {user_id}'
        )
        
        # Obtener el conteo total de comentarios
        total_comments = ProductComment.objects.filter(product_id=product_id).count()
        
        return JsonResponse({
            'success': True,
            'comment': {
                'id': comment.id,
                'comment': comment.comment,
                'user_id': comment.user_id,
                'user_display_name': comment.user_display_name,
                'created_at': comment.created_at.strftime('%d/%m/%Y %H:%M'),
            },
            'total_comments': total_comments
        })
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=400)


@csrf_exempt
@require_POST
def web_reply(request, comment_id):
    """Vista para manejar respuestas a comentarios desde la web"""
    try:
        # Obtener datos del request
        data = json.loads(request.body)
        reply_text = data.get('reply_text')
        user_id = data.get('user_id', 'web_user')  # Usuario por defecto para web
        
        if not reply_text:
            return JsonResponse({
                'success': False,
                'error': 'Reply text is required'
            }, status=400)
        
        # Crear la respuesta al comentario
        from t_app_product.models import ProductComment, CommentReply
        
        try:
            comment = ProductComment.objects.get(id=comment_id)
        except ProductComment.DoesNotExist:
            return JsonResponse({
                'success': False,
                'error': 'Comment not found'
            }, status=404)
        
        # Crear la respuesta
        reply = CommentReply.objects.create(
            comment=comment,
            reply_text=reply_text,
            user_id=user_id,
            user_display_name=f'Usuario {user_id}'
        )
        
        # Obtener el conteo total de respuestas para este comentario
        total_replies = CommentReply.objects.filter(comment=comment).count()
        
        return JsonResponse({
            'success': True,
            'reply': {
                'id': reply.id,
                'reply_text': reply.reply_text,
                'user_id': reply.user_id,
                'user_display_name': reply.user_display_name,
                'created_at': reply.created_at.strftime('%d/%m/%Y %H:%M'),
            },
            'total_replies': total_replies
        })
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=400)


def contact(request):
    if request.method == 'POST':
        first_name = request.POST.get('firstName')
        last_name = request.POST.get('lastName')
        contact_number = request.POST.get('contactNumber')
        email = request.POST.get('email')
        reason = request.POST.get('reason')

        if first_name and last_name and contact_number and email and reason:
            ContactMessage.objects.create(
                first_name=first_name,
                last_name=last_name,
                contact_number=contact_number,
                email=email,
                reason=reason
            )
            from django.contrib import messages
            messages.success(request, '¡Mensaje enviado! Te contactaremos pronto.')
            from django.shortcuts import redirect
            return redirect('contact')
        else:
            from django.contrib import messages
            messages.error(request, 'Por favor, completa todos los campos.')
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


def payment_methods(request):
    """Vista para la página de métodos de pago (Zelle)."""
    return render(request, 'kidsfun_web/payment_methods.html')

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