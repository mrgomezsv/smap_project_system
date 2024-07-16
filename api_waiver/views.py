from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .models import WaiverData, WaiverQR
from .serializers import WaiverQRSerializer
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
        existing_qr = WaiverQR.objects.filter(user_id=user_id).first()
        if existing_qr:
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

                # Crear WaiverQR solo si no existe para este user_id
                WaiverQR.objects.create(user_id=user_id, qr_value=user_id)  # Crear con user_id

                waiver_data_objects.append(waiver_data)
            else:
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        return Response({'message': 'Datos guardados correctamente.'}, status=status.HTTP_200_OK)
    else:
        return Response({'error': 'Método no permitido'}, status=status.HTTP_405_METHOD_NOT_ALLOWED)

@api_view(['GET'])
def get_waiver_data(request, user_id):
    try:
        waiver_data = WaiverQR.objects.get(user_id=user_id)
        data = {
            'user_id': waiver_data.user_id,
            'qr_value': waiver_data.qr_value,
        }
        return Response(data, status=status.HTTP_200_OK)
    except WaiverQR.DoesNotExist:
        return Response({'error': 'No se encontraron datos para este usuario.'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET', 'POST'])
def api_waiver_qr(request):
    if request.method == 'GET':
        waivers = WaiverQR.objects.all()
        serializer = WaiverQRSerializer(waivers, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        serializer = WaiverQRSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
