# api_commentary/urls.py

from django.urls import include, path
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'', views.CommentaryViewSet)  # Cambiado r'commentary' a r''

urlpatterns = [
    path('commentary/', include(router.urls)),  # Añadido 'commentary/' en path
]
