from django.db import models

class Ordonnance(models.Model):
    # Lien vers l'app consultations
    consultation = models.OneToOneField('consultations.Consultation', on_delete=models.CASCADE, related_name='ordonnance')
    date = models.DateField(auto_now_add=True)

class Medicament(models.Model):
    ordonnance = models.ForeignKey(Ordonnance, on_delete=models.CASCADE, related_name='medicaments')
    nom = models.CharField(max_length=200)
    dosage = models.CharField(max_length=100)
    posologie = models.TextField()