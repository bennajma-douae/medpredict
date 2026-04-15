from rest_framework import serializers
from .models import Ordonnance, Medicament

class MedicamentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Medicament
        fields = '__all__'

class OrdonnanceSerializer(serializers.ModelSerializer):
    # On imbrique le serializer des médicaments pour voir la liste dans l'ordonnance
    medicaments = MedicamentSerializer(many=True, read_only=True)

    class Meta:
        model = Ordonnance
        fields = '__all__'