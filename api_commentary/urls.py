# api_commentary/urls.py

from django.urls import include, path
from rest_framework.routers import DefaultRouter
from . import views

app_name = 'api_commentary'

router = DefaultRouter()
router.register(r'', views.CommentaryViewSet)

urlpatterns = [
    path('commentary/', include(router.urls)),
]
