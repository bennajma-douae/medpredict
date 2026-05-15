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

    @action(detail=False, methods=['get'], url_path='me')
    def me(self, request):
        """Retourne les infos de l'utilisateur connecté."""
        serializer = UserSerializer(request.user)
        return Response(serializer.data)