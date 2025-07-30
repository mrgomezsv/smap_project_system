from django.core.management.base import BaseCommand
from django.utils import timezone
from waiver_v2.models import WaiverQRV2

class Command(BaseCommand):
    help = 'Actualiza el estado de los waivers v2 basado en su fecha de vencimiento'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Muestra qué waivers se actualizarían sin hacer cambios',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        
        self.stdout.write(
            self.style.SUCCESS('🔄 Iniciando actualización de estados de waivers v2...')
        )
        
        # Obtener waivers activos que han expirado
        expired_waivers = WaiverQRV2.objects.filter(
            status='ACTIVE',
            expires_at__lt=timezone.now()
        )
        
        expired_count = expired_waivers.count()
        
        if expired_count == 0:
            self.stdout.write(
                self.style.SUCCESS('✅ No hay waivers expirados que actualizar.')
            )
            return
        
        self.stdout.write(
            f'📊 Encontrados {expired_count} waiver(s) expirado(s)'
        )
        
        if dry_run:
            self.stdout.write('🔍 Modo DRY RUN - No se harán cambios')
            for waiver in expired_waivers:
                self.stdout.write(
                    f'  - QR: {waiver.qr_code} | Usuario: {waiver.user_name} | '
                    f'Expira: {waiver.expires_at}'
                )
        else:
            # Actualizar estados
            updated_count = 0
            for waiver in expired_waivers:
                waiver.status = 'INACTIVE'
                waiver.save(update_fields=['status'])
                updated_count += 1
                
                self.stdout.write(
                    f'  ✅ QR: {waiver.qr_code} | Usuario: {waiver.user_name} | '
                    f'Estado: ACTIVE → INACTIVE'
                )
            
            self.stdout.write(
                self.style.SUCCESS(
                    f'🎉 Actualización completada: {updated_count} waiver(s) actualizado(s)'
                )
            )
        
        # Mostrar estadísticas
        total_active = WaiverQRV2.objects.filter(status='ACTIVE').count()
        total_inactive = WaiverQRV2.objects.filter(status='INACTIVE').count()
        
        self.stdout.write(
            f'\n📊 Estadísticas finales:'
        )
        self.stdout.write(
            f'  ✅ Activos: {total_active}'
        )
        self.stdout.write(
            f'  ❌ Inactivos: {total_inactive}'
        )
        self.stdout.write(
            f'  📊 Total: {total_active + total_inactive}'
        ) 