# En api_waiver/models.py

from django.db import models
from django.contrib.auth.models import User  # Suponiendo que UserData extiende de User

class UserData(models.Model):
    user_id = models.CharField(max_length=100)
    user_name = models.CharField(max_length=100)

class Relative(models.Model):
    user = models.ForeignKey(UserData, on_delete=models.CASCADE)
    name = models.CharField(max_length=100)
    age = models.IntegerField()
