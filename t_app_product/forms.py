from django import forms
from .models import Product

class ProductForm(forms.ModelForm):
    class Meta:
        model = Product
        fields = ['title', 'description', 'price', 'category', 'important', 'img']
        widgets = {
            'title': forms.TextInput(attrs={'class': 'form-control'}),
            'description': forms.Textarea(attrs={'class': 'form-control'}),
            'price': forms.NumberInput(attrs={'class': 'form-control'}), # Utilizo NumberInput para el campo DecimalField 'price'
            'category': forms.TextInput(attrs={'class': 'form-control'}),
            'important': forms.CheckboxInput(attrs={'class': 'form-check-input'}),
            'img': forms.FileInput(attrs={'class': 'form-control-file'}), # Utilizo FileInput para el campo ImageField 'img'
        }