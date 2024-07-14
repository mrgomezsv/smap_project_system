# api_waiver/models.py

from django.db import models

class WaiverData(models.Model):
    user_id = models.CharField(max_length=100)
    user_name = models.CharField(max_length=100)
    relative_name = models.CharField(max_length=100)
    relative_age = models.IntegerField()
    timestamp = models.DateTimeField(auto_now_add=True)  # Ajusta según tus necesidades

    def __str__(self):
        return f"{self.user_name}'s waiver data for {self.relative_name}"


    class Meta:
        db_table = 'api_waiver_waiverdata'
