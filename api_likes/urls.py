# api_likes/urls.py
from django.urls import path
from .views import LikeListCreate, LikeRetrieveUpdateDestroy

urlpatterns = [
    path('', LikeListCreate.as_view(), name='like-list-create'),  # Este es el nombre que usaremos en la plantilla
    path('<int:pk>/', LikeRetrieveUpdateDestroy.as_view(), name='like-detail'),
]
