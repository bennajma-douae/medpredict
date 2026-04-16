from rest_framework import serializers
from .models import RendezVous
from datetime import date

class RendezVousSerializer(serializers.ModelSerializer):
    # Infos médecin
    medecin_nom = serializers.ReadOnlyField(source='medecin.username')

    # Infos patient — dossier médical complet
    patient_nom        = serializers.ReadOnlyField(source='patient.nom')
    patient_prenom     = serializers.ReadOnlyField(source='patient.prenom')
    patient_cin        = serializers.ReadOnlyField(source='patient.cin')
    patient_genre      = serializers.ReadOnlyField(source='patient.genre')
    patient_telephone  = serializers.ReadOnlyField(source='patient.telephone')
    patient_groupe_sanguin = serializers.ReadOnlyField(source='patient.groupeSanguin')
    patient_allergies  = serializers.ReadOnlyField(source='patient.allergies')
    
    
    patient_date_naissance = serializers.ReadOnlyField(source='patient.dateNaissance')

    # Âge calculé dynamiquement côté serveur (on le garde, c'est une bonne pratique)
    patient_age = serializers.SerializerMethodField()

    # Pour afficher le nom complet dans le calendrier
    patient_nom_complet = serializers.SerializerMethodField()

    class Meta:
        model = RendezVous
        fields = '__all__'

    def get_patient_age(self, obj):
        if obj.patient and obj.patient.dateNaissance:
            today = date.today()
            born  = obj.patient.dateNaissance
            age   = today.year - born.year - (
                (today.month, today.day) < (born.month, born.day)
            )
            return age
        return None

    def get_patient_nom_complet(self, obj):
        if obj.patient:
            return f"{obj.patient.prenom} {obj.patient.nom}"
        if obj.user:
            return obj.user.get_full_name() or obj.user.username
        return "Patient inconnu"