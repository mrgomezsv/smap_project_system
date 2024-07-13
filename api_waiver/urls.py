# api_waiver/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('api_waiver/', views.api_waiver, name='api_waiver'),
]
