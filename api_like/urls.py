# api_like/urls.py
from django.urls import path
from .views import like_list_create

urlpatterns = [
    path('likes/', like_list_create, name='like-list-create'),
]
