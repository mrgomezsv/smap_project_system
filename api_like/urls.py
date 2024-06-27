# api_like/urls.py
from django.urls import path
from .views import like_create

urlpatterns = [
    path('likes/', like_create, name='like-create'),
]
