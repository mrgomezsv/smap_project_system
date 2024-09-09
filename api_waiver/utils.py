# api_waiver/utils.py

from io import BytesIO
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from django.core.mail import EmailMessage
from django.conf import settings


def create_waiver_pdf(user_name, user_email, relatives_data):
    buffer = BytesIO()
    p = canvas.Canvas(buffer, pagesize=letter)
    width, height = letter

    p.drawString(100, height - 100, f"Waiver Data for {user_name}")
    p.drawString(100, height - 130, f"Email: {user_email}")

    y_position = height - 180
    for relative in relatives_data:
        p.drawString(100, y_position, f"Relative Name: {relative['name']}")
        p.drawString(100, y_position - 20, f"Age: {relative['age']}")
        p.drawString(100, y_position - 40, f"Timestamp: {relative['dateTime']}")
        y_position -= 80

    p.showPage()
    p.save()
    buffer.seek(0)
    return buffer


def send_email_with_pdf(user_email, pdf_buffer):
    email = EmailMessage(
        subject="Your Waiver Data",
        body="Please find attached the PDF with your waiver data.",
        to=[user_email],
        from_email=settings.DEFAULT_FROM_EMAIL
    )
    email.attach('waiver_data.pdf', pdf_buffer.read(), 'application/pdf')
    email.send()
