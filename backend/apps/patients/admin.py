from django.contrib import admin
from .models import Patient , PatientDraft

admin.site.register(Patient)
admin.site.register(PatientDraft)