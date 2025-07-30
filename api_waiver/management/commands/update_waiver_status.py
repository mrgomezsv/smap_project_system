from django.core.management.base import BaseCommand
from django.utils import timezone
from api_waiver.models import WaiverQR

class Command(BaseCommand):
    help = 'Actualiza el estado de todos los waivers basado en su fecha de vencimiento'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Muestra qué waivers se actualizarían sin hacer cambios',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        
        # Obtener todos los waivers activos
        active_waivers = WaiverQR.objects.filter(status='ACTIVE')
        
        expired_count = 0
        updated_count = 0
        
        self.stdout.write(f"Verificando {active_waivers.count()} waivers activos...")
        
        for waiver in active_waivers:
            if waiver.is_expired():
                expired_count += 1
                
                if dry_run:
                    self.stdout.write(
                        self.style.WARNING(
                            f"DRY RUN: Waiver {waiver.qr_code} para {waiver.user_name} "
                            f"expiró el {waiver.expires_at.strftime('%Y-%m-%d %H:%M:%S')}"
                        )
                    )
                else:
                    waiver.status = 'INACTIVE'
                    waiver.save(update_fields=['status'])
                    updated_count += 1
                    
                    self.stdout.write(
                        self.style.SUCCESS(
                            f"Actualizado: Waiver {waiver.qr_code} para {waiver.user_name} "
                            f"marcado como INACTIVE"
                        )
                    )
        
        if dry_run:
            self.stdout.write(
                self.style.WARNING(
                    f"DRY RUN: {expired_count} waivers expirados encontrados"
                )
            )
        else:
            self.stdout.write(
                self.style.SUCCESS(
                    f"Proceso completado: {updated_count} waivers actualizados a INACTIVE"
                )
            ) 