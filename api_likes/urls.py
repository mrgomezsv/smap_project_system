# api_likes/urls.py
from django.urls import path
from .views import LikeListCreate, LikeRetrieveUpdateDestroy

urlpatterns = [
    path('likes/', LikeListCreate.as_view(), name='like-list-create'),
    path('likes/<int:pk>/', LikeRetrieveUpdateDestroy.as_view(), name='like-detail'),
]
