"""
Configuración local para desarrollo sin APIs
"""
from .settings import *

# Excluir aplicaciones de API que no se necesitan para desarrollo local
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'corsheaders',
    't_app_product',
    # 'api',  # Comentado
    # 'api_commentary',  # Comentado
    # 'api_like',  # Comentado
    # 'api_waiver',  # Comentado
    # 'api_waiver_validator',  # Comentado
    'waiver_v2',
    'kidsfun_web',
    'rest_framework',
]

# Configuración de base de datos remota
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'smap_kf',
        'USER': 'mrgomez',
        'PASSWORD': 'Karin2100',
        'HOST': '82.165.210.146',
        'PORT': '5432',
    }
}

# Configuración de seguridad para desarrollo
SECURE_SSL_REDIRECT = False
SESSION_COOKIE_SECURE = False
CSRF_COOKIE_SECURE = False

# Configuración de CORS para desarrollo
CORS_ALLOWED_ORIGINS = [
    "http://localhost:8000",
    "http://127.0.0.1:8000",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

# Configuración de hosts permitidos para desarrollo
ALLOWED_HOSTS = ['localhost', '127.0.0.1']

# Configuración de email para desarrollo (usar consola)
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'

# Usar URLs locales sin APIs
ROOT_URLCONF = 'smap_project.urls_local'

print("🔧 Configuración local sin APIs activa") 