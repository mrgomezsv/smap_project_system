# En api_waiver/models.py

from django.db import models

class Relative(models.Model):
    name = models.CharField(max_length=100)
    age = models.IntegerField()

class UserData(models.Model):
    user_id = models.CharField(max_length=100)
    user_name = models.CharField(max_length=100)
