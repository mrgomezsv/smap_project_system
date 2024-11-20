# He comentad este codigo para que la API no haga POST,
# por el momento solo me interesa que haga GET

# from rest_framework import generics
# from t_app_product.models import Product  # Importa el modelo de tu aplicación
#
# from .serializers import ProductSerializer
#
# class ProductListCreate(generics.ListCreateAPIView):
#     queryset = Product.objects.all()
#     serializer_class = ProductSerializer


# Solo hace GET
from rest_framework.response import Response
from rest_framework import generics
from t_app_product.models import Product
from .serializers import ProductSerializer

class ProductListCreate(generics.ListAPIView):
    serializer_class = ProductSerializer

    def get_queryset(self):
        # Filtra los productos para mostrar solo aquellos que están publicados
        return Product.objects.filter(publicated=True)

    def list(self, request, *args, **kwargs):
        # Serializamos los datos
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)

        # Devolvemos los datos asegurándonos de que estén en UTF-8
        return Response(serializer.data, content_type="application/json; charset=utf-8")

    def get_serializer_context(self):
        # Pasa el contexto del request al serializador
        context = super().get_serializer_context()
        context.update({"request": self.request})
        return context
