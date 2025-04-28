from django.urls import path
from . import views

urlpatterns = [
    # Chat URLs
    path('chat/', views.chat_dashboard, name='chat_dashboard'),
    path('chat/add-admin/', views.add_chat_admin, name='add_chat_admin'),
    path('chat/toggle-admin/<int:admin_id>/', views.toggle_chat_admin, name='toggle_chat_admin'),
    path('chat/messages/<int:chat_id>/', views.get_chat_messages, name='get_chat_messages'),
    path('chat/send/<int:chat_id>/', views.send_message, name='send_message'),

    # User Chat URLs
    path('chats/', views.redirect_chats, name='redirect_chats'),
]
