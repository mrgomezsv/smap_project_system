from rest_framework import serializers
from t_app_product.models import Product  # Importa el modelo de tu aplicación

class ProductSerializer(serializers.ModelSerializer):
    img = serializers.SerializerMethodField()
    img1 = serializers.SerializerMethodField()
    img2 = serializers.SerializerMethodField()
    img3 = serializers.SerializerMethodField()
    img4 = serializers.SerializerMethodField()
    img5 = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = '__all__'

    def get_img(self, obj):
        request = self.context.get('request')
        return request.build_absolute_uri(obj.img.url) if obj.img else None

    def get_img1(self, obj):
        request = self.context.get('request')
        return request.build_absolute_uri(obj.img1.url) if obj.img1 else None

    def get_img2(self, obj):
        request = self.context.get('request')
        return request.build_absolute_uri(obj.img2.url) if obj.img2 else None

    def get_img3(self, obj):
        request = self.context.get('request')
        return request.build_absolute_uri(obj.img3.url) if obj.img3 else None

    def get_img4(self, obj):
        request = self.context.get('request')
        return request.build_absolute_uri(obj.img4.url) if obj.img4 else None

    def get_img5(self, obj):
        request = self.context.get('request')
        return request.build_absolute_uri(obj.img5.url) if obj.img5 else None
