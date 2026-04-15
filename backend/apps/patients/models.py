from django.db import models
from django.conf import settings # Pour lier à l'utilisateur personnalisé

class Patient(models.Model):
    GENRE_CHOICES = (
        ('M', 'Masculin'),
        ('F', 'Féminin'),
    )

    # LIEN CRUCIAL : Un dossier patient appartient à UN utilisateur unique
    # related_name='patient_profile' permet au Serializer de le trouver facilement
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='patient_profile'
    )

    nom = models.CharField(max_length=100)
    prenom = models.CharField(max_length=100)
    genre = models.CharField(max_length=1, choices=GENRE_CHOICES, default='M')
    dateNaissance = models.DateField()
    telephone = models.CharField(max_length=20)
    cin = models.CharField(max_length=20, blank=True, null=True) # Ajout du CIN
    
    # Ces infos seront complétées par le médecin lors de la consultation (BF-03)
    groupeSanguin = models.CharField(max_length=5, blank=True, null=True)
    allergies = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.nom} {self.prenom}"