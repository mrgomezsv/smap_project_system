# api_commentary/views.py

from rest_framework import viewsets
from .models import Commentary
from .serializers import CommentarySerializer

class CommentaryViewSet(viewsets.ModelViewSet):
    queryset = Commentary.objects.all()
    serializer_class = CommentarySerializer
    # Opcional: Agregar permisos, autenticación, etc. según tus necesidades
