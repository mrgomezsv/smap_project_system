from django.urls import path
from . import views

urlpatterns = [
    path('', views.home_view, name='home'),  # Define la URL para la página de inicio
    path('products-and-services/', views.products_and_services_view, name='products_and_services'),
    path('contact/', views.contact_view, name='contact'),
    # Aquí puedes agregar más rutas según las vistas que tengas en tu aplicación
]
