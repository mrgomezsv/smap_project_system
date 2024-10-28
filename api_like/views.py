# views.py
from rest_framework import status
from rest_framework.response import Response
from rest_framework.decorators import api_view
from .models import Like
from .serializers import LikeSerializer
from django.db.models import Count

@api_view(['POST'])
def like_toggle(request):
    if request.method == 'POST':
        user_id = request.data.get('user')
        product_id = request.data.get('product')

        try:
            existing_like = Like.objects.get(user=user_id, product=product_id)
            existing_like.is_favorite = not existing_like.is_favorite
            existing_like.save()
            return Response({'is_favorite': existing_like.is_favorite}, status=status.HTTP_200_OK)
        except Like.DoesNotExist:
            serializer = LikeSerializer(data=request.data)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
def user_likes(request, user_id):
    likes = Like.objects.filter(user=user_id)
    serializer = LikeSerializer(likes, many=True)
    return Response(serializer.data)

@api_view(['GET'])
def product_likes(request, product_id):
    total_likes = Like.objects.filter(product=product_id, is_favorite=True).count()
    return Response({'total_likes': total_likes})

@api_view(['GET'])
def user_product_like(request, user_id, product_id):
    try:
        like = Like.objects.get(user=user_id, product=product_id)
        serializer = LikeSerializer(like)
        return Response(serializer.data)
    except Like.DoesNotExist:
        return Response({'detail': 'Not found'}, status=status.HTTP_404_NOT_FOUND)
