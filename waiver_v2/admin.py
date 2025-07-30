from django.contrib import admin
from django.utils.html import format_html
from django.utils import timezone
from .models import WaiverQRV2, WaiverDataV2

@admin.register(WaiverDataV2)
class WaiverDataV2Admin(admin.ModelAdmin):
    list_display = ['relative_name', 'relative_age', 'waiver_qr', 'timestamp']
    list_filter = ['timestamp', 'relative_age']
    search_fields = ['relative_name', 'waiver_qr__user_name', 'waiver_qr__qr_code']
    readonly_fields = ['timestamp']

@admin.register(WaiverQRV2)
class WaiverQRV2Admin(admin.ModelAdmin):
    list_display = [
        'qr_code', 'user_name', 'user_email', 'status', 
        'created_at', 'expires_at', 'is_expired_display', 'relatives_count'
    ]
    list_filter = [
        'status', 
        'created_at', 
        'expires_at',
        ('created_at', admin.DateFieldListFilter),
        ('expires_at', admin.DateFieldListFilter),
    ]
    search_fields = ['qr_code', 'user_name', 'user_email', 'user_id']
    readonly_fields = ['qr_code', 'created_at', 'expires_at', 'is_expired_display']
    date_hierarchy = 'created_at'
    
    fieldsets = (
        ('Información del QR', {
            'fields': ('qr_code', 'status')
        }),
        ('Información del Usuario', {
            'fields': ('user_id', 'user_name', 'user_email')
        }),
        ('Fechas', {
            'fields': ('created_at', 'expires_at', 'is_expired_display')
        }),
    )
    
    def is_expired_display(self, obj):
        """Muestra si el waiver ha expirado"""
        if obj.is_expired():
            return format_html(
                '<span style="color: red; font-weight: bold;">EXPIRADO</span>'
            )
        else:
            return format_html(
                '<span style="color: green; font-weight: bold;">VÁLIDO</span>'
            )
    is_expired_display.short_description = 'Estado de Vencimiento'
    
    def relatives_count(self, obj):
        """Cuenta el número de familiares"""
        return obj.relatives.count()
    relatives_count.short_description = 'Familiares'
    
    def get_queryset(self, request):
        """Actualiza automáticamente el estado de los waivers"""
        queryset = super().get_queryset(request)
        
        # Actualizar estados de waivers expirados
        for waiver in queryset.filter(status='ACTIVE'):
            waiver.update_status()
        
        return queryset
    
    actions = ['mark_as_inactive', 'mark_as_active', 'update_expired_status']
    
    def mark_as_inactive(self, request, queryset):
        """Marcar waivers seleccionados como inactivos"""
        updated = queryset.update(status='INACTIVE')
        self.message_user(
            request, 
            f'{updated} waiver(s) marcado(s) como inactivo(s).'
        )
    mark_as_inactive.short_description = "Marcar como inactivo"
    
    def mark_as_active(self, request, queryset):
        """Marcar waivers seleccionados como activos"""
        updated = queryset.update(status='ACTIVE')
        self.message_user(
            request, 
            f'{updated} waiver(s) marcado(s) como activo(s).'
        )
    mark_as_active.short_description = "Marcar como activo"
    
    def update_expired_status(self, request, queryset):
        """Actualizar estado de waivers expirados"""
        updated = 0
        for waiver in queryset:
            if waiver.is_expired() and waiver.status == 'ACTIVE':
                waiver.status = 'INACTIVE'
                waiver.save(update_fields=['status'])
                updated += 1
        
        self.message_user(
            request, 
            f'{updated} waiver(s) expirado(s) actualizado(s) a inactivo.'
        )
    update_expired_status.short_description = "Actualizar waivers expirados"
