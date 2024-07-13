# api_waiver/views.py
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

        # Guardar datos del usuario
        user_data = UserData.objects.create(user_id=user_id, user_name=user_name)

        # Guardar datos de familiares
        for relative_data in relatives_data:
            Relative.objects.create(name=relative_data['name'], age=relative_data['age'])

        return JsonResponse({'message': 'Datos guardados correctamente.'}, status=200)
    elif request.method == 'GET':
        # Aquí puedes manejar la lógica para devolver datos si se realiza una solicitud GET
        # Por ejemplo, puedes devolver una lista de datos guardados o información sobre la API
        return JsonResponse({'info': 'Esta es la API Waiver. Para usarla, realiza una solicitud POST con los datos adecuados.'}, status=200)
    else:
        return JsonResponse({'error': 'Método no permitido.'}, status=405)
