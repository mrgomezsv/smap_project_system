import uuid
from datetime import datetime
from django.db import models
from django.utils import timezone

def generate_unique_qr():
    """Genera un código QR único de 8 caracteres"""
    return str(uuid.uuid4())[:8].upper()

class WaiverQRV2(models.Model):
    STATUS_CHOICES = [
        ('ACTIVE', 'Activo'),
        ('INACTIVE', 'Inactivo'),
    ]
    
    id = models.AutoField(primary_key=True)
    qr_code = models.CharField(max_length=8, unique=True, default=generate_unique_qr)
    user_id = models.CharField(max_length=100)
    user_name = models.CharField(max_length=100)
    user_email = models.EmailField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='ACTIVE')

    def save(self, *args, **kwargs):
        # Si es un nuevo registro, establecer la fecha de vencimiento a medianoche del día actual
        if not self.pk:
            today = timezone.now().date()
            self.expires_at = timezone.make_aware(datetime.combine(today, datetime.max.time()))
        super().save(*args, **kwargs)

    def is_expired(self):
        """Verifica si el waiver ha expirado"""
        return timezone.now() > self.expires_at

    def update_status(self):
        """Actualiza el estado basado en la fecha de vencimiento"""
        if self.is_expired() and self.status == 'ACTIVE':
            self.status = 'INACTIVE'
            self.save(update_fields=['status'])

    def __str__(self):
        return f"QR: {self.qr_code} - {self.user_name} ({self.status})"

    class Meta:
        db_table = 'waiver_v2_waiverqr'
        ordering = ['-created_at']


class WaiverDataV2(models.Model):
    waiver_qr = models.ForeignKey(WaiverQRV2, on_delete=models.CASCADE, related_name='relatives')
    relative_name = models.CharField(max_length=100)
    relative_age = models.IntegerField()
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.waiver_qr.user_name}'s waiver data for {self.relative_name}"

    class Meta:
        db_table = 'waiver_v2_waiverdata'
        ordering = ['-timestamp']
