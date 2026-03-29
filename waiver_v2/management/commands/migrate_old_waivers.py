from django.core.management.base import BaseCommand
from t_app_product.models import WaiverDataDB
from waiver_v2.models import WaiverQRV2, WaiverDataV2
from django.utils import timezone
from datetime import datetime
import uuid

class Command(BaseCommand):
    help = 'Migra datos antiguos de WaiverDataDB a WaiverQRV2 y WaiverDataV2'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('🚀 Iniciando migración de datos históricos...'))

        # Obtener todos los registros antiguos
        old_records = WaiverDataDB.objects.all()
        
        if not old_records.exists():
            self.stdout.write(self.style.WARNING('No se encontraron registros antiguos para migrar.'))
            return

        # Agrupar por user_id y user_name para crear un solo titular
        # En el sistema antiguo, cada familiar era una fila independiente.
        # Aquí agrupamos para que sea 1 Titular -> N Familiares.
        grouped_data = {}
        for record in old_records:
            # Usamos user_id como llave
            key = record.user_id
            if key not in grouped_data:
                grouped_data[key] = {
                    'user_id': record.user_id,
                    'user_name': record.user_name,
                    'user_email': record.user_email or 'no-email@migrated.com',
                    'timestamp': record.timestamp,
                    'family': []
                }
            
            grouped_data[key]['family'].append({
                'name': record.relative_name,
                'age': record.relative_age,
                'timestamp': record.timestamp
            })

        count_titulars = 0
        count_relatives = 0

        for user_id, data in grouped_data.items():
            # Crear el registro del titular V2
            try:
                # Parsear la fecha original si es posible
                try:
                    # Formato: 2024-09-28T12:39:08.035951
                    created_at = datetime.fromisoformat(data['timestamp'].split('.')[0])
                    created_at = timezone.make_aware(created_at)
                except Exception:
                    created_at = timezone.now()

                # Verificar si ya existe un waiver migrado para este user
                # (Para evitar duplicidades si se corre el comando dos veces)
                if WaiverQRV2.objects.filter(user_id=user_id, status='MIGRATED').exists():
                    self.stdout.write(f'⚠️ Saltando {data["user_name"]} (ya migrado)')
                    continue

                waiver_qr = WaiverQRV2.objects.create(
                    user_id=user_id,
                    user_name=data['user_name'],
                    user_email=data['user_email'],
                    created_at=created_at,
                    status='MIGRATED' # Marcamos como migrado para auditoría
                )
                count_titulars += 1

                # Crear los familiares
                for fam in data['family']:
                    try:
                        fam_timestamp = datetime.fromisoformat(fam['timestamp'].split('.')[0])
                        fam_timestamp = timezone.make_aware(fam_timestamp)
                    except Exception:
                        fam_timestamp = created_at

                    WaiverDataV2.objects.create(
                        waiver_qr=waiver_qr,
                        relative_name=fam['name'],
                        relative_age=fam['age'],
                        timestamp=fam_timestamp
                    )
                    count_relatives += 1
                
                self.stdout.write(self.style.SUCCESS(f'✅ Migrado: {data["user_name"]} con {len(data["family"])} familiares.'))

            except Exception as e:
                self.stdout.write(self.style.ERROR(f'❌ Error migrantes {data["user_name"]}: {str(e)}'))

        self.stdout.write(self.style.SUCCESS(f'\n🎉 Migración completada.'))
        self.stdout.write(f'Titulares creados: {count_titulars}')
        self.stdout.write(f'Familiares creados: {count_relatives}')
