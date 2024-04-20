from django import forms
from .models import Product

class ProductForm(forms.ModelForm):
    class Meta:
        model = Product
        fields = ['title', 'description', 'price', 'category', 'important', 'img', 'img1', 'img2', 'img3', 'img4', 'img5']
        widgets = {
            'title': forms.TextInput(attrs={'class': 'form-control', 'required':True}),
            'description': forms.Textarea(attrs={'class': 'form-control', 'required':True}),
            'price': forms.NumberInput(attrs={'class': 'form-control', 'required':True}), # Utilizo NumberInput para el campo DecimalField 'price'
            'category': forms.Select(attrs={'class': 'form-control', 'required':True}),  # Utilizo el widget Select para el campo de categoría
            'important': forms.CheckboxInput(attrs={'class': 'form-check-input'}),
            'img': forms.ClearableFileInput(attrs={'class': 'form-control-file'}), # Utilizo FileInput para el campo ImageField 'img'
        }
