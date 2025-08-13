# kidsfun_web/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('', views.home, name='home'),
    path('service/', views.service, name='service'),
    path('service/product/<int:product_id>/', views.service_product, name='service_product'),
    path('contact/', views.contact, name='contact'),
    path('mobile-app/', views.mobile_app, name='mobile_app'),
    path('metodos-de-pago/', views.payment_methods, name='payment_methods'),
    path('web-like/<str:product_id>/', views.web_like, name='web_like'),
    path('web-comment/<int:product_id>/', views.web_comment, name='web_comment'),
    path('terminos-y-condiciones/', views.terms_conditions, name='terms_conditions'),
]
