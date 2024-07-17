# api_waiver/urls.py

from django.urls import path
from . import views

urlpatterns = [
    path('waiver/', views.api_waiver, name='api_waiver'),
    path('waiver_qr/', views.api_waiver_qr, name='api_waiver_qr'),
    path('waiver_qr/<str:user_id>/', views.get_waiver_data, name='get_waiver_data'),  # Añadir esta línea
]
