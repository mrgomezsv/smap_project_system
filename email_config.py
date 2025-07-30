"""
Configuración de correo electrónico para KidsFun
Este archivo contiene las configuraciones para diferentes proveedores de correo
"""

import os
from django.conf import settings

# Configuraciones para diferentes proveedores de correo

EMAIL_CONFIGS = {
    'gmail': {
        'BACKEND': 'django.core.mail.backends.smtp.EmailBackend',
        'HOST': 'smtp.gmail.com',
        'PORT': 587,
        'USE_TLS': True,
        'USER': 'kidsfun.developer@gmail.com',
        'PASSWORD': 'Karin2100',  # Cambiar por contraseña de aplicación
        'DEFAULT_FROM': 'kidsfun.developer@gmail.com'
    },
    
    'sendgrid': {
        'BACKEND': 'django.core.mail.backends.smtp.EmailBackend',
        'HOST': 'smtp.sendgrid.net',
        'PORT': 587,
        'USE_TLS': True,
        'USER': 'apikey',  # Siempre es 'apikey' para SendGrid
        'PASSWORD': 'TU_API_KEY_AQUI',  # Tu API key de SendGrid
        'DEFAULT_FROM': 'noreply@kidsfunyfiestasinfantiles.com'
    },
    
    'mailgun': {
        'BACKEND': 'django.core.mail.backends.smtp.EmailBackend',
        'HOST': 'smtp.mailgun.org',
        'PORT': 587,
        'USE_TLS': True,
        'USER': 'postmaster@tu-dominio.mailgun.org',
        'PASSWORD': 'TU_PASSWORD_AQUI',
        'DEFAULT_FROM': 'noreply@tu-dominio.com'
    },
    
    'resend': {
        'BACKEND': 'django.core.mail.backends.smtp.EmailBackend',
        'HOST': 'smtp.resend.com',
        'PORT': 587,
        'USE_TLS': True,
        'USER': 'resend',
        'PASSWORD': 'TU_API_KEY_AQUI',
        'DEFAULT_FROM': 'noreply@tu-dominio.com'
    }
}

def get_email_config(provider='gmail'):
    """
    Obtiene la configuración de correo para el proveedor especificado
    
    Args:
        provider (str): Proveedor de correo ('gmail', 'sendgrid', 'mailgun', 'resend')
    
    Returns:
        dict: Configuración del proveedor
    """
    return EMAIL_CONFIGS.get(provider, EMAIL_CONFIGS['gmail'])

def setup_email_settings(provider='gmail'):
    """
    Configura las variables de settings de Django para el proveedor especificado
    
    Args:
        provider (str): Proveedor de correo
    """
    config = get_email_config(provider)
    
    # Actualizar settings de Django
    settings.EMAIL_BACKEND = config['BACKEND']
    settings.EMAIL_HOST = config['HOST']
    settings.EMAIL_PORT = config['PORT']
    settings.EMAIL_USE_TLS = config['USE_TLS']
    settings.EMAIL_HOST_USER = config['USER']
    settings.EMAIL_HOST_PASSWORD = config['PASSWORD']
    settings.DEFAULT_FROM_EMAIL = config['DEFAULT_FROM']

# Configuración para desarrollo (mostrar correos en consola)
DEVELOPMENT_CONFIG = {
    'BACKEND': 'django.core.mail.backends.console.EmailBackend',
    'HOST': '',
    'PORT': '',
    'USE_TLS': False,
    'USER': '',
    'PASSWORD': '',
    'DEFAULT_FROM': 'noreply@kidsfun.com'
}

def setup_development_email():
    """Configura el backend de consola para desarrollo"""
    settings.EMAIL_BACKEND = DEVELOPMENT_CONFIG['BACKEND']
    settings.DEFAULT_FROM_EMAIL = DEVELOPMENT_CONFIG['DEFAULT_FROM'] 