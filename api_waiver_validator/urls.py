# api_waiver_validator/urls.py

from django.urls import path, include
from rest_framework import routers
from .views import WaiverValidatorViewSet

router = routers.DefaultRouter()
# Registrar con un prefijo vacío
router.register(r'', WaiverValidatorViewSet, basename='waivervalidator')

urlpatterns = [
    path('', include(router.urls)),
]
