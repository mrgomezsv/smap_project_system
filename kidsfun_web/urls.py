# kidsfun_web/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('', views.home, name='home'),
    path('service/', views.service, name='service'),
    path('contact/', views.contact, name='contact'),
    path('mobile-app/', views.mobile_app, name='mobile_app'),
    path('service/product/<int:product_id>/', views.service_product, name='service_product'),
    path('kidsfun_web/', views.kidsfun_web, name='kidsfun_web'),
]
