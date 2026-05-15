from django.db import models


class Consultation(models.Model):
    rendezvous = models.OneToOneField(
        'appointments.RendezVous',
        on_delete=models.CASCADE,
        related_name='consultation'
    )
    symptomes = models.TextField()
    diagnostic = models.TextField(blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    date_consultation = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Consultation'
        verbose_name_plural = 'Consultations'
        ordering = ['-date_consultation']

    def __str__(self):
        return f"Consultation du {self.date_consultation.strftime('%d/%m/%Y')} - RDV #{self.rendezvous_id}"