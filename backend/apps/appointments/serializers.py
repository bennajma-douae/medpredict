from rest_framework import serializers
from .models import RendezVous
from apps.patients.models import PatientDraft  # <-- AJOUT : Import du brouillon

class RendezVousSerializer(serializers.ModelSerializer):
    # Infos patient enrichies pour le médecin et le dashboard
    patient_nom_complet = serializers.SerializerMethodField()
    patient_nom = serializers.SerializerMethodField()
    patient_prenom = serializers.SerializerMethodField()
    patient_cin = serializers.SerializerMethodField()
    patient_telephone = serializers.SerializerMethodField()
    patient_genre = serializers.SerializerMethodField()
    patient_date_naissance = serializers.SerializerMethodField()
    patient_groupe_sanguin = serializers.SerializerMethodField()
    patient_allergies = serializers.SerializerMethodField()
    patient_id = serializers.SerializerMethodField()
    
    # ✅ AJOUT : Définir les champs de téléconsultation comme read_only
    visio_room_id = serializers.CharField(read_only=True)
    visio_access_code = serializers.CharField(read_only=True)
    visio_code_expires_at = serializers.DateTimeField(read_only=True)

    class Meta:
        model = RendezVous
        fields = [
            'id', 'user', 'patient', 'medecin', 'date', 'heure', 'motif', 'statut', 'type',
            'patient_id', 'patient_nom_complet', 'patient_nom', 'patient_prenom',
            'patient_cin', 'patient_telephone', 'patient_genre',
            'patient_date_naissance', 'patient_groupe_sanguin', 'patient_allergies',
            'visio_room_id', 'visio_access_code', 'visio_code_expires_at',  # ✅ Ajoutés
        ]
        extra_kwargs = {
            'medecin': {'required': False, 'allow_null': True},
            'user': {'required': False, 'allow_null': True},
            'patient': {'required': False, 'allow_null': True},
        }

    def get_patient_id(self, obj):
        return obj.patient.id if obj.patient else None

    def get_patient_nom_complet(self, obj):
        if obj.patient:
            return f"{obj.patient.prenom} {obj.patient.nom}"
        try:
            draft = PatientDraft.objects.get(user=obj.user)
            return f"{draft.prenom} {draft.nom}"
        except PatientDraft.DoesNotExist:
            return None

    def get_patient_nom(self, obj):
        if obj.patient:
            return obj.patient.nom
        try:
            return PatientDraft.objects.get(user=obj.user).nom
        except PatientDraft.DoesNotExist:
            return None

    def get_patient_prenom(self, obj):
        if obj.patient:
            return obj.patient.prenom
        try:
            return PatientDraft.objects.get(user=obj.user).prenom
        except PatientDraft.DoesNotExist:
            return None

    def get_patient_cin(self, obj):
        if obj.patient:
            return obj.patient.cin
        try:
            return PatientDraft.objects.get(user=obj.user).cin
        except PatientDraft.DoesNotExist:
            return None

    def get_patient_telephone(self, obj):
        if obj.patient:
            return obj.patient.telephone
        try:
            return PatientDraft.objects.get(user=obj.user).telephone
        except PatientDraft.DoesNotExist:
            return None

    def get_patient_genre(self, obj):
        if obj.patient:
            return obj.patient.genre
        try:
            return PatientDraft.objects.get(user=obj.user).genre
        except PatientDraft.DoesNotExist:
            return None

    def get_patient_date_naissance(self, obj):
        if obj.patient and obj.patient.dateNaissance:
            return str(obj.patient.dateNaissance)
        try:
            draft = PatientDraft.objects.get(user=obj.user)
            return str(draft.dateNaissance) if draft.dateNaissance else None
        except PatientDraft.DoesNotExist:
            return None

    def get_patient_groupe_sanguin(self, obj):
        if obj.patient:
            return obj.patient.groupeSanguin
        try:
            return PatientDraft.objects.get(user=obj.user).groupeSanguin
        except PatientDraft.DoesNotExist:
            return None

    def get_patient_allergies(self, obj):
        if obj.patient:
            return obj.patient.allergies
        try:
            return PatientDraft.objects.get(user=obj.user).allergies
        except PatientDraft.DoesNotExist:
            return None