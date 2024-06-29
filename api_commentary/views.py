# api_commentary/views.py

from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import Commentary
from .serializers import CommentarySerializer

class CommentaryViewSet(viewsets.ModelViewSet):
    queryset = Commentary.objects.all()
    serializer_class = CommentarySerializer

    @action(detail=False, methods=['GET'])
    def comments_for_product(self, request, pk=None):
        product_id = request.query_params.get('product_id')
        if not product_id:
            return Response({"error": "product_id parameter is required"}, status=status.HTTP_400_BAD_REQUEST)

        comments = self.queryset.filter(product_id=product_id)
        serializer = self.get_serializer(comments, many=True)

        return Response(serializer.data)

    def perform_create(self, serializer):
        serializer.save()

    def perform_update(self, serializer):
        serializer.save()

    def perform_destroy(self, instance):
        instance.delete()
