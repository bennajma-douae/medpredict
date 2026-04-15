from rest_framework import viewsets, permissions
from .models import Ordonnance
from .serializers import OrdonnanceSerializer

class OrdonnanceViewSet(viewsets.ModelViewSet):
    queryset = Ordonnance.objects.all()
    serializer_class = OrdonnanceSerializer
    permission_classes = [permissions.IsAuthenticated]