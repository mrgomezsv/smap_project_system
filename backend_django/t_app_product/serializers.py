from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Product, ProductLike, ProductComment, CommentReply, Event, ContactMessage

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']

class ReplySerializer(serializers.ModelSerializer):
    created_at_formatted = serializers.DateTimeField(source='created_at', format='%Y-%m-%d %H:%M:%S', read_only=True)
    
    class Meta:
        model = CommentReply
        fields = ['id', 'user_id', 'user_display_name', 'reply_text', 'created_at', 'created_at_formatted']

class CommentSerializer(serializers.ModelSerializer):
    replies = ReplySerializer(many=True, read_only=True)
    created_at_formatted = serializers.DateTimeField(source='created_at', format='%Y-%m-%d %H:%M:%S', read_only=True)
    
    class Meta:
        model = ProductComment
        fields = ['id', 'product', 'user_id', 'user_display_name', 'comment', 'created_at', 'created_at_formatted', 'replies']

class ProductSerializer(serializers.ModelSerializer):
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    image_url = serializers.SerializerMethodField()
    gallery = serializers.SerializerMethodField()
    owner = UserSerializer(source='user', read_only=True)
    likes_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Product
        fields = [
            'id', 'title', 'description', 'price', 'category', 'category_display', 
            'circuits', 'dimensions', 'space', 'image_url', 'gallery', 'youtube_url', 
            'publicated', 'created', 'owner', 'likes_count'
        ]

    def get_image_url(self, obj):
        if obj.img and hasattr(obj.img, 'url'):
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.img.url)
            return obj.img.url
        return None

    def get_gallery(self, obj):
        images = []
        for i in range(1, 6):
            field_name = f'img{i}'
            img_field = getattr(obj, field_name)
            if img_field and hasattr(img_field, 'url') and 'default_product_image.jpg' not in img_field.name:
                url = img_field.url
                request = self.context.get('request')
                if request:
                    url = request.build_absolute_uri(url)
                images.append(url)
        return images

    def get_likes_count(self, obj):
        return obj.productlike.filter(is_favorite=True).count()

class EventSerializer(serializers.ModelSerializer):
    organizer_name = serializers.CharField(source='organizer.username', read_only=True)
    image_url = serializers.SerializerMethodField()
    partners_display = serializers.CharField(source='get_partners_display', read_only=True)
    
    class Meta:
        model = Event
        fields = [
            'id', 'title', 'slug', 'description', 'image_url', 'location', 
            'start_datetime', 'organizer_name', 'ticket_price', 'published', 
            'partners', 'partners_display', 'created_at'
        ]

    def get_image_url(self, obj):
        if obj.image and hasattr(obj.image, 'url'):
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None

class ContactMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactMessage
        fields = '__all__'
