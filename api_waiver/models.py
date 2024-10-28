# api_waiver/models.py

from django.db import models

class WaiverData(models.Model):
    user_id = models.CharField(max_length=100)
    user_name = models.CharField(max_length=100)
    user_email = models.EmailField(max_length=255)
    relative_name = models.CharField(max_length=100)
    relative_age = models.IntegerField()
    timestamp = models.CharField(max_length=30)

    def __str__(self):
        return f"{self.user_name}'s waiver data for {self.relative_name}"

    class Meta:
        db_table = 'api_waiver_waiverdata'


class WaiverQR(models.Model):
    id = models.AutoField(primary_key=True)
    qr_value = models.CharField(max_length=100, unique=True)
    user_id = models.CharField(max_length=100, unique=True)

    def save(self, *args, **kwargs):
        self.qr_value = self.user_id
        super().save(*args, **kwargs)

    def __str__(self):
        return self.qr_value
