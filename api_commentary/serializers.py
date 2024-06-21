# api_commentary/serializers.py

from rest_framework import serializers
from .models import Commentary

class CommentarySerializer(serializers.ModelSerializer):
    class Meta:
        model = Commentary
        fields = ['id', 'comment', 'user_id', 'product_id']
