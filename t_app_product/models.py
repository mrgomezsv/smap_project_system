# t_app_product/models.py

from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone

def image_path(instance, filename):
    return f'product_images/{filename}'

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
    img = models.ImageField(upload_to=image_path, default='default_product_image.jpg')
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

    img1 = models.ImageField(upload_to=image_path, default='default_product_image.jpg')
    img2 = models.ImageField(upload_to=image_path, default='default_product_image.jpg')
    img3 = models.ImageField(upload_to=image_path, default='default_product_image.jpg')
    img4 = models.ImageField(upload_to=image_path, default='default_product_image.jpg')
    img5 = models.ImageField(upload_to=image_path, default='default_product_image.jpg')

    def __str__(self):
        return self.title + ' - by ' + self.user.username


class ProductLike(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
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
    description = models.TextField()
    location = models.CharField(max_length=200)
    start_datetime = models.DateTimeField()
    organizer = models.ForeignKey(User, on_delete=models.CASCADE)
    ticket_price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    published = models.BooleanField(default=False)
    partners = models.CharField(max_length=50, choices=PARTNERS_CHOICES)

    def __str__(self):
        return self.title

    class Meta:
        db_table = 't_app_event'


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
        ordering = ['timestamp']
