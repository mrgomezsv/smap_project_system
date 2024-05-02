from django.contrib import admin
from django.urls import path
from t_app_product import views
from django.conf import settings
from django.conf.urls.static import static
from t_app_product.views import process_checkbox, redirect_productc
from api.views import ProductListCreate


urlpatterns = [
    path('admin/', admin.site.urls),
    path('', views.home, name='home'),
    path('signup/', views.signup, name='signup'),
    path('product/', views.product, name='product'),
    path('logout/', views.signout, name='logout'),
    path('signin/', views.signin, name='signin'),
    path('product/create/', views.create_product, name='create_product'),
    path('product/<int:product_id>/', views.product_detail, name='product_detail'),
    path('product/<int:product_id>/delete', views.delete_product, name='delete_product'),
    path('push_notification/', views.push_notification, name='push_notification'),
    path('services/', views.services, name='services'),
    path('disclaimer/', views.disclaimer, name='disclaimer'),
    path('sudo_admin/', views.sudo_admin, name='sudo_admin'),
    path('advance_payments/', views.advance_payments, name='advance_payments'),
    path('ticket_master/', views.ticket_master, name='ticket_master'),
    path('process-checkbox/', process_checkbox, name='process_checkbox'),
    path('productc/', views.productc, name='productc'),
    path('api/products/', ProductListCreate.as_view(), name='product-list'),
]

# Sirve las imágenes desde la carpeta media
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

# Sirve los archivos estáticos durante el desarrollo
if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
