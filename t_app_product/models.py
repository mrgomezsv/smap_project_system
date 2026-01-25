# t_app_product/models.py

from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone

import os
from django.utils.text import slugify

def get_product_image_path(instance, filename, prefix):
    product_slug = slugify(instance.title).replace('-', '_')
    ext = filename.split('.')[-1].lower()
    # Mapeo de prefijos a números para el nombre del archivo
    prefix_map = {
        'main': '01',
        'img1': '02',
        'img2': '03',
        'img3': '04',
        'img4': '05',
        'img5': '06',
    }
    number = prefix_map.get(prefix, '00')
    new_filename = f"{product_slug}_{number}.{ext}"
    return os.path.join('product_images', product_slug, new_filename)

def image_path_main(instance, filename): return get_product_image_path(instance, filename, 'main')
def image_path_1(instance, filename): return get_product_image_path(instance, filename, 'img1')
def image_path_2(instance, filename): return get_product_image_path(instance, filename, 'img2')
def image_path_3(instance, filename): return get_product_image_path(instance, filename, 'img3')
def image_path_4(instance, filename): return get_product_image_path(instance, filename, 'img4')
def image_path_5(instance, filename): return get_product_image_path(instance, filename, 'img5')

# Alias para compatibilidad con migraciones antiguas
image_path = image_path_main

CATEGORY_CHOICES = [
    ('option1', 'Bounce House'),
    ('option2', 'Electric Games'),
    ('option3', 'Furniture'),
    ('option4', 'Concession Machines'),
    ('option5', 'Competitive Games'),
    ('option6', 'Equipment Rental'),
    ('option7', 'Water Fun for Rent'),
]

class Product(models.Model):
    img = models.ImageField(upload_to=image_path_main, default='default_product_image.jpg')
    title = models.CharField(max_length=100)
    description = models.TextField(null=True, blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES)
    circuits = models.CharField(max_length=50, blank=True, null=True)
    dimensions = models.CharField(max_length=50, blank=True, null=True)
    space = models.CharField(max_length=50, blank=True, null=True)
    created = models.DateTimeField(auto_now_add=True)
    publicated = models.BooleanField(default=False)
    user = models.ForeignKey(User, on_delete=models.SET_DEFAULT, default=None, related_name='t_app_products')

    youtube_url = models.CharField(max_length=255, blank=True, null=True, default='')

    img1 = models.ImageField(upload_to=image_path_1, default='default_product_image.jpg')
    img2 = models.ImageField(upload_to=image_path_2, default='default_product_image.jpg')
    img3 = models.ImageField(upload_to=image_path_3, default='default_product_image.jpg')
    img4 = models.ImageField(upload_to=image_path_4, default='default_product_image.jpg')
    img5 = models.ImageField(upload_to=image_path_5, default='default_product_image.jpg')

    def __str__(self):
        return self.title + ' - by ' + self.user.username

    def save(self, *args, **kwargs):
        if self.pk:
            # Es una edición, verificar si el título cambió
            old_instance = Product.objects.get(pk=self.pk)
            if old_instance.title != self.title:
                import os
                from django.utils.text import slugify
                from django.conf import settings
                from shutil import move

                old_slug = slugify(old_instance.title).replace('-', '_')
                new_slug = slugify(self.title).replace('-', '_')
                
                old_dir = os.path.join(settings.MEDIA_ROOT, 'product_images', old_slug)
                new_dir = os.path.join(settings.MEDIA_ROOT, 'product_images', new_slug)

                if os.path.exists(old_dir) and old_slug != new_slug:
                    # 1. Crear el nuevo directorio si no existe
                    os.makedirs(new_dir, exist_ok=True)
                    
                    # 2. Mover archivos y renombrarlos
                    image_fields = ['img', 'img1', 'img2', 'img3', 'img4', 'img5']
                    for field_name in image_fields:
                        field = getattr(self, field_name)
                        if field and 'default_product_image.jpg' not in field.name:
                            # Obtener nombre de archivo actual y extensión
                            file_basename = os.path.basename(field.name)
                            ext = file_basename.split('.')[-1]
                            
                            # Mapeo de sufijo según el campo
                            suffix_map = {'img': '01', 'img1': '02', 'img2': '03', 'img3': '04', 'img4': '05', 'img5': '06'}
                            suffix = suffix_map[field_name]
                            
                            new_file_relative = f'product_images/{new_slug}/{new_slug}_{suffix}.{ext}'
                            old_file_path = os.path.join(settings.MEDIA_ROOT, field.name)
                            new_file_path = os.path.join(settings.MEDIA_ROOT, new_file_relative)

                            if os.path.exists(old_file_path):
                                try:
                                    move(old_file_path, new_file_path)
                                    setattr(self, field_name, new_file_relative)
                                except Exception as e:
                                    print(f"Error renombrando archivo: {e}")
                    
                    # 3. Borrar directorio viejo si quedó vacío
                    try:
                        if not os.listdir(old_dir):
                            os.rmdir(old_dir)
                    except OSError:
                        pass
        
        super().save(*args, **kwargs)


