from django.contrib.auth import get_user_model
from django.utils.http import urlsafe_base64_decode
from django.utils.encoding import force_str
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action, api_view, permission_classes as pc
from rest_framework.response import Response
from rest_framework.permissions import AllowAny

from .serializers import UserSerializer
from .tokens import email_verification_token

User = get_user_model()


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer

    def get_permissions(self):
        if self.action in ['create', 'activate']:
            return [AllowAny()]
        return [permissions.IsAuthenticated()]

    def create(self, request, *args, **kwargs):
        """Créer un compte + envoyer l'email de vérification via Brevo."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        # Envoi de l'email de vérification
        try:
            from .tokens import email_verification_token
            from django.utils.http import urlsafe_base64_encode
            from django.utils.encoding import force_bytes
            import requests as req_lib
            import os

            uid = urlsafe_base64_encode(force_bytes(user.pk))
            token = email_verification_token.make_token(user)

            # URL du frontend pour l'activation
            frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:5173')
            activation_link = f"{frontend_url}/activate/{uid}/{token}/"

            brevo_api_key = os.getenv("BREVO_API_KEY")
            payload = {
                "sender": {"name": "MedPredict", "email": "douaebennajma11@gmail.com"},
                "to": [{"email": user.email}],
                "subject": "Activez votre compte MedPredict",
                "htmlContent": f"""
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px;">
                  <h2 style="color: #0d9488;">Bienvenue sur MedPredict !</h2>
                  <p>Merci de créer votre compte. Cliquez sur le bouton ci-dessous pour activer votre compte et compléter votre profil.</p>
                  <a href="{activation_link}" style="display: inline-block; background-color: #0d9488; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; margin: 20px 0;">
                    Activer mon compte
                  </a>
                  <p style="color: #6b7280; font-size: 12px;">Ce lien expire dans 24 heures. Si vous n'avez pas créé ce compte, ignorez cet email.</p>
                </div>
                """
            }
            resp = req_lib.post(
                "https://api.brevo.com/v3/smtp/email",
                json=payload,
                headers={"api-key": brevo_api_key, "Content-Type": "application/json"},
                timeout=8
            )
            # ✅ Log la réponse pour diagnostiquer les erreurs
            print(f"[BREVO] Status: {resp.status_code} | Réponse: {resp.text}")
            if resp.status_code not in (200, 201):
                print(f"[BREVO] ❌ Échec envoi email à {user.email}: {resp.text}")
            else:
                print(f"[BREVO] ✅ Email de vérification envoyé à {user.email}")
        except Exception as e:
            print(f"Erreur envoi email: {e}")

        headers = self.get_success_headers(serializer.data)
        return Response(
            {'message': 'Compte créé ! Un email de vérification a été envoyé.', 'user': serializer.data},
            status=status.HTTP_201_CREATED,
            headers=headers
        )

    @action(detail=False, methods=['get', 'post'], url_path=r'activate/(?P<uidb64>[^/.]+)/(?P<token>[^/.]+)')
    def activate(self, request, uidb64=None, token=None):
        """GET: Valider le token | POST: Activer + créer le profil temporaire PatientDraft."""
        try:
            uid = force_str(urlsafe_base64_decode(uidb64))
            user = User.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            return Response({'valid': False, 'error': 'Lien invalide.'}, status=status.HTTP_400_BAD_REQUEST)

        if not email_verification_token.check_token(user, token):
            return Response({'valid': False, 'error': 'Lien expiré ou invalide.'}, status=status.HTTP_400_BAD_REQUEST)

        if request.method == 'GET':
            # Simple vérification : le token est valide
            return Response({
                'valid': True,
                'email': user.email,
                'already_verified': user.email_verified
            })

        # POST : Activer le compte + créer le PatientDraft (PAS Patient officiel)
        if request.method == 'POST':
            # ✅ CHANGEMENT 1 : Import PatientDraft au lieu de Patient
            from apps.patients.models import PatientDraft

            data = request.data
            required_fields = ['nom', 'prenom', 'cin', 'telephone', 'dateNaissance']
            for field in required_fields:
                if not data.get(field):
                    return Response({'error': f'Le champ {field} est requis.'}, status=status.HTTP_400_BAD_REQUEST)

            # ✅ CHANGEMENT 2 : Vérifier CIN dans PatientDraft
            if PatientDraft.objects.filter(cin=data['cin']).exclude(user=user).exists():
                return Response({'error': 'Ce numéro CIN est déjà utilisé.'}, status=status.HTTP_400_BAD_REQUEST)

            # Activer l'email
            user.email_verified = True
            user.save()

             # ✅ CHANGEMENT 3 : Créer PatientDraft (brouillon), PAS Patient
            draft, created = PatientDraft.objects.update_or_create(
                user=user,
                defaults={
                    'nom': data['nom'],
                    'prenom': data['prenom'],
                    'cin': data['cin'],
                    'telephone': data['telephone'],
                    'dateNaissance': data['dateNaissance'],
                    'genre': data.get('genre', 'M'),
                    'adresse': data.get('adresse', ''),
                    'groupeSanguin': data.get('groupeSanguin'),
                    'allergies': data.get('allergies'),
                    'antecedents': data.get('antecedents'),
                }
            )

            # SYNCHRONISER avec User.first_name / User.last_name
            user.first_name = data['prenom']
            user.last_name = data['nom']
            user.save()

            return Response({
                'success': True,
                'message': 'Compte activé et profil temporaire créé avec succès !'
            }, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get', 'patch', 'put'], url_path='me')
    def me(self, request):
        """Retourne ou met à jour les infos de l'utilisateur connecté."""
        if request.method in ['PATCH', 'PUT']:
            serializer = UserSerializer(request.user, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            user = serializer.save()
            # Mettre à jour le mot de passe si fourni
            password = request.data.get('password')
            if password:
                user.set_password(password)
                user.save()
            return Response(serializer.data)
        
        serializer = UserSerializer(request.user)
        return Response(serializer.data)


from .models import CabinetConfig, EmailTemplate
from .serializers import CabinetConfigSerializer, EmailTemplateSerializer

class CabinetConfigViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def list(self, request):
        config, created = CabinetConfig.objects.get_or_create(id=1)
        serializer = CabinetConfigSerializer(config)
        return Response(serializer.data)

    def create(self, request):
        if request.user.role not in ['ADMIN', 'SECRETAIRE']:
            return Response({'error': 'Non autorisé.'}, status=status.HTTP_403_FORBIDDEN)
        config, created = CabinetConfig.objects.get_or_create(id=1)
        serializer = CabinetConfigSerializer(config, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class EmailTemplateViewSet(viewsets.ModelViewSet):
    queryset = EmailTemplate.objects.all()
    serializer_class = EmailTemplateSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'key'

    def list(self, request):
        defaults = {
            'confirmed': {
                'label': '✅ Confirmation RDV',
                'sujet': '✅ Votre rendez-vous est confirmé — MedPredict',
                'corps': "Bonjour {nom_destinataire},\n\nVotre rendez-vous a été confirmé par notre secrétariat.\n\n📅 Date : {date}\n🕐 Heure : {heure}\n📍 Type : {type_visite}\n📝 Motif : {motif}\n\nUn rappel vous sera envoyé 24 heures avant votre consultation.\n\nCordialement,\nMedPredict — Système de Gestion Médicale"
            },
            'cancelled': {
                'label': '❌ Annulation RDV',
                'sujet': '❌ Votre rendez-vous a été annulé — MedPredict',
                'corps': "Bonjour {nom_destinataire},\n\nVotre rendez-vous du {date} à {heure} a été annulé.\n\nPour prendre un nouveau rendez-vous, connectez-vous à votre espace patient ou contactez notre secrétariat.\n\nCordialement,\nMedPredict — Système de Gestion Médicale"
            },
            'rescheduled': {
                'label': '📅 Déplacement de RDV',
                'sujet': '📅 Votre rendez-vous a été déplacé — MedPredict',
                'corps': "Bonjour {nom_destinataire},\n\nVotre rendez-vous a été déplacé à une nouvelle date.\n\n📅 Nouvelle date : {date}\n🕐 Nouvelle heure : {heure}\n📍 Type : {type_visite}\n📝 Motif : {motif}\n\nUn nouveau rappel vous sera envoyé avant la consultation.\n\nCordialement,\nMedPredict — Système de Gestion Médicale"
            },
            'reminder_24h': {
                'label': '⏰ Rappel 24 heures',
                'sujet': '⏰ Rappel : Votre rendez-vous demain — MedPredict',
                'corps': "Bonjour {nom_destinataire},\n\nCeci est un rappel automatique pour votre rendez-vous de demain.\n\n📅 Date : {date}\n🕐 Heure : {heure}\n📍 Type : {type_visite}\n\nMerci d'être ponctuel. En cas d'empêchement, veuillez nous prévenir au plus tôt.\n\nCordialement,\nMedPredict — Système de Gestion Médicale"
            },
            'reminder_2h': {
                'label': '🔔 Rappel 2 heures',
                'sujet': '🔔 Rappel : Votre rendez-vous dans 2 heures — MedPredict',
                'corps': "Bonjour {nom_destinataire},\n\nVotre rendez-vous est dans 2 heures !\n\n🕐 Heure : {heure}\n📍 Type : {type_visite}\n\nÀ très bientôt !\n\nCordialement,\nMedPredict — Système de Gestion Médicale"
            },
            'reminder_10min': {
                'label': '⚡ Rappel 10 minutes',
                'sujet': '🔔 Rappel : Votre rendez-vous dans 10 minutes — MedPredict',
                'corps': "Bonjour {nom_destinataire},\n\nVotre rendez-vous commence dans 10 minutes !\n\n📅 Date : {date}\n🕐 Heure : {heure}\n📝 Motif : {motif}\n\nMerci de vous présenter ou de vous préparer à rejoindre la téléconsultation.\n\nCordialement,\nMedPredict — Soins médicaux intelligents"
            }
        }
        for k, v in defaults.items():
            EmailTemplate.objects.get_or_create(
                key=k,
                defaults={
                    'label': v['label'],
                    'sujet': v['sujet'],
                    'corps': v['corps']
                }
            )
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)