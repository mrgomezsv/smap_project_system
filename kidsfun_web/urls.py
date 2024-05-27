from django.urls import path
from . import views

urlpatterns = [
    path('', views.home, name='home'),
    path('service/', views.service, name='service/service'),
    path('service/product/', views.service_product, name='service_product'),
    # path('contact/', views.service, name='contact/contact'),
]
