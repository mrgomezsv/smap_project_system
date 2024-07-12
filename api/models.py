# unified_api/models.py
from django.db import models
from django.contrib.auth.models import User

def image_path(instance, filename):
    return f'product_images/{filename}'

class Product(models.Model):
    img = models.ImageField(upload_to=image_path, default='default_product_image.jpg')
    title = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    category = models.CharField(max_length=50)
    created = models.DateTimeField(auto_now_add=True)
    important = models.BooleanField(default=False)
    user = models.ForeignKey(User, on_delete=models.SET_DEFAULT, default=None, related_name='api_products')

    youtube_url = models.CharField(max_length=255)

    img1 = models.ImageField(upload_to=image_path, default='default_product_image.jpg')
    img2 = models.ImageField(upload_to=image_path, default='default_product_image.jpg')
    img3 = models.ImageField(upload_to=image_path, default='default_product_image.jpg')
    img4 = models.ImageField(upload_to=image_path, default='default_product_image.jpg')
    img5 = models.ImageField(upload_to=image_path, default='default_product_image.jpg')

    def __str__(self):
        username = self.user.username if self.user else "Unknown User"
        return f"{self.title} - by {username}"

class Commentary(models.Model):
    id = models.AutoField(primary_key=True)
    comment = models.CharField(max_length=256)
    user_id = models.CharField(max_length=100)
    product_id = models.IntegerField()

    def __str__(self):
        return f'Commentary {self.id}'

    class Meta:
        db_table = 't_app_commentary'

class Like(models.Model):
    user = models.CharField(max_length=100)
    product = models.CharField(max_length=100)
    is_favorite = models.BooleanField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 't_app_like'

    def __str__(self):
        return f"{self.user} - {self.product} - {self.is_favorite}"
