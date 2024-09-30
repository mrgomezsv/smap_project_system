# api_waiver_validator/urls.py

from django.urls import path
from .views import check_waiver_validator

urlpatterns = [
    path('api/check-waiver-validator/', check_waiver_validator, name='check_waiver_validator'),
]

