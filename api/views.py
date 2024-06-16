from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from .models import Product, Like
from .serializers import ProductSerializer, LikeSerializer

class ProductListCreate(generics.ListCreateAPIView):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer

class ProductRetrieveUpdateDestroy(generics.RetrieveUpdateDestroyAPIView):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer

class LikeToggle(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        user = request.user
        product_id = request.data.get('product_id')

        try:
            product = Product.objects.get(id=product_id)
        except Product.DoesNotExist:
            return Response({'error': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)

        try:
            like = Like.objects.get(user=user, product=product)
            like.delete()
            return Response({'message': 'Like removed'}, status=status.HTTP_204_NO_CONTENT)
        except Like.DoesNotExist:
            Like.objects.create(user=user, product=product)
            return Response({'message': 'Like added'}, status=status.HTTP_201_CREATED)
