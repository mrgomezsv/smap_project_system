from django.db import models
from django.contrib.auth.models import User

def image_path(instance, filename):
    return f'product_images/{filename}'

CATEGORY_CHOICES = [
        ('option1', 'Bounce House'),
        ('option2', 'Mechanical Games'),
        ('option3', 'Furniture'),
    ]

class Product(models.Model):
    img = models.ImageField(upload_to=image_path, default='default_product_image.jpg')
    title = models.CharField(max_length=100)
    description = models.TextField(null=True, blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES)
    dimensions = models.CharField(max_length=50, blank=True, null=True)
    created = models.DateTimeField(auto_now_add=True)
    publicated = models.BooleanField(default=False)
    user = models.ForeignKey(User, on_delete=models.SET_DEFAULT, default=None, related_name='t_app_products')

    youtube_url = models.CharField(max_length=255)

    img1 = models.ImageField(upload_to=image_path, default='default_product_image.jpg')
    img2 = models.ImageField(upload_to=image_path, default='default_product_image.jpg')
    img3 = models.ImageField(upload_to=image_path, default='default_product_image.jpg')
    img4 = models.ImageField(upload_to=image_path, default='default_product_image.jpg')
    img5 = models.ImageField(upload_to=image_path, default='default_product_image.jpg')

    def __str__(self):
        return self.title + ' - by ' + self.user.username
