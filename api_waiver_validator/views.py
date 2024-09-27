# api_app/views.py

from rest_framework import viewsets, permissions
from t_app_product.models import WaiverValidator  # Reemplaza 'mi_aplicacion' con el nombre real de tu aplicación
from .serializers import WaiverValidatorSerializer

class WaiverValidatorViewSet(viewsets.ModelViewSet):
    queryset = WaiverValidator.objects.all()
    serializer_class = WaiverValidatorSerializer
    permission_classes = [permissions.AllowAny]  # Ajusta según tus necesidades de seguridad
