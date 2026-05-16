from rest_framework import viewsets, permissions
from .models import Message
from .serializers import MessageSerializer
from django.db.models import Q

# backend/apps/chat/views.py
class MessageViewSet(viewsets.ModelViewSet):
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'PATIENT':
            return Message.objects.filter(patient_user=user).order_by('timestamp')
        
        # Pour la secrétaire/médecin :
        patient_id = self.request.query_params.get('patient')
        if patient_id:
            return Message.objects.filter(patient_user_id=patient_id).order_by('timestamp')
        
        # Par défaut, retourner les derniers messages de chaque discussion pour la liste
        return Message.objects.all().order_by('timestamp')

    def perform_create(self, serializer):
        # L'expéditeur est toujours celui qui est connecté
        serializer.save(sender=self.request.user)