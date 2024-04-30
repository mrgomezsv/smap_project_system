from rest_framework import serializers
from t_app_product.models import Product  # Importa el modelo de tu aplicación

class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = '__all__'
