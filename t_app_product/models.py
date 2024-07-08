# product/models.py
from django.db import models
from django.contrib.auth.models import User

CATEGORY_CHOICES = [
    ('option1', 'Bounce House'),
    ('option2', 'Electric Games'),
    ('option3', 'Furniture'),
]

class Product(models.Model):
    title = models.CharField(max_length=100)
    description = models.TextField(null=True, blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES)
    dimensions = models.CharField(max_length=50, blank=True, null=True)
    created = models.DateTimeField(auto_now_add=True)
    publicated = models.BooleanField(default=False)
    user = models.ForeignKey(User, on_delete=models.SET_DEFAULT, default=None, related_name='t_app_products')

    youtube_url = models.CharField(max_length=255)

    def __str__(self):
        return self.title + ' - by ' + self.user.username

class ProductImage(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to='product_images/', default='default_product_image.jpg')

    def __str__(self):
        return f"Image of {self.product.title}"

class ProductVideo(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='videos')
    youtube_url = models.CharField(max_length=255, default='default_youtube_url')

    def __str__(self):
        return f"Video of {self.product.title}"
