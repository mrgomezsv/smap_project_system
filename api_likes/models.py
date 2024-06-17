from django.db import models
from django.contrib.auth.models import User
from t_app_product.models import Product

class Like(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    liked_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 't_app_likes'
        unique_together = ('user', 'product')

    def __str__(self):
        return f'{self.user.username} likes {self.product.title}'
