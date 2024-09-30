# api_app/views.py

from rest_framework import viewsets, permissions
from t_app_product.models import WaiverValidator
from .serializers import WaiverValidatorSerializer

class WaiverValidatorViewSet(viewsets.ModelViewSet):
    queryset = WaiverValidator.objects.all()
    serializer_class = WaiverValidatorSerializer
    permission_classes = [permissions.AllowAny]
