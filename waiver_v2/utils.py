import io
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
from reportlab.graphics.barcode import qr
from reportlab.graphics.shapes import Drawing
from django.conf import settings
import os
from .models import WaiverDocument

def create_waiver_pdf_buffer(waiver_qr):
    """
    Genera un PDF para un WaiverQRV2 específico con sus familiares.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=72, leftMargin=72, topMargin=72, bottomMargin=18)
    
    styles = getSampleStyleSheet()
    
    # Estilos personalizados
    title_style = ParagraphStyle(
        'TitleStyle',
        parent=styles['Heading1'],
        fontSize=18,
        alignment=1,
        spaceAfter=1,
        fontName='Helvetica-Bold'
    )
    
    subtitle_header_style = ParagraphStyle(
        'SubtitleHeader',
        parent=styles['Normal'],
        fontSize=9,
        alignment=1,
        spaceAfter=10,
        textColor=colors.grey
    )
    
    section_header_style = ParagraphStyle(
        'SectionHeader',
        parent=styles['Heading2'],
        fontSize=15,
        alignment=0,
        spaceAfter=10,
        textColor=colors.HexColor("#1e3a8a"),
        fontName='Helvetica-Bold'
    )
    
    body_style = ParagraphStyle(
        'BodyStyle',
        parent=styles['Normal'],
        fontSize=10,
        alignment=0, # Alineación a la izquierda para evitar espacios raros
        leading=14
    )
    
    elements = []
    
    # 1. Cabecera Exacta (3 Columnas: Logo - Títulos - QR)
    # Generar QR para la cabecera
    qr_code_widget = qr.QrCodeWidget(waiver_qr.qr_code)
    qr_code_widget.barWidth = 0.7*inch
    qr_code_widget.barHeight = 0.7*inch
    qr_drawing = Drawing(0.7*inch, 0.7*inch)
    qr_drawing.add(qr_code_widget)
    
    # Ruta corregida del logo
    logo_path = os.path.join(settings.BASE_DIR, 't_app_product', 'static', 'assets', 'logo.png')
    logo_img = ""
    if os.path.exists(logo_path):
        logo_img = Image(logo_path, 0.8*inch, 0.4*inch)
    
    header_titles = [
        Paragraph("DOCUMENTO DE EXENCIÓN DE RESPONSABILIDAD (WAIVER)", title_style),
        Paragraph("<b>KIDSFUN</b>", ParagraphStyle('KF', alignment=1, fontSize=11, spaceAfter=1)),
        Paragraph("Kidsfun y Fiestas Infantiles", subtitle_header_style)
    ]
    
    header_data = [
        [logo_img if logo_img else "", header_titles, [qr_drawing, Paragraph(f"<b>{waiver_qr.qr_code}</b>", ParagraphStyle('QR', fontSize=7, alignment=1))]]
    ]
    
    header_table = Table(header_data, colWidths=[1.1*inch, 4.3*inch, 1.1*inch])
    header_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('ALIGN', (0,0), (0,0), 'LEFT'),
        ('ALIGN', (2,0), (2,0), 'RIGHT'),
    ]))
    elements.append(header_table)
    elements.append(Spacer(1, 0.3*inch))
    
    # 2. Información de Registro (Azul y Compacto)
    elements.append(Paragraph("INFORMACIÓN DE REGISTRO", section_header_style))
    
    created = waiver_qr.created_at
    # Fecha en Negrita
    fecha_str = f"<b>FECHA:</b> {created.day:02d} / {created.month:02d} / {created.year}"
    
    elements.append(Paragraph("<b>CONTRATO DE EXENCIÓN DE RESPONSABILIDAD Y REGLAS DE SEGURIDAD – KIDSFUN</b>", body_style))
    elements.append(Spacer(1, 0.1*inch))
    elements.append(Paragraph(fecha_str, body_style))
    elements.append(Paragraph(f"<b>CLIENTE / RESPONSABLE:</b> &nbsp; {waiver_qr.user_name} &nbsp;", body_style))
    
    # ID y Teléfono en la misma línea (Alineados al margen izquierdo)
    id_tel_data = [[Paragraph(f"<b>ID:</b> {waiver_qr.user_id}", body_style), 
                    Paragraph("<b>TELÉFONO:</b> ____________________", body_style)]]
    id_tel_table = Table(id_tel_data, colWidths=[3.7*inch, 2.8*inch])
    id_tel_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('LEFTPADDING', (0,0), (-1,-1), 0), # Cero padding para alineación perfecta al margen
        ('RIGHTPADDING', (0,0), (-1,-1), 0),
        ('TOPPADDING', (0,0), (-1,-1), 0),
        ('BOTTOMPADDING', (0,0), (-1,-1), 0),
    ]))
    elements.append(id_tel_table)
    elements.append(Spacer(1, 0.05*inch))
    elements.append(Paragraph(f"<b>EMAIL:</b> {waiver_qr.user_email}", body_style))
    elements.append(Spacer(1, 0.3*inch))
    
    # 4. Familiares registrados
    relatives = waiver_qr.relatives.all()
    if relatives:
        elements.append(Paragraph("FAMILIARES Y ACOMPAÑANTES REGISTRADOS", section_header_style))
        data = [['Nombre del Familiar', 'Edad']]
        for rel in relatives:
            data.append([rel.relative_name, str(rel.relative_age)])
        
        table = Table(data, colWidths=[4*inch, 2.4*inch])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#f1f5f9")),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor("#1e3a8a")),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('GRID', (0, 0), (-1, -1), 1, colors.grey),
            ('FONTSIZE', (0, 1), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 1), (-1, -1), 8),
        ]))
        elements.append(table)
        elements.append(Spacer(1, 0.4*inch))
    
    # 5. Texto Legal (desde WaiverDocument)
    try:
        waiver_doc = WaiverDocument.objects.first()
        if waiver_doc and waiver_doc.content:
            elements.append(Paragraph("TÉRMINOS Y CONDICIONES", section_header_style))
            # Limpiar saltos de línea y formatear para reportlab
            content = waiver_doc.content.replace('\n', '<br/>')
            elements.append(Paragraph(content, body_style))
            elements.append(Spacer(1, 0.4*inch))
    except Exception:
        pass
    
    # 6. Sección de Firmas (Restaurada)
    elements.append(Spacer(1, 0.3*inch))
    elements.append(Paragraph("ACEPTACIÓN Y FIRMA", section_header_style))
    elements.append(Paragraph("Al generar este documento mediante el código QR y participar en las actividades, el cliente acepta todos los términos anteriormente descritos.", body_style))
    
    elements.append(Spacer(1, 0.6*inch))
    signature_data = [
        [Paragraph("________________________________<br/>Firma del Cliente / Responsable", ParagraphStyle('Sig', parent=body_style, alignment=1)),
         Paragraph("________________________________<br/>Firma de Padre o Tutor (si aplica)", ParagraphStyle('Sig', parent=body_style, alignment=1))]
    ]
    sig_table = Table(signature_data, colWidths=[3.2*inch, 3.2*inch])
    elements.append(sig_table)
    
    # 6. Pie de página (Eliminamos el QR gigante del final ya que ahora está arriba)
    elements.append(Spacer(1, 0.5*inch))
    elements.append(Paragraph(f"Este documento fue generado electrónicamente el {waiver_qr.created_at.strftime('%d/%m/%Y a las %H:%M')}.", 
                             ParagraphStyle('Footer', fontSize=8, alignment=1, textColor=colors.grey)))
    
    # Construir PDF
    doc.build(elements)
    buffer.seek(0)
    return buffer
