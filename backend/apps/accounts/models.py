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
    class Meta:
        verbose_name = 'Utilisateur'
        verbose_name_plural = 'Utilisateurs'

    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"