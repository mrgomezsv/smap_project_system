# api_waiver/views.py

from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .models import WaiverData, WaiverQR
from .serializers import WaiverDataSerializer

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

        # Verificar si ya existe un registro WaiverQR para este user_id
        if WaiverQR.objects.filter(waiver_data__user_id=user_id).exists():
            return Response({'message': 'Ya existe un QR para este usuario.'}, status=status.HTTP_200_OK)

        # Guardar datos del usuario y familiares en una sola tabla
        waiver_data_objects = []
        for relative_data in relatives_data:
            serializer = WaiverDataSerializer(data={
                'user_id': user_id,
                'user_name': user_name,
                'relative_name': relative_data['name'],
                'relative_age': relative_data['age'],
                'timestamp': relative_data['dateTime'],  # Ajustar nombre de campo según tu modelo
            })
            if serializer.is_valid():
                waiver_data = serializer.save()

                # Crear WaiverQR si no existe para este user_id
                qr_value = f"{user_id}{waiver_data.timestamp}"  # Usar el timestamp de WaiverData
                WaiverQR.objects.create(waiver_data=waiver_data, qr_value=qr_value)

                waiver_data_objects.append(waiver_data)
            else:
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        return Response({'message': 'Datos guardados correctamente.'}, status=status.HTTP_200_OK)
    else:
        return Response({'error': 'Método no permitido'}, status=status.HTTP_405_METHOD_NOT_ALLOWED)
