# api_waiver/models.py

from django.db import models

class WaiverData(models.Model):
    user_id = models.CharField(max_length=100)
    user_name = models.CharField(max_length=100)
    relative_name = models.CharField(max_length=100)
    relative_age = models.IntegerField()

    class Meta:
        db_table = 'api_waiver_waiverdata'
