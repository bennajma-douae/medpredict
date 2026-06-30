from rest_framework import serializers
from .models import User

class UserSerializer(serializers.ModelSerializer):
    # Champ calculé : indique au Frontend si un dossier Patient existe pour cet User
    patient_id = serializers.SerializerMethodField()
    nom = serializers.CharField(source='last_name', required=False, allow_blank=True)
    prenom = serializers.CharField(source='first_name', required=False, allow_blank=True)

    class Meta:
        model = User
        fields = [
            'id',
            'username',
            'email',
            'nom',
            'prenom',
            'role',
            'password',
            'patient_id',
            'email_verified',
            'photo_base64'
        ]
        extra_kwargs = {
            'password': {'write_only': True, 'required': False},
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


from .models import CabinetConfig, EmailTemplate

class CabinetConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = CabinetConfig
        fields = '__all__'


class EmailTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmailTemplate
        fields = '__all__'