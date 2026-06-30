from rest_framework import serializers
from .models import Consultation


class ConsultationSerializer(serializers.ModelSerializer):
    # Infos du RDV imbriquées
    rdv_date = serializers.SerializerMethodField()
    rdv_heure = serializers.SerializerMethodField()
    rdv_motif = serializers.SerializerMethodField()
    rdv_type = serializers.SerializerMethodField()
    medecin_nom = serializers.SerializerMethodField()

    ordonnance = serializers.SerializerMethodField()

    class Meta:
        model = Consultation
        fields = [
            'id', 'rendezvous', 'rdv_date', 'rdv_heure', 'rdv_motif', 'rdv_type',
            'symptomes', 'diagnostic', 'notes', 'date_consultation',
            'medecin_nom', 'ordonnance'
        ]
        read_only_fields = ['id', 'date_consultation']

    def get_rdv_date(self, obj):
        return str(obj.rendezvous.date) if obj.rendezvous else None

    def get_rdv_heure(self, obj):
        return obj.rendezvous.heure if obj.rendezvous else None

    def get_rdv_motif(self, obj):
        return obj.rendezvous.motif if obj.rendezvous else None

    def get_rdv_type(self, obj):
        return obj.rendezvous.type if obj.rendezvous else None

    def get_medecin_nom(self, obj):
        if obj.rendezvous and obj.rendezvous.medecin:
            return obj.rendezvous.medecin.username
        return None

    def get_ordonnance(self, obj):
        try:
            if hasattr(obj, 'ordonnance') and obj.ordonnance:
                from apps.prescriptions.serializers import OrdonnanceSerializer
                return OrdonnanceSerializer(obj.ordonnance).data
        except Exception:
            pass
        return None