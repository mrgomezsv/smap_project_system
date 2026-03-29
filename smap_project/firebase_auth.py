import firebase_admin
from firebase_admin import auth
from django.contrib.auth.models import User
from rest_framework import authentication
from rest_framework import exceptions

class FirebaseAuthentication(authentication.BaseAuthentication):
    def authenticate(self, request):
        auth_header = request.META.get('HTTP_AUTHORIZATION')
        if not auth_header:
            return None

        # El formato esperado es "Bearer <token>"
        id_token = auth_header.split(' ').pop()
        
        try:
            # Validar el token con Firebase Admin SDK
            decoded_token = auth.verify_id_token(id_token)
        except Exception as e:
            raise exceptions.AuthenticationFailed(f'Token de Firebase inválido: {str(e)}')

        if not decoded_token:
            return None

        try:
            uid = decoded_token.get('uid')
            user_email = decoded_token.get('email', '')
            user_name = decoded_token.get('name', uid[:10]) # Fallback al UID si no hay nombre
            
            # Obtener o crear el usuario en Django vinculado a este FID
            # Usamos el email como identificador único o el UID si no hay email
            username = user_email if user_email else uid
            
            user, created = User.objects.get_or_create(
                username=username,
                defaults={
                    'email': user_email,
                    'first_name': user_name,
                    'is_active': True
                }
            )
            
            # Guardar el UID de Firebase en un atributo extendido si es necesario (opcional)
            # user.firebase_uid = uid 
            
            return (user, None)
            
        except Exception as e:
            raise exceptions.AuthenticationFailed(f'Error al procesar el usuario de Firebase: {str(e)}')
