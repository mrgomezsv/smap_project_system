from django.db import models
from django.contrib.auth.models import User

# Create your models here.
class Product(models.Model):
    title = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    category = models.CharField(max_length=50)
    created = models.DateTimeField(auto_now_add=True)
    important = models.BooleanField(default=False)
    user = models.ForeignKey(User, on_delete=models.SET_DEFAULT, default=None)
    
    def __str__(self):
        return self.title + ' - by ' +self.user.username
    
