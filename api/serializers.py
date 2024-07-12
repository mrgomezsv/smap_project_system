from rest_framework import serializers
from .models import Product, Commentary, Like
from django.conf import settings

class ProductSerializer(serializers.ModelSerializer):
    img = serializers.ImageField()
    img1 = serializers.ImageField()
    img2 = serializers.ImageField()
    img3 = serializers.ImageField()
    img4 = serializers.ImageField()
    img5 = serializers.ImageField()

    class Meta:
        model = Product
        fields = '__all__'

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        representation['img'] = self.build_absolute_uri(instance.img.url)
        representation['img1'] = self.build_absolute_uri(instance.img1.url)
        representation['img2'] = self.build_absolute_uri(instance.img2.url)
        representation['img3'] = self.build_absolute_uri(instance.img3.url)
        representation['img4'] = self.build_absolute_uri(instance.img4.url)
        representation['img5'] = self.build_absolute_uri(instance.img5.url)
        representation['youtube_url'] = instance.youtube_url
        return representation

    def build_absolute_uri(self, url):
        request = self.context.get('request')
        if request:
            return request.build_absolute_uri(url)
        return f'{settings.SITE_DOMAIN}{url}'

class CommentarySerializer(serializers.ModelSerializer):
    user_display_name = serializers.SerializerMethodField()

    class Meta:
        model = Commentary
        fields = ('id', 'comment', 'user_id', 'product_id', 'user_display_name')

    def get_user_display_name(self, obj):
        return "Nombre de usuario"  # Implementa lógica para obtener el nombre de usuario

class LikeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Like
        fields = '__all__'
