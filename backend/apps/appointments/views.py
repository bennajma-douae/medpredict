from rest_framework import viewsets, permissions
from .models import RendezVous
from .serializers import RendezVousSerializer

class RendezVousViewSet(viewsets.ModelViewSet):
    queryset = RendezVous.objects.all()
    serializer_class = RendezVousSerializer
    permission_classes = [permissions.IsAuthenticated]
    def get_queryset(self):
        user = self.request.user
        # Si c'est un médecin, il ne voit QUE les rendez-vous CONFIRMÉS ou TERMINÉS
        if user.role == 'MEDECIN':
            return RendezVous.objects.filter(statut__in=['CONFIRME', 'TERMINE'])
        # La secrétaire, elle, doit tout voir pour pouvoir valider
        return RendezVous.objects.all()