from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action, api_view
from .models import Product, Commentary, Like
from .serializers import ProductSerializer, CommentarySerializer, LikeSerializer
from django.shortcuts import get_object_or_404

class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.filter(published=True)
    serializer_class = ProductSerializer

class CommentViewSet(viewsets.ModelViewSet):
    queryset = Commentary.objects.all()
    serializer_class = CommentarySerializer

    @action(detail=False, methods=['GET'])
    def comments_for_product(self, request):
        product_id = request.query_params.get('product_id')
        if not product_id:
            return Response({"error": "product_id parameter is required"}, status=status.HTTP_400_BAD_REQUEST)

        comments = self.queryset.filter(product_id=product_id)
        serializer = self.get_serializer(comments, many=True)

        return Response(serializer.data)

class LikeViewSet(viewsets.ModelViewSet):
    queryset = Like.objects.all()
    serializer_class = LikeSerializer

    @action(detail=False, methods=['POST'])
    def like_toggle(self, request):
        user_id = request.data.get('user')
        product_id = request.data.get('product')

        try:
            existing_like = Like.objects.get(user=user_id, product=product_id)
            existing_like.is_favorite = not existing_like.is_favorite
            existing_like.save()
            return Response({'is_favorite': existing_like.is_favorite}, status=status.HTTP_200_OK)
        except Like.DoesNotExist:
            serializer = self.get_serializer(data=request.data)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['GET'])
    def user_likes(self, request):
        user_id = request.query_params.get('user_id')
        if not user_id:
            return Response({"error": "user_id parameter is required"}, status=status.HTTP_400_BAD_REQUEST)

        likes = self.queryset.filter(user=user_id)
        serializer = self.get_serializer(likes, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['GET'])
    def product_likes(self, request):
        product_id = request.query_params.get('product_id')
        if not product_id:
            return Response({"error": "product_id parameter is required"}, status=status.HTTP_400_BAD_REQUEST)

        total_likes = self.queryset.filter(product=product_id, is_favorite=True).count()
        return Response({'total_likes': total_likes})

    @action(detail=False, methods=['GET'])
    def user_product_like(self, request):
        user_id = request.query_params.get('user_id')
        product_id = request.query_params.get('product_id')
        if not user_id or not product_id:
            return Response({"error": "user_id and product_id parameters are required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            like = Like.objects.get(user=user_id, product=product_id)
            serializer = self.get_serializer(like)
            return Response(serializer.data)
        except Like.DoesNotExist:
            return Response({'detail': 'Not found'}, status=status.HTTP_404_NOT_FOUND)
