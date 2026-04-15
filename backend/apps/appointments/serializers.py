from rest_framework import serializers
from .models import RendezVous

class RendezVousSerializer(serializers.ModelSerializer):
    # Ces champs lisent des données depuis les modèles liés (Patient et User)
    patient_nom = serializers.ReadOnlyField(source='patient.nom')
    medecin_nom = serializers.ReadOnlyField(source='medecin.username')

    class Meta:
        model = RendezVous
        fields = '__all__'