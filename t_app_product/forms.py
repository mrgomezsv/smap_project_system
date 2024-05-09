from django import forms
from .models import Product
from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth.models import User

class ProductForm(forms.ModelForm):
    class Meta:
        model = Product
        fields = ['title', 'description', 'price', 'category', 'important', 'img', 'img1', 'img2', 'img3', 'img4', 'img5',  'dimensions']
        widgets = {
            'title': forms.TextInput(attrs={'class': 'form-control', 'required':True}),
            'description': forms.Textarea(attrs={'class': 'form-control', 'required':True}),
            'price': forms.NumberInput(attrs={'class': 'form-control', 'required':True}),
            'category': forms.Select(attrs={'class': 'form-control', 'required':True}),
            'important': forms.CheckboxInput(attrs={'class': 'form-check-input'}),
            'img': forms.ClearableFileInput(attrs={'class': 'form-control-file'}),
            'dimensions': forms.TextInput(attrs={'class': 'form-control'}),
        }


class CustomUserCreationForm(UserCreationForm):
    first_name = forms.CharField(max_length=30, required=True)
    last_name = forms.CharField(max_length=30, required=True)
    email = forms.EmailField(required=True)

    class Meta:
        model = User
        fields = ("username", "first_name", "last_name", "email", "password1", "password2")