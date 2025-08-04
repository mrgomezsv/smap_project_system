# kidsfun_web/urls_local.py
from django.urls import path
from . import views_local

urlpatterns = [
    path('', views_local.home, name='home'),
    path('kidsfun/', views_local.kidsfun_web, name='kidsfun_web'),
    path('service/', views_local.service, name='service'),
    path('service/product/<int:product_id>/', views_local.service_product, name='service_product'),
    path('contact/', views_local.contact, name='contact'),
    path('mobile-app/', views_local.mobile_app, name='mobile_app'),
    path('web-like/<str:product_id>/', views_local.web_like, name='web_like'),
    path('web-comment/<int:product_id>/', views_local.web_comment, name='web_comment'),
] 