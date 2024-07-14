# api_waiver/urls.py

from django.urls import path
from . import views

urlpatterns = [
    path('waiver/', views.api_waiver, name='api_waiver'),
]
