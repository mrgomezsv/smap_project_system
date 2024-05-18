# En kidsfun_web/views.py
from django.shortcuts import render

def home(request):
    return render(request, 'kidsfun_web/home.html')