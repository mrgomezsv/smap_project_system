# views.py
from rest_framework import status
from rest_framework.response import Response
from rest_framework.decorators import api_view
from .models import Like
from .serializers import LikeSerializer
from django.db.models import Count

@api_view(['POST'])
def like_create(request):
    if request.method == 'POST':
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
