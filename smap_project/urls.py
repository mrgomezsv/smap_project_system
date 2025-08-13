# smap_project/urls.py
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

from t_app_product import views
from t_app_product.views import process_checkbox
# Nuevo servicio de análisis de CV
from cv_service import views as cv_views
# from api.views import ProductListCreate  # Comentado - API eliminada

urlpatterns = [
    path('admin/', admin.site.urls),
    path('about_smap/', views.about_smap, name='about_smap'),
    path('signup/', views.signup, name='signup'),
    path('product/', views.product, name='product'),
    path('logout/', views.signout, name='logout'),
    path('signin/', views.signin, name='signin'),
    path('change-password/', views.change_password, name='change_password'),
    path('product/create/', views.create_product, name='create_product'),
    path('product/<int:product_id>/', views.product_detail, name='product_detail'),
    path('product/<int:product_id>/delete/', views.delete_product, name='delete_product'),
    path('push_notification/', views.push_notification, name='push_notification'),
    path('send_push_notification/', views.send_push_notification, name='send_push_notification'),
    path('performance/', views.performance, name='performance'),
    path('firebase_auth/', views.firebase_auth, name='firebase_auth'),
    path('event/', views.event, name='event'),
    path('create_event/', views.create_event, name='create_event'),
    path('waiver/', views.waiver, name='waiver'),
    path('waiver/delete/<int:validator_id>/', views.delete_validator, name='delete_validator'),
    path('sudo_admin/', views.sudo_admin, name='sudo_admin'),
    path('sudo_admin/delete/<int:user_id>/', views.delete_user, name='delete_user'),
    path('ticket_master/', views.ticket_master, name='ticket_master'),
    path('process-checkbox/', process_checkbox, name='process_checkbox'),
    path('productc/', views.productc, name='productc'),
    path('chats/', views.redirect_chats, name='chats'),
    path('web-messages/', views.web_messages, name='web_messages'),
    path('web-messages/<int:message_id>/', views.web_message_detail, name='web_message_detail'),
    path('web-messages/unread-count/', views.unread_contact_count, name='web_messages_unread_count'),
    # APIs del Sistema
    path('api/products/', views.api_products, name='api_products'),
    path('api/products/category/<str:category>/', views.api_products_by_category, name='api_products_by_category'),
    # Likes API (nueva)
    path('api/likes/product/<int:product_id>/', views.likes_count, name='likes_count'),
    path('api/likes/user/<str:user_id>/product/<str:product_id>/', views.user_product_favorite, name='user_product_favorite'),
    path('api/likes/toggle/', views.toggle_like, name='toggle_like'),
    # Comments API (nueva)
    path('api/comments/', views.create_comment, name='create_comment'),
    path('api/comments/product/<int:product_id>/', views.comments_for_product, name='comments_for_product'),
    # path('api/products/', ProductListCreate.as_view(), name='product-list')  # Comentado - API eliminada
    path('', include('kidsfun_web.urls')),  # URLs principales en la raíz
    # path('api/', include('api_like.urls')),  # Comentado - API eliminada
    # path('api/', include('api_commentary.urls')),  # Comentado - API eliminada
    # path('api/', include('api_waiver.urls')),  # Comentado - API eliminada
    path('api/v2/', include('waiver_v2.urls')),  # Incluye las URLs de la nueva aplicación waiver_v2
    # Servicio independiente para análisis de CV (microservicio ligero)
    path('api/cv/analyze/', cv_views.cv_analyze, name='cv_analyze'),
    path('api/cv/harvard-pdf/', cv_views.cv_harvard_pdf, name='cv_harvard_pdf'),
    # path('api_waiver_validator/', include('api_waiver_validator.urls')),  # Comentado - API eliminada
]

# Sirve las imágenes desde la carpeta media
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

# Sirve los archivos estáticos durante el desarrollo
if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

# Configura las vistas de error
handler404 = 't_app_product.views.handler404'
handler500 = 't_app_product.views.handler500'
