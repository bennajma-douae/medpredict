from rest_framework import serializers
from .models import User

class UserSerializer(serializers.ModelSerializer):
    # Ce champ calculé dira au Frontend si un dossier Patient existe pour cet User
    patient_id = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'role', 'password', 'patient_id']
        extra_kwargs = {
            'password': {'write_only': True, 'required': True}
        }

    def get_patient_id(self, obj):
        # On vérifie si l'utilisateur a un profil patient lié (via la relation inverse)
        # hasattr vérifie si la relation existe, .first() récupère le premier s'il y en a plusieurs
        try:
            if hasattr(obj, 'patient_profile'):
                patient = obj.patient_profile
                return patient.id
        except:
            return None
        return None

    def create(self, validated_data):
        # On utilise create_user pour que le mot de passe soit haché (crypté)
        return User.objects.create_user(**validated_data)