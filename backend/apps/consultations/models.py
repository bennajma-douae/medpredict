from django.db import models

class Consultation(models.Model):
    # Lien vers l'app appointments
    rendezvous = models.OneToOneField('appointments.RendezVous', on_delete=models.CASCADE, related_name='consultation')
    date = models.DateTimeField(auto_now_add=True)
    symptomes = models.TextField() 
    diagnostic = models.TextField()
    notes = models.TextField(blank=True)
    pathologies_probables = models.JSONField(null=True, blank=True) 
    score_confiance = models.FloatField(null=True, blank=True)