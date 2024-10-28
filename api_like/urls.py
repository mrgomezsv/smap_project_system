# api_like/urls.py
from django.urls import path
from .views import like_toggle, user_likes, product_likes, user_product_like

urlpatterns = [
    path('api/likes/toggle/', like_toggle, name='like-toggle'),
    path('api/likes/user/<str:user_id>/', user_likes, name='user-likes'),
    path('api/likes/product/<str:product_id>/', product_likes, name='product-likes'),
    path('api/likes/user/<str:user_id>/product/<str:product_id>/', user_product_like, name='user-product-like'),
]
