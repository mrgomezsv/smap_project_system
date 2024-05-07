from django.urls import path
from . import views

urlpatterns = [
    path('', views.home_view, name='home'),
    path('services/', views.services, name='services'),
    path('contact/', views.contact, name='contact'),
    # Otras rutas si las tienes
]
