from django.urls import path
from . import views

urlpatterns = [
    path('', views.home, name='home'),
    path('service/', views.service, name='service'),
    path('service/product/<int:product_id>/', views.service_product, name='service_product'),
    path('contact/', views.contact, name='contact'),
    # path('contact/', views.service, name='contact/contact'),
]
