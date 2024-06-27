# api_like/urls.py
from django.urls import path
from .views import like_create, user_likes

urlpatterns = [
    path('api/likes/', like_create, name='like-create'),
    path('api/likes/<str:user_id>/', user_likes, name='user-likes'),
]
