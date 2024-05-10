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
from rest_framework import generics
from t_app_product.models import Product  # Importa el modelo de tu aplicación
from .serializers import ProductSerializer


class ProductListCreate(generics.ListAPIView):  # Cambia ListCreateAPIView a ListAPIView
    #queryset = Product.objects.all()
    serializer_class = ProductSerializer

    def get_queryset(self):
        # Filtra los productos para mostrar solo aquellos que están publicados
        return Product.objects.filter(publicated=True)