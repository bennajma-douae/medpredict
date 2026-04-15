from django.contrib import admin
from .models import Ordonnance, Medicament

admin.site.register(Ordonnance)
admin.site.register(Medicament)