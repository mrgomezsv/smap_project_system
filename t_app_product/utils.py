import os
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

def send_email_with_template(
    subject, 
    template_name, 
    context, 
    to_email, 
    from_email=None,
    attachments=None
):
    """
    Envía un correo electrónico usando una plantilla HTML
    
    Args:
        subject (str): Asunto del correo
        template_name (str): Nombre de la plantilla HTML
        context (dict): Contexto para la plantilla
        to_email (str): Email del destinatario
        from_email (str): Email del remitente (opcional)
        attachments (list): Lista de archivos adjuntos (opcional)
    
    Returns:
        bool: True si se envió correctamente, False en caso contrario
    """
    try:
        # Renderizar la plantilla HTML
        html_content = render_to_string(template_name, context)
        
        # Crear versión de texto plano
        text_content = strip_tags(html_content)
        
        # Configurar el remitente
        if not from_email:
            from_email = settings.DEFAULT_FROM_EMAIL
        
        # Crear el mensaje
        email = EmailMultiAlternatives(
            subject=subject,
            body=text_content,
            from_email=from_email,
            to=[to_email]
        )
        
        # Agregar contenido HTML
        email.attach_alternative(html_content, "text/html")
        
        # Agregar archivos adjuntos si existen
        if attachments:
            for attachment in attachments:
                if os.path.exists(attachment['path']):
                    with open(attachment['path'], 'rb') as f:
                        email.attach(
                            filename=attachment['filename'],
                            content=f.read(),
                            mimetype=attachment.get('mimetype', 'application/octet-stream')
                        )
        
        # Enviar el correo
        email.send()
        
        logger.info(f"Correo enviado exitosamente a {to_email}")
        return True
        
    except Exception as e:
        logger.error(f"Error enviando correo a {to_email}: {str(e)}")
        return False

def send_waiver_confirmation_email(user_data, qr_value, pdf_path=None):
    """
    Envía el correo de confirmación del waiver
    
    Args:
        user_data (dict): Datos del usuario
        qr_value (str): Valor del código QR
        pdf_path (str): Ruta al archivo PDF (opcional)
    
    Returns:
        bool: True si se envió correctamente
    """
    subject = f"Confirmación de Waiver - {user_data.get('user_name', 'Usuario')}"
    
    context = {
        'user_name': user_data.get('user_name', ''),
        'user_email': user_data.get('user_email', ''),
        'qr_value': qr_value,
        'relatives': user_data.get('relatives', []),
        'timestamp': user_data.get('timestamp', ''),
    }
    
    attachments = []
    if pdf_path and os.path.exists(pdf_path):
        attachments.append({
            'path': pdf_path,
            'filename': f'waiver_{qr_value}.pdf',
            'mimetype': 'application/pdf'
        })
    
    return send_email_with_template(
        subject=subject,
        template_name='api_waiver/email/waiver_confirmation.html',
        context=context,
        to_email=user_data.get('user_email', ''),
        attachments=attachments
    )

def send_welcome_email(user_email, user_name):
    """
    Envía correo de bienvenida
    
    Args:
        user_email (str): Email del usuario
        user_name (str): Nombre del usuario
    
    Returns:
        bool: True si se envió correctamente
    """
    subject = f"¡Bienvenido a KidsFun, {user_name}!"
    
    context = {
        'user_name': user_name,
        'welcome_message': 'Gracias por registrarte en nuestro sistema de gestión de fiestas infantiles.'
    }
    
    return send_email_with_template(
        subject=subject,
        template_name='t_app_product/email/welcome.html',
        context=context,
        to_email=user_email
    )

def send_notification_email(user_email, subject, message):
    """
    Envía correo de notificación simple
    
    Args:
        user_email (str): Email del usuario
        subject (str): Asunto del correo
        message (str): Mensaje del correo
    
    Returns:
        bool: True si se envió correctamente
    """
    context = {
        'message': message
    }
    
    return send_email_with_template(
        subject=subject,
        template_name='t_app_product/email/notification.html',
        context=context,
        to_email=user_email
    ) 