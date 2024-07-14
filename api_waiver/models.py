# api_waiver/models.py

from django.db import models

class WaiverData(models.Model):
    user_id = models.CharField(max_length=100)
    user_name = models.CharField(max_length=100)
    relative_name = models.CharField(max_length=100)
    relative_age = models.IntegerField()
    timestamp = models.CharField(max_length=30)  # Cambiado a CharField

    def __str__(self):
        return f"{self.user_name}'s waiver data for {self.relative_name}"

    class Meta:
        db_table = 'api_waiver_waiverdata'


class WaiverQR(models.Model):
    waiver_data = models.OneToOneField(WaiverData, on_delete=models.CASCADE, related_name='qr_data')
    qr_value = models.CharField(max_length=100, unique=True)

    def save(self, *args, **kwargs):
        self.qr_value = f"{self.waiver_data.user_id}{self.waiver_data.timestamp}"
        super().save(*args, **kwargs)

    def __str__(self):
        return self.qr_value
