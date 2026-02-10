from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .api_views import ProductViewSet, EventViewSet, CommentViewSet, ContactMessageViewSet, api_signin, api_me, api_logout, api_stats

router = DefaultRouter()
router.register(r'products', ProductViewSet, basename='api-product')
router.register(r'events', EventViewSet, basename='api-event')
router.register(r'comments', CommentViewSet, basename='api-comment')
router.register(r'contact', ContactMessageViewSet, basename='api-contact')

urlpatterns = [
    path('login/', api_signin, name='api_signin'),
    path('logout/', api_logout, name='api_logout'),
    path('me/', api_me, name='api_me'),
    path('stats/', api_stats, name='api_stats'),
    path('', include(router.urls)),
]
