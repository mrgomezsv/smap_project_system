from django.urls import path
from . import views

urlpatterns = [
    path('waiver/', views.api_waiver_v2, name='api_waiver_v2'),
    path('waiver/<str:qr_code>/', views.get_waiver_data_v2, name='get_waiver_data_v2'),
    path('waiver/user/<str:user_id>/', views.get_user_waivers_v2, name='get_user_waivers_v2'),
    path('waiver/validate/', views.validate_waiver_v2, name='validate_waiver_v2'),
] 