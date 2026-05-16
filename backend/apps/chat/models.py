from django.db import models
from django.conf import settings

class Message(models.Model):
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="sent_messages")
    patient_user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="chat_history")
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    is_from_secretary = models.BooleanField(default=False)

    class Meta:
        ordering = ['timestamp']