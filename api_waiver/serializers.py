# api_waiver/serializers.py

from rest_framework import serializers
from .models import WaiverData  # Importa solo WaiverData, no WaiverQR

class WaiverDataSerializer(serializers.ModelSerializer):
    class Meta:
        model = WaiverData
        fields = ('id', 'user_id', 'user_name', 'relative_name', 'relative_age', 'timestamp')
