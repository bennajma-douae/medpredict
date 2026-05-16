from rest_framework import serializers
from .models import Message

class MessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.ReadOnlyField(source='sender.username')
    class Meta:
        model = Message
        fields = ['id', 'sender', 'sender_name', 'patient_user', 'content', 'timestamp', 'is_from_secretary']
        read_only_fields = ['sender']