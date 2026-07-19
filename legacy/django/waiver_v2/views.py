from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from .models import WaiverQRV2, WaiverScanV2
from .serializers import WaiverQRV2Serializer, WaiverCreateV2Serializer, WaiverScanV2Serializer
from .utils import create_waiver_pdf_buffer
from t_app_product.utils import send_waiver_confirmation_email
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from django.contrib.auth.decorators import login_required
import tempfile
import os

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def api_waiver_v2(request):
    """API para crear waivers con QR único y vencimiento automático"""
    if request.method == 'POST':
        data = request.data
        # Para seguridad, usamos el ID del usuario autenticado (UID de Firebase)
        # Esto previene que un usuario intente crear waivers para otro enviando un user_id manual.
        user_id = getattr(request.user, 'username', data.get('user_id', ''))
        user_name = data.get('user_name', '')
        user_email = data.get('user_email', '')
        relatives_data = data.get('relatives', [])

        # Validar datos
        if not user_id or not user_name or not user_email:
            return Response({
                'error': 'Datos de usuario incompletos. Se requiere user_id, user_name y user_email.'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Eliminamos la restricción de un solo waiver activo por día
        # El usuario ahora puede generar múltiples waivers si así lo desea.

        # Crear nuevo waiver
        try:
            serializer = WaiverCreateV2Serializer(data={
                'user_id': user_id,
                'user_name': user_name,
                'user_email': user_email,
                'relatives': relatives_data
            })
            
            if serializer.is_valid():
                waiver_qr = serializer.save()
                
                # Generar el PDF usando la nueva utilidad
                pdf_buffer = create_waiver_pdf_buffer(waiver_qr)
                
                # Guardar PDF temporalmente para adjuntarlo al correo
                pdf_path = None
                if pdf_buffer:
                    with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as tmp_file:
                        tmp_file.write(pdf_buffer.getvalue())
                        pdf_path = tmp_file.name

                # Preparar datos para el correo
                user_data = {
                    'user_name': user_name,
                    'user_email': user_email,
                    'relatives': relatives_data,
                    'timestamp': timezone.now().strftime('%Y-%m-%d %H:%M:%S')
                }

                # Enviar el correo electrónico
                email_sent = send_waiver_confirmation_email(
                    user_data=user_data,
                    qr_value=waiver_qr.qr_code,
                    pdf_path=pdf_path
                )

                # Limpiar archivo temporal
                if pdf_path and os.path.exists(pdf_path):
                    os.unlink(pdf_path)

                # Serializar la respuesta
                response_serializer = WaiverQRV2Serializer(waiver_qr)
                
                return Response({
                    'message': 'Waiver creado exitosamente y correo enviado.',
                    'waiver': response_serializer.data,
                    'email_sent': email_sent,
                    'is_new': True
                }, status=status.HTTP_201_CREATED)
            else:
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            return Response({
                'error': f'Error al crear el waiver: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    return Response({'error': 'Método no permitido'}, status=status.HTTP_405_METHOD_NOT_ALLOWED)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_waiver_data_v2(request, qr_code):
    """Obtener datos de waiver por código QR"""
    try:
        # Buscar waiver por código QR
        waiver_qr = WaiverQRV2.objects.filter(qr_code=qr_code.upper()).first()

        if waiver_qr is None:
            return Response({'error': 'QR no encontrado.'}, status=status.HTTP_404_NOT_FOUND)

        # Actualizar estado si es necesario
        waiver_qr.update_status()

        # Serializar los datos
        data = WaiverQRV2Serializer(waiver_qr).data
        # Añadir qr_value para compatibilidad con Flutter
        data['qr_value'] = waiver_qr.qr_code
        
        return Response({
            'waiver': data,
            'is_valid': waiver_qr.status == 'ACTIVE' and not waiver_qr.is_expired()
        }, status=status.HTTP_200_OK)

    except Exception as e:
        return Response({
            'error': f'Error al obtener datos del waiver: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_waivers_v2(request, user_id):
    """Obtener todos los waivers de un usuario"""
    # Seguridad: Un usuario solo puede ver sus propios waivers
    if getattr(request.user, 'username', '') != user_id:
        return Response({'error': 'No tienes permiso para ver los waivers de este usuario.'}, status=status.HTTP_403_FORBIDDEN)

    try:
        waivers = WaiverQRV2.objects.filter(user_id=user_id).order_by('-created_at')
        
        # Actualizar estados de todos los waivers
        for waiver in waivers:
            waiver.update_status()
        
        serializer = WaiverQRV2Serializer(waivers, many=True)
        
        return Response({
            'waivers': serializer.data,
            'total_count': len(serializer.data)
        }, status=status.HTTP_200_OK)

    except Exception as e:
        return Response({
            'error': f'Error al obtener waivers del usuario: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def validate_waiver_v2(request):
    """Validar un waiver por código QR"""
    if request.method == 'POST':
        qr_code = request.data.get('qr_code', '').upper()
        
        if not qr_code:
            return Response({
                'error': 'Código QR requerido.'
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            waiver_qr = WaiverQRV2.objects.filter(qr_code=qr_code).first()

            if waiver_qr is None:
                return Response({
                    'valid': False,
                    'message': 'QR no encontrado.'
                }, status=status.HTTP_404_NOT_FOUND)

            # Actualizar estado
            waiver_qr.update_status()

            # Verificar si es válido
            is_valid = waiver_qr.status == 'ACTIVE' and not waiver_qr.is_expired()

            if is_valid:
                # REGISTRAR EL ESCANEO
                # El usuario autenticado es quien realiza el escaneo (Colaborador)
                scanned_by = getattr(request.user, 'email', 'unknown-collaborator')
                WaiverScanV2.objects.create(
                    waiver_qr=waiver_qr,
                    scanned_by=scanned_by
                )

            # Serializar y añadir qr_value para compatibilidad
            data = WaiverQRV2Serializer(waiver_qr).data
            data['qr_value'] = waiver_qr.qr_code

            return Response({
                'valid': is_valid,
                'waiver': data,
                'message': 'Waiver validado y escaneo registrado con éxito.' if is_valid else 'Waiver expirado o inactivo.'
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({
                'error': f'Error al validar waiver: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    return Response({'error': 'Método no permitido'}, status=status.HTTP_405_METHOD_NOT_ALLOWED)

@login_required
def download_waiver_pdf(request, qr_code):
    """Vista para descargar el PDF de un waiver existente (para el admin)"""
    waiver_qr = get_object_or_404(WaiverQRV2, qr_code=qr_code.upper())
    
    pdf_buffer = create_waiver_pdf_buffer(waiver_qr)
    
    response = HttpResponse(pdf_buffer.getvalue(), content_type='application/pdf')
    response['Content-Disposition'] = f'attachment; filename="Waiver_{waiver_qr.qr_code}.pdf"'
    
    return response

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_collaborator_scans_v2(request):
    """Obtener el historial de escaneos realizados por el colaborador actual"""
    email = getattr(request.user, 'email', None)
    if not email:
        return Response({'error': 'No se pudo identificar al colaborador'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        scans = WaiverScanV2.objects.filter(scanned_by=email).order_by('-scanned_at')
        serializer = WaiverScanV2Serializer(scans, many=True)
        return Response({
            'scans': serializer.data,
            'total_count': len(serializer.data)
        }, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
