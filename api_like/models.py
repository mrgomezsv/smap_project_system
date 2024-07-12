# models.py
from django.db import models

class Like(models.Model):
    user = models.CharField(max_length=100)
    product = models.CharField(max_length=100)
    is_favorite = models.BooleanField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 't_app_like'

    def __str__(self):
        return f"{self.user} - {self.product} - {self.is_favorite}"
