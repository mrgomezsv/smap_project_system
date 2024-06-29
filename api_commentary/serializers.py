# api_commentary/serializers.py

from rest_framework import serializers
from .models import Commentary
from firebase_admin import auth

class CommentarySerializer(serializers.ModelSerializer):
    # Agregar un campo para el nombre de usuario
    user_display_name = serializers.SerializerMethodField()

    class Meta:
        model = Commentary
        fields = ('id', 'comment', 'user_id', 'product_id', 'user_display_name')

    def get_user_display_name(self, obj):
        # Obtener el nombre de usuario desde Firebase
        user_id = obj.user_id  # Asume que user_id es un campo en Commentary
        if user_id:
            try:
                user = auth.get_user(user_id)
                return user.display_name
            except auth.AuthError as e:
                # Manejar errores de autenticación si es necesario
                return "Nombre de usuario no disponible"

        return "Nombre de usuario no disponible"  # Manejo por defecto si no hay user_id o no se puede obtener el nombre
