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
    id = models.AutoField(primary_key=True)  # Mantén el campo id existente
    qr_value = models.CharField(max_length=100, unique=True)
    user_id = models.CharField(max_length=100, unique=True)  # Nuevo campo user_id

    def save(self, *args, **kwargs):
        # Asigna el qr_value usando el user_id del waiver_data
        self.qr_value = self.user_id
        super().save(*args, **kwargs)

    def __str__(self):
        return self.qr_value
