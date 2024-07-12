# urls.py principal del proyecto
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

from t_app_product import views as product_views
from t_app_product.views import process_checkbox, redirect_productc
from api.views import ProductListCreate  # Asegúrate de importar la vista correcta

urlpatterns = [
    path('admin/', admin.site.urls),
    path('about_smap/', product_views.about_smap, name='about_smap'),
    path('signup/', product_views.signup, name='signup'),
    path('product/', product_views.product, name='product'),
    path('logout/', product_views.signout, name='logout'),
    path('signin/', product_views.signin, name='signin'),
    path('', product_views.signin, name='home'),
    path('product/create/', product_views.create_product, name='create_product'),
    path('product/<int:product_id>/', product_views.product_detail, name='product_detail'),
    path('product/<int:product_id>/delete', product_views.delete_product, name='delete_product'),
    path('push_notification/', product_views.push_notification, name='push_notification'),
    path('firebase_auth/', product_views.firebase_auth, name='firebase_auth'),
    path('event/', product_views.event, name='event'),
    path('create_event/', product_views.create_event, name='create_event'),
    path('disclaimer/', product_views.disclaimer, name='disclaimer'),
    path('sudo_admin/', product_views.sudo_admin, name='sudo_admin'),
    path('ticket_master/', product_views.ticket_master, name='ticket_master'),
    path('process-checkbox/', process_checkbox, name='process_checkbox'),
    path('productc/', product_views.productc, name='productc'),
    path('api/', include('api.urls')),  # Incluimos las URLs de la nueva API unificada
]

# Sirve las imágenes desde la carpeta media
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

# Sirve los archivos estáticos durante el desarrollo
if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
