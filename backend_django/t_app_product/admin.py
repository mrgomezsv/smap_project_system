from django.contrib import admin
from .models import Product, ContactMessage

class ProductAdmin(admin.ModelAdmin):
    readonly_fields = ("created", )

# Register your models here.
admin.site.register(Product, ProductAdmin)


@admin.register(ContactMessage)
class ContactMessageAdmin(admin.ModelAdmin):
    list_display = ("first_name", "last_name", "email", "contact_number", "is_read", "created_at")
    list_filter = ("is_read", "created_at")
    search_fields = ("first_name", "last_name", "email", "contact_number", "reason")
    ordering = ("-created_at",)