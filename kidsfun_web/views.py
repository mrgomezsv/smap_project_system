# kidsfun_web/views.py
from django.shortcuts import render, get_object_or_404, redirect
from django.db.models import Count
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
import json

from api.models import Product
from api_like.models import Like
from api_commentary.models import Commentary


def home(request):
    return render(request, 'kidsfun_web/home.html')

def kidsfun_web(request):
    return render(request, 'kidsfun_web/home.html')

def service(request):
    # Obtener todos los products que están publicados
    products = Product.objects.filter(publicated=True)
    
    # Crear un diccionario para almacenar los products agrupados por categoría
    products_or_category = {}
    for product in products:
        # Obtener el conteo de likes para este producto
        likes_count = Like.objects.filter(product=str(product.id), is_favorite=True).count()
        
        # Obtener el conteo de comentarios para este producto
        comments_count = Commentary.objects.filter(product_id=product.id).count()
        
        # Agregar los conteos al producto
        product.likes_count = likes_count
        product.comments_count = comments_count
        
        category = product.category
        if category not in products_or_category:
            products_or_category[category] = []
        products_or_category[category].append(product)
    
    return render(request, 'kidsfun_web/service/service.html', {'products_or_category': products_or_category})


def service_product(request, product_id):
    # Obtener el producto correspondiente al product_id o mostrar una página 404 si no existe
    product = get_object_or_404(Product, pk=product_id)

    # Obtener el conteo de likes para este producto
    likes_count = Like.objects.filter(product=str(product.id), is_favorite=True).count()
    
    # Obtener todos los comentarios para este producto
    comments = Commentary.objects.filter(product_id=product.id).order_by('-id')
    
    # Agregar los datos al contexto
    context = {
        'product': product,
        'likes_count': likes_count,
        'comments': comments,
        'comments_count': comments.count()
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
        like, created = Like.objects.get_or_create(
            user=user_id,
            product=str(product_id),
            defaults={'is_favorite': True}
        )
        
        if not created:
            # Si ya existe, cambiar el estado
            like.is_favorite = not like.is_favorite
            like.save()
        
        # Obtener el conteo total de likes
        total_likes = Like.objects.filter(product=str(product_id), is_favorite=True).count()
        
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
        comment = Commentary.objects.create(
            comment=comment_text,
            user_id=user_id,
            product_id=product_id
        )
        
        # Obtener el conteo total de comentarios
        total_comments = Commentary.objects.filter(product_id=product_id).count()
        
        return JsonResponse({
            'success': True,
            'comment': {
                'id': comment.id,
                'comment': comment.comment,
                'user_id': comment.user_id,
                'product_id': comment.product_id
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
    return render(request, 'kidsfun_web/mobile_app.html')

def custom_404(request, exception):
    return render(request, '404.html', status=404)