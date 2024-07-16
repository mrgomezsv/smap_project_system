# api_waiver/urls.py

from django.urls import path
from . import views

urlpatterns = [
    path('waiver/', views.api_waiver, name='api_waiver'),
    path('waiver_qr/', views.api_waiver_qr, name='api_waiver_qr'),  # Añadir esta línea
]
