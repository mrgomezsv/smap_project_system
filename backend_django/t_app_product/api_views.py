from rest_framework import viewsets, status, filters
from rest_framework.response import Response
from rest_framework.decorators import action, api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny
from django_filters.rest_framework import DjangoFilterBackend
from django.contrib.auth import authenticate, login, logout
from django.views.decorators.csrf import csrf_exempt
from .models import Product, ProductLike, ProductComment, Event, ContactMessage
from .serializers import (
    ProductSerializer, EventSerializer, CommentSerializer, 
    ContactMessageSerializer, UserSerializer
)

@csrf_exempt
@api_view(['POST'])
@authentication_classes([])
@permission_classes([AllowAny])
def api_logout(request):
    logout(request)
    return Response({'success': True, 'message': 'Sesión cerrada'})

@csrf_exempt
@api_view(['POST'])
@authentication_classes([])
@permission_classes([AllowAny])
def api_signin(request):
    username = request.data.get('username')
    password = request.data.get('password')
    user = authenticate(username=username, password=password)
    if user is not None:
        login(request, user)
        serializer = UserSerializer(user)
        return Response({
            'success': True,
            'user': serializer.data,
            'message': 'Login exitoso'
        })
    return Response({
        'success': False,
        'message': 'Credenciales inválidas'
    }, status=status.HTTP_401_UNAUTHORIZED)

@api_view(['GET'])
def api_me(request):
    if request.user.is_authenticated:
        serializer = UserSerializer(request.user)
        return Response({
            'success': True,
            'user': serializer.data
        })
    return Response({
        'success': False,
        'message': 'No autenticado'
    }, status=status.HTTP_401_UNAUTHORIZED)
    
@api_view(['GET'])
def api_stats(request):
    """
    Returns statistics for the admin dashboard.
    """
    products_count = Product.objects.count()
    events_count = Event.objects.count()
    messages_count = ContactMessage.objects.count()
    # Users count
    from django.contrib.auth.models import User
    users_count = User.objects.count()

    return Response({
        'products_total': products_count,
        'events_upcoming': events_count,
        'messages_unread': messages_count,
        'users_total': users_count,
    })

class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.filter(publicated=True)
    serializer_class = ProductSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category']
    search_fields = ['title', 'description']
    ordering_fields = ['price', 'created']

    @action(detail=True, methods=['post'])
    def toggle_like(self, request, pk=None):
        product = self.get_object()
        user_id = request.data.get('user_id')
        if not user_id:
            return Response({'error': 'user_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        like, created = ProductLike.objects.get_or_create(user_id=user_id, product=product)
        if not created:
            like.is_favorite = not like.is_favorite
            like.save()
        else:
            like.is_favorite = True
            like.save()
            
        return Response({
            'is_favorite': like.is_favorite,
            'total_likes': product.productlike.filter(is_favorite=True).count()
        })

class EventViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Event.objects.filter(published=True)
    serializer_class = EventSerializer
    lookup_field = 'slug'

class CommentViewSet(viewsets.ModelViewSet):
    queryset = ProductComment.objects.all()
    serializer_class = CommentSerializer

    def get_queryset(self):
        product_id = self.request.query_params.get('product_id')
        if product_id:
            return self.queryset.filter(product_id=product_id)
        return self.queryset

class ContactMessageViewSet(viewsets.ModelViewSet):
    queryset = ContactMessage.objects.all()
    serializer_class = ContactMessageSerializer
    http_method_names = ['post']
