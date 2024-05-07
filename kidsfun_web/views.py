from django.shortcuts import render

def home_view(request):
    return render(request, 'home.html')


def services(request):
    return render(request, 'services.html')

def contact(request):
    return render(request, 'contact.html')