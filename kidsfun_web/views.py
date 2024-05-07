from django.shortcuts import render

def home_view(request):
    # Lógica para renderizar la página de inicio
    return render(request, 'home.html')  # Asegúrate de tener una plantilla llamada 'home.html' en la carpeta 'templates/kidsfun_web/'


def products_and_services_view(request):
    return render(request, 'products_and_services.html')

def contact_view(request):
    return render(request, 'contact.html')