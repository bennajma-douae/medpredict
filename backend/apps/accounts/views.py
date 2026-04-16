from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django.core.mail import send_mail
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes
from django.conf import settings   # ← Cet import est obligatoire

from .models import User
from .serializers import UserSerializer
from .tokens import email_verification_token


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        # Forcer email_verified = False pour les nouveaux comptes
        user.email_verified = False
        user.save()

        # === ENVOI DE L'EMAIL DE VÉRIFICATION ===
        if user.email:
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            token = email_verification_token.make_token(user)
            
            # Lien de vérification
            verification_link = f"{settings.SITE_URL}/api/users/verify-email/{uid}/{token}/"
            
            subject = "MedPredict - Vérifiez votre adresse email"
            message = f"""
Bonjour {user.username},

Merci de vous être inscrit sur MedPredict.

Cliquez sur le lien ci-dessous pour vérifier votre email :

{verification_link}

Ce lien est valide pendant 24 heures.

Cordialement,
L'équipe MedPredict
"""

            try:
                send_mail(
                    subject=subject,
                    message=message,
                    from_email=None,
                    recipient_list=[user.email],
                    fail_silently=False,
                )
                print(f"✅ Email de vérification envoyé à {user.email}")
            except Exception as e:
                print(f"❌ Erreur lors de l'envoi de l'email : {e}")

        return Response({
            "message": "Compte créé avec succès ! Un email de vérification a été envoyé.",
            "user_id": user.id,
            "email": user.email
        }, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['get'], url_path='verify-email/(?P<uidb64>[^/]+)/(?P<token>[^/]+)')
    def verify_email(self, request, uidb64=None, token=None):
            from django.utils.http import urlsafe_base64_decode
            from django.contrib.auth import get_user_model

            User = get_user_model()
            try:
                uid = urlsafe_base64_decode(uidb64).decode()
                user = User.objects.get(pk=uid)
            except (TypeError, ValueError, OverflowError, User.DoesNotExist):
                user = None

            if user is not None and email_verification_token.check_token(user, token):
                user.email_verified = True
                user.is_active = True
                user.save()
                
                # Redirection vers une page frontend de succès
                return Response({
                    "message": "Email vérifié avec succès !",
                    "redirect": "http://localhost:5173/patient"   # Redirige vers PatientLanding
                })
            else:
                return Response({
                    "error": "Lien de vérification invalide ou expiré."
                }, status=400)