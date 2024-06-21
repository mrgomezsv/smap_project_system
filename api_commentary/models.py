# api_commentary/models.py

from django.db import models
from django.contrib.auth.models import User  # Si estás usando el modelo User de Django

class Commentary(models.Model):
    id = models.AutoField(primary_key=True)
    comment = models.CharField(max_length=256)
    user_id = models.CharField(max_length=100)  # Id del usuario de Firebase
    product_id = models.IntegerField()  # Id del producto

    def __str__(self):
        return f'Commentary {self.id}'

    class Meta:
        db_table = 't_app_commentary'  # Nombre específico de la tabla en la base de datos
