from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from django.utils import timezone
from django.conf import settings
import uuid
import random
import string
from datetime import datetime, timedelta

from .models import RendezVous
from .serializers import RendezVousSerializer
from apps.patients.models import Patient, PatientDraft
from apps.accounts.tasks import send_appointment_notification_task, schedule_appointment_reminders
from apps.accounts.tasks import send_verification_email_task


class RendezVousViewSet(viewsets.ModelViewSet):
    queryset = RendezVous.objects.all().select_related('patient', 'medecin', 'user')
    serializer_class = RendezVousSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'PATIENT':
            return RendezVous.objects.filter(user=user).select_related('patient', 'medecin', 'user').order_by('-date', 'heure')
        return RendezVous.objects.all().select_related('patient', 'medecin', 'user').order_by('-date', 'heure')

    def convertir_draft_si_premiere_visite(self, user):
        """Convertir le PatientDraft en Patient officiel après la 1ère consultation"""
        try:
            draft = PatientDraft.objects.get(user=user, status='ACTIF')
            
            patient = Patient.objects.create(
                user=user,
                nom=draft.nom,
                prenom=draft.prenom,
                cin=draft.cin,
                telephone=draft.telephone,
                dateNaissance=draft.dateNaissance,
                adresse=draft.adresse,
                genre=draft.genre,
                groupeSanguin=draft.groupeSanguin,
                allergies=draft.allergies,
                antecedents=draft.antecedents,
            )
            
            draft.status = 'CONVERTI'
            draft.patient_officiel = patient
            draft.save()
            
            return patient
            
        except PatientDraft.DoesNotExist:
            try:
                return Patient.objects.get(user=user)
            except Patient.DoesNotExist:
                return None

    def perform_create(self, serializer):
        user = self.request.user
        
        date = self.request.data.get('date')
        heure = self.request.data.get('heure')

        is_taken = RendezVous.objects.filter(
            date=date, 
            heure=heure
        ).exclude(statut='ANNULE').exists()
        
        if is_taken:
            raise ValidationError({"heure": "Ce créneau horaire est déjà réservé."})

        already_has_rdv = RendezVous.objects.filter(
            user=user, 
            date=date
        ).exclude(statut='ANNULE').exists()
        
        if already_has_rdv:
            raise ValidationError({"date": "Vous avez déjà un rendez-vous prévu pour cette journée."})

        patient = None
        if user.role == 'PATIENT':
            try:
                patient = Patient.objects.get(user=user)
            except Patient.DoesNotExist:
                patient = None

        medecin_id = self.request.data.get('medecin')
        if not medecin_id:
            from apps.accounts.models import User
            try:
                medecin = User.objects.filter(role='MEDECIN').first()
                medecin_id = medecin.id if medecin else None
            except Exception:
                medecin_id = None

        serializer.save(
            user=user,
            patient=patient,
            statut='EN_ATTENTE',
            medecin_id=medecin_id
        )

    @action(detail=True, methods=['patch'], url_path='confirmer')
    def confirmer(self, request, pk=None):
        rdv = self.get_object()
        
        if rdv.statut != 'EN_ATTENTE':
            return Response({'error': 'Ce rendez-vous ne peut pas être confirmé.'}, status=status.HTTP_400_BAD_REQUEST)
        
        rdv.statut = 'CONFIRME'
        rdv.save()
        
        send_appointment_notification_task.delay(rdv.id, 'confirmed')
        schedule_appointment_reminders.delay(rdv.id)
        
        return Response(RendezVousSerializer(rdv).data)

    @action(detail=True, methods=['patch'], url_path='terminer')
    def terminer(self, request, pk=None):
        rdv = self.get_object()
        
        if rdv.statut != 'CONFIRME':
            return Response({'error': 'Le rendez-vous doit être confirmé avant d\'être terminé.'}, status=status.HTTP_400_BAD_REQUEST)
        
        rdv.statut = 'TERMINE'
        rdv.save()
        
        if rdv.user and rdv.user.role == 'PATIENT':
            patient = self.convertir_draft_si_premiere_visite(rdv.user)
            if patient:
                rdv.patient = patient
                rdv.save()
        
        return Response(RendezVousSerializer(rdv).data)

    @action(detail=True, methods=['patch'], url_path='annuler')
    def annuler(self, request, pk=None):
        rdv = self.get_object()
        rdv.statut = 'ANNULE'
        rdv.save()
        
        send_appointment_notification_task.delay(rdv.id, 'cancelled')
        
        return Response(RendezVousSerializer(rdv).data)

    @action(detail=True, methods=['patch'], url_path='deplacer')
    def deplacer(self, request, pk=None):
        rdv = self.get_object()
        
        new_date = request.data.get('date')
        new_heure = request.data.get('heure')
        
        if not new_date or not new_heure:
            return Response({'error': 'Date et heure requises.'}, status=status.HTTP_400_BAD_REQUEST)
        
        is_taken = RendezVous.objects.filter(
            date=new_date, 
            heure=new_heure
        ).exclude(id=rdv.id).exclude(statut='ANNULE').exists()
        
        if is_taken:
            return Response({'error': 'Ce créneau est déjà réservé.'}, status=status.HTTP_400_BAD_REQUEST)
        
        rdv.date = new_date
        rdv.heure = new_heure
        rdv.save()
        
        send_appointment_notification_task.delay(rdv.id, 'rescheduled')
        schedule_appointment_reminders.delay(rdv.id)
        
        return Response(RendezVousSerializer(rdv).data)

    @action(detail=False, methods=['get'], url_path='occupied_slots')
    def occupied_slots(self, request):
        date = request.query_params.get('date')
        if not date:
            return Response([])

        taken = RendezVous.objects.filter(
            date=date
        ).exclude(statut='ANNULE').values_list('heure', flat=True)

        formatted_slots = [t.strftime('%H:%M') for t in taken]
        return Response(formatted_slots)

    @action(detail=False, methods=['get'], url_path='mes-rdv')
    def mes_rdv(self, request):
        if request.user.role != 'PATIENT':
            return Response({'error': 'Accès réservé aux patients.'}, status=status.HTTP_403_FORBIDDEN)

        rdvs = RendezVous.objects.filter(user=request.user).order_by('-date', 'heure')
        serializer = RendezVousSerializer(rdvs, many=True)
        return Response(serializer.data)
        
    @action(detail=True, methods=['post'], url_path='generer-lien-visio')
    def generer_lien_visio(self, request, pk=None):
        rdv = self.get_object()
        
        if rdv.type != 'VISIO':
            return Response({'error': 'Ce rendez-vous n\'est pas une téléconsultation.'}, status=status.HTTP_400_BAD_REQUEST)
        
        if rdv.statut != 'CONFIRME':
            return Response({'error': 'Le rendez-vous doit être confirmé avant de générer le lien.'}, status=status.HTTP_400_BAD_REQUEST)
        
        access_code = ''.join(random.choices(string.digits, k=6))
        
        rdv_datetime = timezone.make_aware(
            datetime.combine(rdv.date, rdv.heure)
        )
        expires_at = rdv_datetime + timedelta(hours=1)
        
        room_id = f"MedPredict-{rdv.id}-{uuid.uuid4().hex[:8].upper()}"
        
        rdv.visio_room_id = room_id
        rdv.visio_access_code = access_code
        rdv.visio_code_expires_at = expires_at
        rdv.save()
        
        patient_nom = rdv.patient_nom_complet if hasattr(rdv, 'patient_nom_complet') else f"{rdv.patient.prenom} {rdv.patient.nom}" if rdv.patient else "Patient"
        medecin_nom = rdv.medecin.username if rdv.medecin else "Médecin"
        
        teleconsult_url = "http://localhost:5000"
        
        patient_link = f"{teleconsult_url}/consultation?room={room_id}&role=patient&rdvId={rdv.id}&patient={patient_nom}&doctor=Dr.{medecin_nom}"
        doctor_link = f"{teleconsult_url}/consultation?room={room_id}&role=doctor&rdvId={rdv.id}&patient={patient_nom}&doctor=Dr.{medecin_nom}"
        
        subject = f"🔐 Votre téléconsultation MedPredict du {rdv.date} - Code: {access_code}"
        
        message_html = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 16px;">
            <div style="text-align: center; margin-bottom: 24px;">
                <h2 style="color: #0d9488; margin: 0;">MedPredict</h2>
                <p style="color: #64748b; margin: 4px 0 0;">Téléconsultation sécurisée</p>
            </div>
            
            <h3 style="color: #1e293b;">Bonjour {patient_nom},</h3>
            
            <p>Votre téléconsultation avec <strong>Dr. {medecin_nom}</strong> est prévue le :</p>
            
            <div style="background-color: #f0fdfa; padding: 16px; border-radius: 12px; margin: 16px 0; text-align: center;">
                <p style="margin: 0; font-size: 18px; font-weight: bold; color: #0d9488;">
                    📅 {rdv.date} à {rdv.heure.strftime('%H:%M')}
                </p>
            </div>
            
            <div style="background-color: #fef3c7; padding: 20px; border-radius: 12px; text-align: center; margin: 20px 0;">
                <p style="color: #92400e; font-size: 12px; margin-bottom: 8px;">Votre code d'accès unique :</p>
                <p style="font-size: 32px; font-weight: bold; letter-spacing: 0px; color: #d97706;">{access_code}</p>
                <p style="color: #92400e; font-size: 11px; margin-top: 8px;">Ce code expire le {expires_at.strftime('%d/%m/%Y à %H:%M')}</p>
            </div>
            
            <p>Pour rejoindre la consultation :</p>
            <ol style="color: #64748b; margin-left: 20px;">
                <li>Cliquez sur le bouton ci-dessous</li>
                <li>Entrez le code d'accès ci-dessus</li>
                <li>Autorisez l'accès à votre microphone et caméra</li>
            </ol>
            
            <div style="text-align: center; margin: 24px 0;">
                <a href="{patient_link}" 
                   style="display: inline-block; background-color: #0d9488; color: white; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: bold;">
                    🎥 Accéder à la consultation
                </a>
            </div>
            
            <div style="background-color: #fef3c7; padding: 12px; border-radius: 8px; margin: 16px 0;">
                <p style="margin: 0; font-size: 12px; color: #92400e;">
                    🔐 Ce code est personnel et ne doit pas être partagé.
                </p>
            </div>
            
            <hr style="margin: 24px 0; border-color: #e2e8f0;">
            
            <p style="color: #64748b; font-size: 12px; text-align: center;">
                MedPredict — Système de Gestion Médicale Intelligente<br>
                En cas de problème, contactez votre médecin directement.
            </p>
        </div>
        """
        
        send_verification_email_task.delay(
            subject=subject,
            message=message_html,
            recipient_list=[rdv.user.email]
        )
        
        return Response({
            'success': True,
            'doctor_link': doctor_link,
            'patient_link': patient_link,
            'room_id': room_id,
            'access_code': access_code,
            'code_expires_at': expires_at.isoformat(),
            'message': f"Code {access_code} envoyé à {rdv.user.email}"
        })
    
    # ✅ Endpoint public pour vérifier le code
    @action(detail=False, methods=['get'], url_path='verify-visio-code', permission_classes=[])
    def verify_visio_code(self, request):
        """Vérifie si le code d'accès est valide - Accès public"""
        
        rdv_id = request.query_params.get('rdv_id')
        code = request.query_params.get('code', '').replace(' ', '').strip()
        
        if not rdv_id or not code:
            return Response({'valid': False, 'error': 'Paramètres manquants'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            rdv = RendezVous.objects.get(id=rdv_id)
        except RendezVous.DoesNotExist:
            return Response({'valid': False, 'error': 'Rendez-vous introuvable'}, status=status.HTTP_404_NOT_FOUND)
        
        if rdv.visio_access_code != code:
            return Response({'valid': False, 'error': 'Code incorrect'})
        
        #if rdv.visio_code_expires_at and rdv.visio_code_expires_at < timezone.now():
            #return Response({'valid': False, 'error': 'Code expiré'})
        
        return Response({'valid': True})