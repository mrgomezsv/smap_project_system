from django.utils.deprecation import MiddlewareMixin
from django.utils import translation
from django.conf import settings
import locale as system_locale  # Renombrar para evitar conflicto


class LanguageDetectionMiddleware(MiddlewareMixin):
    """
    Middleware para detectar automáticamente el idioma del navegador
    y establecer el idioma de Django en consecuencia.
    """
    
    def process_request(self, request):
        # Obtener el idioma preferido del navegador
        browser_language = request.META.get('HTTP_ACCEPT_LANGUAGE', '')
        
        # Mapear códigos de idioma del navegador a códigos de Django
        language_mapping = {
            'en': 'en',
            'en-us': 'en',
            'en-gb': 'en',
            'es': 'es',
            'es-es': 'es',
            'es-mx': 'es',
            'es-ar': 'es',
            'es-cl': 'es',
            'es-co': 'es',
            'es-pe': 'es',
            'es-ve': 'es',
            'es-gt': 'es',
            'es-cr': 'es',
            'es-pa': 'es',
            'es-do': 'es',
            'es-ec': 'es',
            'es-cu': 'es',
            'es-bo': 'es',
            'es-hn': 'es',
            'es-py': 'es',
            'es-ni': 'es',
            'es-sv': 'es',
            'es-uy': 'es',
            'es-gq': 'es',
        }
        
        # Detectar idioma del navegador
        detected_language = None
        
        if browser_language:
            # Parsear el header Accept-Language
            for lang_code in browser_language.split(','):
                lang_code = lang_code.strip().lower().split(';')[0]
                
                # Buscar coincidencia exacta
                if lang_code in language_mapping:
                    detected_language = language_mapping[lang_code]
                    break
                
                # Buscar coincidencia parcial (ej: 'en' en 'en-us')
                for browser_lang, django_lang in language_mapping.items():
                    if lang_code.startswith(browser_lang) or browser_lang.startswith(lang_code):
                        detected_language = django_lang
                        break
                
                if detected_language:
                    break
        
        # Si no se detectó idioma, usar español por defecto
        if not detected_language:
            detected_language = 'es'
        
        # Verificar que el idioma detectado esté soportado
        if detected_language not in [lang[0] for lang in settings.LANGUAGES]:
            detected_language = 'es'
        
        # Establecer el idioma en Django
        translation.activate(detected_language)
        request.LANGUAGE_CODE = detected_language
        
        return None
