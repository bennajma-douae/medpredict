from rest_framework import serializers
from .models import Patient


class PatientSerializer(serializers.ModelSerializer):
    nom_complet = serializers.ReadOnlyField()
    email = serializers.SerializerMethodField()

    class Meta:
        model = Patient
        fields = [
            'id', 'user', 'nom', 'prenom', 'nom_complet', 'dateNaissance',
            'telephone', 'cin', 'adresse', 'genre', 'groupeSanguin',
            'allergies', 'antecedents', 'email', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']

    def get_email(self, obj):
        return obj.user.email if obj.user else None


class PatientUpdateSerializer(serializers.ModelSerializer):
    """Serializer pour la mise à jour du profil patient (uniquement les champs modifiables)"""
    class Meta:
        model = Patient
        fields = ['nom', 'prenom', 'dateNaissance', 'telephone', 'cin', 'adresse', 'genre', 'groupeSanguin', 'allergies', 'antecedents']