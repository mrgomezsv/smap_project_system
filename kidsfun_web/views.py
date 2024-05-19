# En kidsfun_web/views.py
from django.shortcuts import render


def home(request):
    return render(request, 'kidsfun_web/home/home.html')


def service(request):
    return render(request, 'kidsfun_web/service/service.html')


def contact(request):
    return render(request, 'kidsfun_web/contact/contact.html')
