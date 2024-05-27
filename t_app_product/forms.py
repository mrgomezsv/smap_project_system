from django import forms
from .models import Product
from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth.models import User

class ProductForm(forms.ModelForm):
    class Meta:
        model = Product
        fields = ['title', 'description', 'price', 'category', 'dimensions', 'publicated', 'img', 'img1', 'img2',
                  'img3', 'img4', 'img5']
        labels = {
            'title': 'Título',
            'description': 'Descripción',
            'price': 'Precio',
            'category': 'Categoría',
            'dimensions': 'Dimensiones',
            'publicated': 'Publicado',
        }

        widgets = {
            'title': forms.TextInput(attrs={'class': 'form-control', 'required':True}),
            'description': forms.Textarea(attrs={'class': 'form-control', 'required':True}),
            'price': forms.NumberInput(attrs={'class': 'form-control', 'required':True}),
            'category': forms.Select(attrs={'class': 'form-control', 'required':True}),
            'dimensions': forms.TextInput(attrs={'class': 'form-control'}),
            'publicated': forms.CheckboxInput(attrs={'class': 'form-check-input'}),
            'img': forms.ClearableFileInput(attrs={'class': 'form-control-file'}),
        }


class CustomUserCreationForm(UserCreationForm):
    first_name = forms.CharField(max_length=30, required=True)
    last_name = forms.CharField(max_length=30, required=True)
    email = forms.EmailField(required=True)

    class Meta:
        model = User
        fields = ("username", "first_name", "last_name", "email", "password1", "password2")