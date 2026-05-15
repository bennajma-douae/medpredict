from django.db import models
from django.conf import settings


class Patient(models.Model):
    GENRE_CHOICES = (('M', 'Masculin'), ('F', 'Féminin'), ('A', 'Autre'))
    GROUPE_SANGUIN_CHOICES = (
        ('A+', 'A+'), ('A-', 'A-'), ('B+', 'B+'), ('B-', 'B-'),
        ('AB+', 'AB+'), ('AB-', 'AB-'), ('O+', 'O+'), ('O-', 'O-'),
    )

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='patient_profile',
        null=True, blank=True
    )
    nom = models.CharField(max_length=100)
    prenom = models.CharField(max_length=100)
    dateNaissance = models.DateField(null=True, blank=True)
    telephone = models.CharField(max_length=20, blank=True, null=True)
    cin = models.CharField(max_length=20, blank=True, null=True, unique=True)
    adresse = models.CharField(max_length=255, blank=True, null=True)
    genre = models.CharField(max_length=1, choices=GENRE_CHOICES, default='M')
    groupeSanguin = models.CharField(
        max_length=3, choices=GROUPE_SANGUIN_CHOICES, blank=True, null=True
    )
    allergies = models.TextField(blank=True, null=True)
    antecedents = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Patient'
        verbose_name_plural = 'Patients'

    def __str__(self):
        return f"{self.prenom} {self.nom}"

    @property
    def nom_complet(self):
        return f"{self.prenom} {self.nom}"


class PatientDraft(models.Model):
    """
    Profil temporaire du patient, créé après vérification email.
    Devient un vrai Patient uniquement quand la secrétaire confirme le 1er RDV.
    """
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='patient_draft'
    )
    nom = models.CharField(max_length=100)
    prenom = models.CharField(max_length=100)
    dateNaissance = models.DateField(null=True, blank=True)
    telephone = models.CharField(max_length=20, blank=True, null=True)
    cin = models.CharField(max_length=20, blank=True, null=True, unique=True)
    adresse = models.CharField(max_length=255, blank=True, null=True)
    genre = models.CharField(max_length=1, choices=Patient.GENRE_CHOICES, default='M')
    groupeSanguin = models.CharField(
        max_length=3, choices=Patient.GROUPE_SANGUIN_CHOICES, blank=True, null=True
    )
    allergies = models.TextField(blank=True, null=True)
    antecedents = models.TextField(blank=True, null=True)
    
    # ✅ NOUVEAU : Statut du draft
    STATUS_CHOICES = (
        ('ACTIF', 'Actif - En attente de 1ère visite'),
        ('CONVERTI', 'Converti - Patient officiel créé'),
        ('ABANDONNE', 'Abandonné - RDV manqué'),
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='ACTIF')
    
    # ✅ NOUVEAU : Lien vers le patient officiel (si converti)
    patient_officiel = models.OneToOneField(
        'Patient',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='draft_origine'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)  # ✅ AJOUTÉ (n'existait pas avant)

    class Meta:
        verbose_name = 'Brouillon Patient'
        verbose_name_plural = 'Brouillons Patients'

    def __str__(self):
        return f"[{self.get_status_display()}] {self.prenom} {self.nom}"

    @property
    def nom_complet(self):
        return f"{self.prenom} {self.nom}"
    
    @property
    def is_official(self):
        """Compatibilité avec l'ancien code"""
        return self.status == 'CONVERTI'