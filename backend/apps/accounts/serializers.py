from rest_framework import serializers
from .models import User

class UserSerializer(serializers.ModelSerializer):
    # Champ calculé : indique au Frontend si un dossier Patient existe pour cet User
    patient_id = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id',
            'username',
            'email',
            'role',
            'password',
            'patient_id',
            'email_verified'          # ← Champ ajouté pour la vérification email
        ]
        extra_kwargs = {
            'password': {'write_only': True, 'required': True},
        }

    def get_patient_id(self, obj):
        """Retourne l'ID du profil Patient lié à cet utilisateur"""
        try:
            if hasattr(obj, 'patient_profile'):
                return obj.patient_profile.id
        except:
            pass
        return None

    def create(self, validated_data):
        """
        Création d'un nouvel utilisateur avec mot de passe haché
        et email_verified = False par défaut (surtout pour les patients)
        """
        # On retire le mot de passe des données validées pour le gérer manuellement
        password = validated_data.pop('password', None)
        
        # Création de l'utilisateur
        user = User.objects.create_user(**validated_data)
        
        # Si un mot de passe a été fourni, on le définit correctement
        if password:
            user.set_password(password)
            user.save()
        
        # IMPORTANT : Pour tous les nouveaux utilisateurs (surtout patients),
        # on force email_verified à False au moment de l'inscription
        user.email_verified = False
        user.save()

        return user