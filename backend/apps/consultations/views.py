from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from .models import Consultation
from .serializers import ConsultationSerializer
from apps.appointments.models import RendezVous


class ConsultationViewSet(viewsets.ModelViewSet):
    queryset = Consultation.objects.all()
    serializer_class = ConsultationSerializer
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=['post'], url_path='update-transcription')
    def update_transcription(self, request):
        """
        Reçoit la transcription audio de la téléconsultation
        et l'ajoute aux notes de la consultation
        """
        rdv_id = request.data.get('rdv_id')
        transcription = request.data.get('transcription', '')
        
        if not rdv_id:
            return Response(
                {'error': 'rdv_id requis'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not transcription:
            return Response(
                {'error': 'transcription requise'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Récupérer le rendez-vous
            rdv = RendezVous.objects.get(id=rdv_id)
            
            # Récupérer ou créer la consultation
            consultation = Consultation.objects.filter(rendezvous=rdv).first()
            
            if consultation:
                # Ajouter la transcription aux notes existantes
                timestamp = timezone.now().strftime('%d/%m/%Y %H:%M')
                new_notes = f"\n\n--- Transcription audio du {timestamp} ---\n{transcription}"
                
                if consultation.notes:
                    consultation.notes += new_notes
                else:
                    consultation.notes = f"--- Transcription audio du {timestamp} ---\n{transcription}"
                
                consultation.save()
                
                return Response({
                    'success': True,
                    'message': 'Transcription ajoutée aux notes de la consultation'
                })
            else:
                # Créer une consultation avec la transcription
                consultation = Consultation.objects.create(
                    rendezvous=rdv,
                    symptomes="Consultation par téléconsultation",
                    notes=f"--- Transcription audio ---\n{transcription}",
                    diagnostic="À compléter par le médecin"
                )
                
                return Response({
                    'success': True,
                    'message': 'Consultation créée avec la transcription',
                    'consultation_id': consultation.id
                })
                
        except RendezVous.DoesNotExist:
            return Response(
                {'error': f'Rendez-vous #{rdv_id} non trouvé'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': f'Erreur: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )