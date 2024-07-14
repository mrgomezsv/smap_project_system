# En api_waiver/views.py

from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .models import WaiverData
from .serializers import WaiverDataSerializer
from datetime import datetime
from django.utils.dateparse import parse_datetime

@api_view(['POST'])
def api_waiver(request):
    if request.method == 'POST':
        data = request.data
        user_id = data.get('user_id', '')
        user_name = data.get('user_name', '')
        relatives_data = data.get('relatives', [])

        # Validar datos
        if not user_id or not user_name:
            return Response({'error': 'Datos de usuario incompletos.'}, status=status.HTTP_400_BAD_REQUEST)

        # Guardar datos del usuario y familiares en una sola tabla
        waiver_data_objects = []
        for relative_data in relatives_data:
            serializer = WaiverDataSerializer(data={
                'user_id': user_id,
                'user_name': user_name,
                'relative_name': relative_data['name'],
                'relative_age': relative_data['age'],
                'created_at': parse_datetime(relative_data['dateTime']),  # Ajustar según tu modelo y campo
            })
            if serializer.is_valid():
                waiver_data_objects.append(serializer.save())
            else:
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        return Response({'message': 'Datos guardados correctamente.'}, status=status.HTTP_200_OK)
    else:
        return Response({'error': 'Método no permitido'}, status=status.HTTP_405_METHOD_NOT_ALLOWED)
