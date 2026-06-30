from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    ROLE_CHOICES = (
        ('ADMIN', 'Administrateur'),
        ('SECRETAIRE', 'Secrétaire'),
        ('MEDECIN', 'Médecin'),
        ('PATIENT', 'Patient'),
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='PATIENT')
    email = models.EmailField(unique=True)
    email_verified = models.BooleanField(
        default=False,
        verbose_name="Email vérifié"
    )
    photo_base64 = models.TextField(null=True, blank=True)

    class Meta:
        verbose_name = 'Utilisateur'
        verbose_name_plural = 'Utilisateurs'


    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"


class CabinetConfig(models.Model):
    nom = models.CharField(max_length=200, default='Cabinet Médical MedPredict')
    telephone = models.CharField(max_length=50, default='+212 5 22 45 67 89')
    email = models.EmailField(default='contact@medpredict.ma')
    adresse = models.CharField(max_length=300, default="75 Boulevard d'Anfa, Casablanca, Maroc")
    
    # Horaires
    ouverture = models.CharField(max_length=5, default='08:30')
    fermeture = models.CharField(max_length=5, default='18:00')
    pause_debut = models.CharField(max_length=5, default='12:30')
    pause_fin = models.CharField(max_length=5, default='14:00')
    
    # Paramètres agenda
    duree_rdv = models.CharField(max_length=5, default='30')
    max_rdv_par_jour = models.CharField(max_length=5, default='20')
    delai_min_heures = models.CharField(max_length=5, default='24')
    type_defaut = models.CharField(max_length=20, default='CABINET')
    
    # Medecin & PDF
    medecin_nom = models.CharField(max_length=150, default='Dr. Mohamed Alami')
    medecin_specialite = models.CharField(max_length=150, default='Médecine Générale & IA Diagnostique')
    rpps = models.CharField(max_length=50, default='10100458923')
    inpe = models.CharField(max_length=50, default='045892361')
    pied_page = models.TextField(default='Document confidentiel généré par le système intelligent MedPredict.')

    class Meta:
        verbose_name = 'Configuration Cabinet'
        verbose_name_plural = 'Configuration Cabinet'

    def __str__(self):
        return self.nom


class EmailTemplate(models.Model):
    key = models.CharField(max_length=50, unique=True)
    label = models.CharField(max_length=150)
    sujet = models.CharField(max_length=200)
    corps = models.TextField()

    class Meta:
        verbose_name = "Modèle d'Email"
        verbose_name_plural = "Modèles d'Emails"

    def __str__(self):
        return self.label