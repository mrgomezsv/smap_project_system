# api_app/views.py

from rest_framework.response import Response
from rest_framework.decorators import api_view
from t_app_product.models import WaiverValidator

@api_view(['GET'])
def check_waiver_validator(request):
    email = request.query_params.get('email')  # Obtener el email de los parámetros
    if not email:
        return Response({"error": "Email no proporcionado"}, status=400)

    # Verificar si el correo existe en la base de datos
    exists = WaiverValidator.objects.filter(email=email).exists()

    return Response({"is_validator": exists})
