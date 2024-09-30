# api_waiver_validator/urls.py

from django.urls import path, include
from rest_framework import routers
from .views import WaiverValidatorViewSet

router = routers.DefaultRouter()
router.register(r'waiver-validators', WaiverValidatorViewSet, basename='waivervalidator')

urlpatterns = [
    path('', include(router.urls)),
]
