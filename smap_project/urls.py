# smap_project/urls.py
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

from t_app_product import views
from t_app_product.views import process_checkbox, redirect_productc
from api.views import ProductListCreate

urlpatterns = [
    path('admin/', admin.site.urls),
    path('about_smap/', views.about_smap, name='about_smap'),
    path('signup/', views.signup, name='signup'),
    path('product/', views.product, name='product'),
    path('logout/', views.signout, name='logout'),
    path('signin/', views.signin, name='signin'),
    path('', views.signin, name='home'),
    path('product/create/', views.create_product, name='create_product'),
    path('product/<int:product_id>/', views.product_detail, name='product_detail'),
    path('product/<int:product_id>/delete/', views.delete_product, name='delete_product'),
    path('push_notification/', views.push_notification, name='push_notification'),
    path('firebase_auth/', views.firebase_auth, name='firebase_auth'),
    path('event/', views.event, name='event'),
    path('create_event/', views.create_event, name='create_event'),
    path('waiver/', views.waiver, name='waiver'),
    path('sudo_admin/', views.sudo_admin, name='sudo_admin'),
    path('ticket_master/', views.ticket_master, name='ticket_master'),
    path('process-checkbox/', process_checkbox, name='process_checkbox'),
    path('productc/', views.productc, name='productc'),
    path('api/products/', ProductListCreate.as_view(), name='product-list'),
    path('kidsfun/', include('kidsfun_web.urls')),
    path('api/', include('api_like.urls')),  # Incluye las URLs de la aplicación api_like
    path('api/', include('api_commentary.urls')),  # Incluye las URLs de la aplicación api_commentary
    path('api/', include('api_waiver.urls')),  # Incluye las URLs de la aplicación api_waiver
]

# Sirve las imágenes desde la carpeta media
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

# Sirve los archivos estáticos durante el desarrollo
if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
