from rest_framework import serializers
from .models import WaiverQRV2, WaiverDataV2

class WaiverDataV2Serializer(serializers.ModelSerializer):
    class Meta:
        model = WaiverDataV2
        fields = ['id', 'relative_name', 'relative_age', 'timestamp']

class WaiverQRV2Serializer(serializers.ModelSerializer):
    relatives = WaiverDataV2Serializer(many=True, read_only=True)
    is_expired = serializers.ReadOnlyField()
    
    class Meta:
        model = WaiverQRV2
        fields = [
            'id', 'qr_code', 'user_id', 'user_name', 'user_email', 
            'created_at', 'expires_at', 'status', 'relatives', 'is_expired'
        ]
        read_only_fields = ['qr_code', 'created_at', 'expires_at', 'status']

class WaiverCreateV2Serializer(serializers.ModelSerializer):
    relatives = serializers.ListField(
        child=serializers.DictField(),
        write_only=True
    )
    
    class Meta:
        model = WaiverQRV2
        fields = ['user_id', 'user_name', 'user_email', 'relatives']
    
    def create(self, validated_data):
        relatives_data = validated_data.pop('relatives')
        
        # Crear el waiver QR
        waiver_qr = WaiverQRV2.objects.create(**validated_data)
        
        # Crear los datos de familiares
        for relative_data in relatives_data:
            WaiverDataV2.objects.create(
                waiver_qr=waiver_qr,
                relative_name=relative_data['name'],
                relative_age=relative_data['age']
            )
        
        return waiver_qr 