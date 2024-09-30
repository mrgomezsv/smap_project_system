# api_app/views.py

from rest_framework.response import Response
from rest_framework.decorators import api_view
from t_app_product.models import WaiverValidator
from .serializers import WaiverValidatorSerializer

# Vista para verificar si un correo electrónico es un validador
@api_view(['GET'])
def check_waiver_validator(request):
    email = request.query_params.get('email')
    if not email:
        return Response({"error": "Email no proporcionado"}, status=400)

    exists = WaiverValidator.objects.filter(email=email).exists()
    return Response({"is_validator": exists})

# Vista para devolver todos los correos de validadores
@api_view(['GET'])
def list_waiver_validators(request):
    validators = WaiverValidator.objects.all()
    serializer = WaiverValidatorSerializer(validators, many=True)
    return Response(serializer.data)