class ProductLike(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='productlike')
    is_favorite = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'product')
        db_table = 't_app_product_like'

    def __str__(self):
        return f"{self.user_id}:{self.product_id}:{self.is_favorite}"


class ProductComment(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='comments')
    user_id = models.CharField(max_length=128, null=True, blank=True)
    user_display_name = models.CharField(max_length=255, null=True, blank=True)
    comment = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 't_app_product_comment'
        ordering = ['-created_at']

    def clean_comment(self):
        """Limpia y valida el comentario para evitar caracteres corruptos"""
        if self.comment:
            import re
            comment_text = str(self.comment)
            
            # Eliminar caracteres de control excepto saltos de línea
            comment_text = re.sub(r'[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]', '', comment_text)
            
            # Limpiar caracteres no válidos de Unicode
            comment_text = re.sub(r'[^\x00-\x7F\u00A0-\uFFFF]', '', comment_text)
            
            return comment_text.strip()
        return ""

    def save(self, *args, **kwargs):
        """Sobrescribir save para limpiar el comentario antes de guardar"""
        if self.comment:
            self.comment = self.clean_comment()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.product_id}:{self.user_id}:{self.comment[:20]}"

class WaiverData(models.Model):
    user_id = models.IntegerField()
    user_name = models.CharField(max_length=100)
    relative_name = models.CharField(max_length=100)
    relative_age = models.IntegerField()

    class Meta:
        db_table = 't_app_product_waiverdata'


PARTNERS_CHOICES = [
    ('partner1', 'Kidsfun'),
    ('partner2', 'Tecun Productions'),
    ('partner3', 'Otros'),
]

class Event(models.Model):
    title = models.CharField(max_length=200)
    slug = models.SlugField(max_length=250, unique=True, null=True, blank=True)
    description = models.TextField()
    image = models.ImageField(upload_to='event_images/', default='default_event.jpg', null=True, blank=True)
    location = models.CharField(max_length=200)
    start_datetime = models.DateTimeField()
    organizer = models.ForeignKey(User, on_delete=models.CASCADE)
    ticket_price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    published = models.BooleanField(default=False)
    partners = models.CharField(max_length=50, choices=PARTNERS_CHOICES)
    created_at = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title)
        super().save(*args, **kwargs)

    class Meta:
        db_table = 't_app_event'
        ordering = ['-start_datetime']


class WaiverValidator(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)  # Campo opcional
    email = models.EmailField(unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.email

    class Meta:
        db_table = 't_app_product_waivervalidator'

class WaiverDataDB(models.Model):
    user_id = models.CharField(max_length=100)
    user_name = models.CharField(max_length=100)
    relative_name = models.CharField(max_length=100)
    relative_age = models.IntegerField()
    timestamp = models.CharField(max_length=30)
    user_email = models.EmailField(max_length=255, blank=True, null=True)

    class Meta:
        managed = False  # Esto indica que Django no gestionará la creación ni las migraciones de esta tabla
        db_table = 'api_waiver_waiverdata'

class ChatAdministrator(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    email = models.EmailField(unique=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.email

    class Meta:
        db_table = 't_app_chat_administrator'

class ChatRoom(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='chat_rooms')
    created_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)
    last_message_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Chat with {self.user.username}"

    class Meta:
        db_table = 't_app_chat_room'

class ChatMessage(models.Model):
    chat_room = models.ForeignKey(ChatRoom, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_messages')
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)

    def __str__(self):
        return f"Message from {self.sender.username} at {self.timestamp}"

    class Meta:
        db_table = 't_app_chat_message'


class ContactMessage(models.Model):
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    contact_number = models.CharField(max_length=32)
    email = models.EmailField()
    reason = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 't_app_contact_message'
        ordering = ['-created_at']

    def __str__(self) -> str:
        return f"{self.first_name} {self.last_name} - {self.email}"

class CommentReply(models.Model):
    comment = models.ForeignKey(ProductComment, on_delete=models.CASCADE, related_name='replies')
    user_id = models.CharField(max_length=128, null=True, blank=True)
    user_display_name = models.CharField(max_length=255, null=True, blank=True)
    reply_text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 't_app_product_comment_reply'
        ordering = ['created_at']

    def clean_reply_text(self):
        """Limpia y valida la respuesta para evitar caracteres corruptos"""
        if self.reply_text:
            import re
            reply_text = str(self.reply_text)
            
            # Eliminar caracteres de control excepto saltos de línea
            reply_text = re.sub(r'[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]', '', reply_text)
            
            # Limpiar caracteres no válidos de Unicode
            reply_text = re.sub(r'[^\x00-\x7F\u00A0-\uFFFF]', '', reply_text)
            
            return reply_text.strip()
        return ""

    def save(self, *args, **kwargs):
        """Sobrescribir save para limpiar la respuesta antes de guardar"""
        if self.reply_text:
            self.reply_text = self.clean_reply_text()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Reply to {self.comment_id}:{self.user_id}:{self.reply_text[:20]}"
