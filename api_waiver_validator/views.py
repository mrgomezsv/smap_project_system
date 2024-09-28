# api_app/views.py

from rest_framework import viewsets, permissions, filters
from t_app_product.models import WaiverValidator
from .serializers import WaiverValidatorSerializer
from django_filters.rest_framework import DjangoFilterBackend

class WaiverValidatorViewSet(viewsets.ModelViewSet):
    queryset = WaiverValidator.objects.all()
    serializer_class = WaiverValidatorSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['email']
