from rest_framework import generics
from .models import Like
from .serializers import LikeSerializer

class LikeListCreate(generics.ListCreateAPIView):
    queryset = Like.objects.all()
    serializer_class = LikeSerializer
    # permission_classes = [IsAuthenticated]  # Eliminar o comentar esta línea

    def perform_create(self, serializer):
        # serializer.save(user=self.request.user)  # Comentar o eliminar esta línea si no necesitas asignar el usuario
        serializer.save()

class LikeRetrieveUpdateDestroy(generics.RetrieveUpdateDestroyAPIView):
    queryset = Like.objects.all()
    serializer_class = LikeSerializer
    # permission_classes = [IsAuthenticated]  # Eliminar o comentar esta línea
