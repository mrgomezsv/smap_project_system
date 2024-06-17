from django.urls import path
from .views import LikeListCreate, LikeRetrieveUpdateDestroy

urlpatterns = [
    path('', LikeListCreate.as_view(), name='like-list-create'),
    path('<int:pk>/', LikeRetrieveUpdateDestroy.as_view(), name='like-detail'),
]
