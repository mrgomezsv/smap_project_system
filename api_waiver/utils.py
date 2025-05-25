# api_waiver/utils.py

from io import BytesIO
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from django.core.mail import EmailMultiAlternatives
from django.conf import settings
from django.template.loader import render_to_string
from django.utils.html import strip_tags


def create_waiver_pdf(user_name, user_email, relatives_data):
    buffer = BytesIO()
    p = canvas.Canvas(buffer, pagesize=letter)
    width, height = letter

    # Encabezado
    p.setFont("Helvetica-Bold", 16)
    p.drawString(100, height - 100, f"Waiver Data for {user_name}")
    p.setFont("Helvetica", 12)
    p.drawString(100, height - 130, f"Email: {user_email}")

    # Información de familiares
    y_position = height - 180
    for relative in relatives_data:
        p.setFont("Helvetica-Bold", 12)
        p.drawString(100, y_position, f"Relative Name: {relative['name']}")
        p.setFont("Helvetica", 12)
        p.drawString(100, y_position - 20, f"Age: {relative['age']}")
        p.drawString(100, y_position - 40, f"Timestamp: {relative['dateTime']}")
        y_position -= 80

    p.showPage()
    p.save()
    buffer.seek(0)
    return buffer


def send_email_with_pdf(user_email, pdf_buffer, user_name, qr_value, relatives_data):
    # Renderizar la plantilla HTML
    html_content = render_to_string('api_waiver/email/waiver_confirmation.html', {
        'user_name': user_name,
        'qr_value': qr_value,
        'relatives': relatives_data
    })
    
    # Crear el texto plano para clientes de correo que no soportan HTML
    text_content = strip_tags(html_content)
    
    # Crear el mensaje de correo
    email = EmailMultiAlternatives(
        subject="Confirmación de Registro - KidsFun Waiver",
        body=text_content,
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=[user_email]
    )
    
    # Adjuntar la versión HTML
    email.attach_alternative(html_content, "text/html")
    
    # Adjuntar el PDF
    email.attach('waiver_data.pdf', pdf_buffer.read(), 'application/pdf')
    
    # Enviar el correo
    try:
        email.send()
        return True
    except Exception as e:
        print(f"Error al enviar el correo: {str(e)}")
        return False
