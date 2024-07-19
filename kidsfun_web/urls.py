# kidsfun_web/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('', views.home, name='home'),
    path('service/', views.service, name='service'),
    path('service/product/<int:product_id>/', views.service_product, name='service_product'),
    # otras URL patterns...
]
