from rest_framework.decorators import api_view, parser_classes
from rest_framework.parsers import MultiPartParser, FormParser
from django.http import JsonResponse, HttpResponse, HttpResponseBadRequest
from django.conf import settings
import io
import os
from datetime import datetime
import importlib
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import LETTER
from reportlab.lib.units import inch
from reportlab.lib.utils import ImageReader


def _extract_text_from_file(uploaded_file):
    name = uploaded_file.name.lower()
    content = uploaded_file.read()
    uploaded_file.seek(0)
    if name.endswith('.pdf'):
        pdfminer = importlib.import_module('pdfminer.high_level') if importlib.util.find_spec('pdfminer.high_level') else None
        pdf_extract_text = getattr(pdfminer, 'extract_text', None) if pdfminer else None
        with io.BytesIO(content) as f:
            try:
                return pdf_extract_text(f)
            except Exception:
                return ''
    if name.endswith('.docx'):
        docx_mod = importlib.import_module('docx') if importlib.util.find_spec('docx') else None
        Document = getattr(docx_mod, 'Document', None) if docx_mod else None
        with io.BytesIO(content) as f:
            document = Document(f)
            return "\n".join([p.text for p in document.paragraphs])
    try:
        return content.decode('utf-8', errors='ignore')
    except Exception:
        return ''


def _simple_resume_struct(text: str):
    import re
    email_match = re.search(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}", text)
    phone_match = re.search(r"(?:\+?\d{1,3}[\s-]?)?(?:\(\d{2,4}\)[\s-]?)?\d{7,10}", text)
    first_line = text.strip().splitlines()[0] if text.strip().splitlines() else ''
    name_match = re.match(r"([A-ZÁÉÍÓÚÑ][A-Za-zÁÉÍÓÚÑáéíóúñ'`-]+(?:\s+[A-ZÁÉÍÓÚÑ][A-Za-zÁÉÍÓÚÑáéíóúñ'`-]+){1,3})", first_line)
    skills = []
    for line in text.splitlines():
        if any(sep in line for sep in [',', ';', '•', ' - ']):
            parts = re.split(r"[,;•\-]\s*", line)
            for p in parts:
                p = p.strip()
                if 2 < len(p) < 40 and p.lower() not in ['-']:
                    skills.append(p)
    skills = list(dict.fromkeys(skills))[:20]
    return {
        'fullName': name_match.group(1) if name_match else None,
        'email': email_match.group(0) if email_match else None,
        'phone': phone_match.group(0) if phone_match else None,
        'skills': skills,
    }


@api_view(['POST'])
@parser_classes([MultiPartParser, FormParser])
def cv_analyze(request):
    if 'file' not in request.FILES:
        return HttpResponseBadRequest('No file uploaded')
    uploaded = request.FILES['file']
    text = _extract_text_from_file(uploaded)
    data = _simple_resume_struct(text)
    data.update({
        'sourceFileName': uploaded.name,
        'analyzedAt': datetime.utcnow().isoformat() + 'Z',
    })
    return JsonResponse({'status': 'success', 'data': data})


@api_view(['POST'])
@parser_classes([FormParser, MultiPartParser])
def cv_harvard_pdf(request):
    full_name = request.data.get('fullName', 'Candidato')
    email = request.data.get('email', '')
    phone = request.data.get('phone', '')
    skills_csv = request.data.get('skills', '')
    summary = request.data.get('summary', 'Resumen profesional')
    experience = request.data.get('experience', '')
    education = request.data.get('education', '')
    skills = [s.strip() for s in skills_csv.split(',') if s.strip()]

    buf = io.BytesIO()
    c = canvas.Canvas(buf, pagesize=LETTER)
    width, height = LETTER

    logo_path_candidates = [
        os.path.join(settings.BASE_DIR, 'staticfiles', 'assets', 'app_logo.png'),
        os.path.join(settings.BASE_DIR, 'kidsfun_web', 'static', 'assets', 'logo.png'),
        os.path.join(settings.BASE_DIR, 'staticfiles', 'img', 'cropped-Logo-Arcoiris-1-396x41.png')
    ]
    logo_path = next((p for p in logo_path_candidates if os.path.exists(p)), None)
    if logo_path:
        try:
            img = ImageReader(logo_path)
            c.drawImage(img, width - 1.8*inch, height - 1.0*inch, width=1.5*inch, preserveAspectRatio=True, mask='auto')
        except Exception:
            pass

    c.setFont('Helvetica-Bold', 16)
    c.drawString(1*inch, height - 1*inch, full_name)
    c.setFont('Helvetica', 10)
    c.drawString(1*inch, height - 1.2*inch, f"Email: {email}     Tel: {phone}")

    y = height - 1.6*inch
    def heading(text):
        nonlocal y
        c.setFont('Helvetica-Bold', 12)
        c.drawString(1*inch, y, text)
        y -= 0.2*inch
        c.setFont('Helvetica', 10)

    def paragraph(text):
        nonlocal y
        for line in text.split('\n'):
            c.drawString(1*inch, y, line[:110])
            y -= 0.18*inch

    heading('RESUMEN PROFESIONAL')
    paragraph(summary)
    y -= 0.1*inch
    heading('EXPERIENCIA')
    paragraph(experience or 'Experiencia no especificada')
    y -= 0.1*inch
    heading('EDUCACIÓN')
    paragraph(education or 'Educación no especificada')
    y -= 0.1*inch
    heading('HABILIDADES')
    paragraph(', '.join(skills) or 'No especificadas')

    c.showPage()
    c.save()
    buf.seek(0)
    response = HttpResponse(buf.read(), content_type='application/pdf')
    response['Content-Disposition'] = f'attachment; filename="cv_lumina_{full_name.replace(" ", "_")}.pdf"'
    return response
