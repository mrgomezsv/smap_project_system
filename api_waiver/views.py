# En api_waiver/views.py

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from .models import Relative, UserData
import json

@csrf_exempt
def api_waiver(request):
    if request.method == 'POST':
        # Parsear y guardar datos recibidos desde Flutter
        data = json.loads(request.body)
        relatives_data = data.get('relatives', [])
        user_id = data.get('user_id', '')
        user_name = data.get('user_name', '')

        # Guardar datos del usuario si no existe
        user_data, created = UserData.objects.get_or_create(user_id=user_id, defaults={'user_name': user_name})

        # Guardar datos de familiares asociados al usuario
        for relative_data in relatives_data:
            Relative.objects.create(user=user_data, name=relative_data['name'], age=relative_data['age'])

        return JsonResponse({'message': 'Datos guardados correctamente.'}, status=200)
    else:
        return JsonResponse({'error': 'Método no permitido.'}, status=405)
