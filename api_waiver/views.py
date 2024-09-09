# api_waiver/views.py

from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .models import WaiverData, WaiverQR
from .serializers import WaiverDataSerializer, WaiverQRSerializer
from .utils import create_waiver_pdf, send_email_with_pdf

@api_view(['POST'])
def api_waiver(request):
    if request.method == 'POST':
        data = request.data
        user_id = data.get('user_id', '')
        user_name = data.get('user_name', '')
        user_email = data.get('user_email', '')  # Captura el correo electrónico
        relatives_data = data.get('relatives', [])

        # Validar datos
        if not user_id or not user_name:
            return Response({'error': 'Datos de usuario incompletos.'}, status=status.HTTP_400_BAD_REQUEST)

        # Verificar si ya existe un registro WaiverQR para este user_id
        existing_qr = WaiverQR.objects.filter(user_id=user_id).first()

        # Obtener los datos almacenados de WaiverData para este usuario
        waiver_data = WaiverData.objects.filter(user_id=user_id)
        waiver_data_serializer = WaiverDataSerializer(waiver_data, many=True)

        if existing_qr:
            # Imprimir en la terminal el qr_value y los datos almacenados
            print(f"QR Value: {existing_qr.qr_value}")
            print(f"Waiver Data: {waiver_data_serializer.data}")

            # Devolver el QR junto con los datos almacenados
            return Response({
                'message': 'Ya existe un QR para este usuario.',
                'qr_value': existing_qr.qr_value,
                'waiver_data': waiver_data_serializer.data  # Enviar los datos almacenados
            }, status=status.HTTP_200_OK)

        # Guardar datos del usuario y familiares en una sola tabla
        waiver_data_objects = []
        for relative_data in relatives_data:
            serializer = WaiverDataSerializer(data={
                'user_id': user_id,
                'user_name': user_name,
                'user_email': user_email,  # Incluir el correo electrónico
                'relative_name': relative_data['name'],
                'relative_age': relative_data['age'],
                'timestamp': relative_data['dateTime'],  # Ajustar nombre de campo según tu modelo
            })
            if serializer.is_valid():
                waiver_data = serializer.save()
                waiver_data_objects.append(waiver_data)
            else:
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        # Crear WaiverQR solo si no existe para este user_id
        if not existing_qr:
            waiver_qr = WaiverQR.objects.create(user_id=user_id, qr_value=user_id)  # Crear con user_id

        # Obtener los datos almacenados de WaiverData para este usuario nuevamente
        waiver_data = WaiverData.objects.filter(user_id=user_id)
        waiver_data_serializer = WaiverDataSerializer(waiver_data, many=True)

        # Generar el PDF y enviarlo por correo
        pdf_buffer = create_waiver_pdf(user_name, user_email, relatives_data)
        send_email_with_pdf(user_email, pdf_buffer)

        # Imprimir en la terminal el qr_value y los datos almacenados
        print(f"QR Value: {waiver_qr.qr_value}")
        print(f"Waiver Data: {waiver_data_serializer.data}")

        # Devolver el qr_value junto con los datos almacenados
        return Response({
            'message': 'Datos guardados correctamente y correo enviado.',
            'qr_value': waiver_qr.qr_value,
            'waiver_data': waiver_data_serializer.data  # Enviar los datos almacenados
        }, status=status.HTTP_200_OK)

    return Response({'error': 'Método no permitido'}, status=status.HTTP_405_METHOD_NOT_ALLOWED)

@api_view(['GET'])
def get_waiver_data(request, user_id):
    try:
        # Obtener todos los datos correspondientes al user_id
        waiver_data = WaiverData.objects.filter(user_id=user_id)
        waiver_qr = WaiverQR.objects.filter(user_id=user_id).first()

        if waiver_qr is None:
            return Response({'error': 'No se encontró un QR para este usuario.'}, status=status.HTTP_404_NOT_FOUND)

        # Serializar los datos
        waiver_data_serializer = WaiverDataSerializer(waiver_data, many=True)
        waiver_qr_serializer = WaiverQRSerializer(waiver_qr)

        # Imprimir los datos en la terminal
        print(f"QR Value: {waiver_qr.qr_value}")
        print(f"Waiver Data: {waiver_data_serializer.data}")

        # Devolver los datos en la respuesta
        return Response({
            'qr_value': waiver_qr_serializer.data['qr_value'],
            'waiver_data': waiver_data_serializer.data
        }, status=status.HTTP_200_OK)

    except Exception as e:
        print(e)
        return Response({'error': 'Ocurrió un error al obtener los datos.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
