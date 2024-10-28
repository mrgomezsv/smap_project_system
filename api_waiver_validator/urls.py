# api_waiver_validator/urls.py

from django.urls import path
from .views import check_waiver_validator, list_waiver_validators

urlpatterns = [
    path('check-waiver-validator/', check_waiver_validator, name='check_waiver_validator'),
    path('list-waiver-validators/', list_waiver_validators, name='list_waiver_validators'),  # Ruta para listar validadores
]
