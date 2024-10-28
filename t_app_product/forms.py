from django import forms
from .models import Product, Event
from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth.models import User
from .models import WaiverValidator

class ProductForm(forms.ModelForm):
    class Meta:
        model = Product
        fields = ['title', 'description', 'price', 'category', 'dimensions', 'publicated', 'img', 'img1', 'img2',
                  'img3', 'img4', 'img5', 'youtube_url']
        labels = {
            'title': 'Título',
            'description': 'Descripción',
            'price': 'Precio',
            'category': 'Categoría',
            'dimensions': 'Dimensiones',
            'publicated': 'Publicado',
            'youtube_url': 'YouTube URL',
        }

        widgets = {
            'title': forms.TextInput(attrs={'class': 'form-control', 'required':True}),
            'description': forms.Textarea(attrs={'class': 'form-control', 'required':True}),
            'price': forms.NumberInput(attrs={'class': 'form-control', 'required':True}),
            'category': forms.Select(attrs={'class': 'form-control', 'required':True}),
            'dimensions': forms.TextInput(attrs={'class': 'form-control'}),
            'publicated': forms.CheckboxInput(attrs={'class': 'form-check-input'}),
            'img': forms.ClearableFileInput(attrs={'class': 'form-control-file'}),
            'youtube_url': forms.URLInput(attrs={'class': 'form-control'}),
        }

    def clean_price(self):
        price = self.cleaned_data.get('price')
        if price is None:
            return 1
        return price

class CustomUserCreationForm(UserCreationForm):
    first_name = forms.CharField(max_length=30, required=True)
    last_name = forms.CharField(max_length=30, required=True)
    email = forms.EmailField(required=True)

    class Meta:
        model = User
        fields = ("username", "first_name", "last_name", "email", "password1", "password2")


class EventForm(forms.ModelForm):
    class Meta:
        model = Event
        fields = ['title', 'description', 'location', 'start_datetime', 'ticket_price', 'published', 'partners']



class WaiverValidatorForm(forms.ModelForm):
    class Meta:
        model = WaiverValidator
        fields = ['email']  # Solo el campo 'email'
        widgets = {
            'email': forms.EmailInput(attrs={
                'class': 'form-control',
                'placeholder': 'Ingrese el correo electrónico'
            })
        }
