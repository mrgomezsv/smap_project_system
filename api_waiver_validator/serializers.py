# api_app/serializers.py

from rest_framework import serializers
from t_app_product.models import WaiverValidator

class WaiverValidatorSerializer(serializers.ModelSerializer):
    class Meta:
        model = WaiverValidator
        fields = ['email']
