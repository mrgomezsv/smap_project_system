from django.core.management.base import BaseCommand
from t_app_product.models import ProductComment
import re


class Command(BaseCommand):
    help = 'Limpia comentarios existentes en la base de datos para eliminar caracteres corruptos'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Mostrar qué se haría sin hacer cambios reales',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        
        if dry_run:
            self.stdout.write(self.style.WARNING('MODO DRY-RUN: No se harán cambios reales'))
        
        comments = ProductComment.objects.all()
        cleaned_count = 0
        error_count = 0
        
        self.stdout.write(f'Procesando {comments.count()} comentarios...')
        
        for comment in comments:
            try:
                original_comment = comment.comment
                cleaned_comment = self.clean_comment_text(original_comment)
                
                if original_comment != cleaned_comment:
                    if not dry_run:
                        comment.comment = cleaned_comment
                        comment.save()
                    
                    self.stdout.write(f'Comentario {comment.id} limpiado:')
                    self.stdout.write(f'  Original: {repr(original_comment)}')
                    self.stdout.write(f'  Limpio: {repr(cleaned_comment)}')
                    self.stdout.write('---')
                    cleaned_count += 1
                
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f'Error procesando comentario {comment.id}: {e}')
                )
                error_count += 1
        
        if dry_run:
            self.stdout.write(
                self.style.SUCCESS(
                    f'DRY-RUN completado. Se limpiarían {cleaned_count} comentarios. '
                    f'Errores: {error_count}'
                )
            )
        else:
            self.stdout.write(
                self.style.SUCCESS(
                    f'Limpieza completada. Comentarios limpiados: {cleaned_count}. '
                    f'Errores: {error_count}'
                )
            )

    def clean_comment_text(self, text):
        """Limpia el texto del comentario eliminando caracteres corruptos"""
        if not text:
            return text
        
        # Convertir a string si es necesario
        text = str(text)
        
        # Eliminar caracteres de control excepto saltos de línea
        text = re.sub(r'[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]', '', text)
        
        # Limpiar caracteres no válidos de Unicode
        text = re.sub(r'[^\x00-\x7F\u00A0-\uFFFF]', '', text)
        
        return text.strip()
