from django.db import models
from django.conf import settings

class RendezVous(models.Model):
    STATUT_CHOICES = (
        ('EN_ATTENTE', 'En attente'), # Nouveau statut pour les demandes
        ('CONFIRME', 'Confirmé'),
        ('ANNULE', 'Annulé'),
        ('TERMINE', 'Terminé'),
    )
    TYPE_CHOICES = (('PRESENTIEL', 'Présentiel'), ('VISIO', 'À distance'))
    # L'utilisateur qui fait la demande (obligatoire)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='mes_demandes')
    
    # Le patient officiel (NULL au début, rempli par la secrétaire)
    patient = models.ForeignKey('patients.Patient', on_delete=models.SET_NULL, null=True, blank=True, related_name='rendezvous')
    
    medecin = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, limit_choices_to={'role': 'MEDECIN'})
    date = models.DateField()
    heure = models.TimeField()
    statut = models.CharField(max_length=20, choices=STATUT_CHOICES, default='EN_ATTENTE')
    motif = models.TextField()
    type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='PRESENTIEL')
    visio_room_id = models.CharField(max_length=100, blank=True, null=True)
    visio_access_code = models.CharField(max_length=10, blank=True, null=True)
    visio_code_expires_at = models.DateTimeField(blank=True, null=True)  # Expiration