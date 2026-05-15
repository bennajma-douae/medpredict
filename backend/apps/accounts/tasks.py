from celery import shared_task
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone
from datetime import timedelta


@shared_task
def send_verification_email_task(subject, message, recipient_list):
    send_mail(
        subject=subject,
        message=message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=recipient_list,
        fail_silently=False,
    )
    return f"Email envoyé à {recipient_list}"


@shared_task
def send_appointment_notification_task(appointment_id, notification_type):
    """
    Envoie une notification email au patient concernant son rendez-vous.
    
    Types de notification :
    - 'confirmed'     : RDV confirmé par la secrétaire
    - 'cancelled'     : RDV annulé par la secrétaire
    - 'rescheduled'   : RDV déplacé à une autre date/heure
    - 'reminder_24h'  : Rappel automatique 24h avant
    - 'reminder_2h'   : Rappel automatique 2h avant
    """
    from apps.appointments.models import RendezVous
    from apps.patients.models import PatientDraft
    
    try:
        rdv = RendezVous.objects.select_related('user', 'patient').get(id=appointment_id)
        patient_email = rdv.user.email
        
        # Récupérer le nom complet du patient (depuis le draft ou le user)
        patient_name = rdv.user.username
        try:
            draft = PatientDraft.objects.get(user=rdv.user)
            patient_name = f"{draft.prenom} {draft.nom}"
        except PatientDraft.DoesNotExist:
            pass
        
        # Templates de notification
        templates = {
            'confirmed': {
                'subject': '✅ Votre rendez-vous est confirmé — MedPredict',
                'html': f"""
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px;">
                  <h2 style="color: #0d9488;">Bonjour {patient_name},</h2>
                  <p>Votre rendez-vous a été <strong>confirmé</strong> par notre secrétariat.</p>
                  <div style="background: #f0fdfa; border-left: 4px solid #0d9488; padding: 16px; margin: 20px 0; border-radius: 8px;">
                    <p style="margin: 0;"><strong>📅 Date :</strong> {rdv.date}</p>
                    <p style="margin: 8px 0 0;"><strong>🕐 Heure :</strong> {rdv.heure.strftime('%H:%M')}</p>
                    <p style="margin: 8px 0 0;"><strong>📍 Type :</strong> {'Visioconférence' if rdv.type == 'VISIO' else 'Au cabinet'}</p>
                    <p style="margin: 8px 0 0;"><strong>📝 Motif :</strong> {rdv.motif}</p>
                  </div>
                  <p style="color: #6b7280; font-size: 14px;">Un rappel vous sera envoyé 24 heures avant votre consultation.</p>
                  <p style="margin-top: 24px; color: #6b7280; font-size: 12px;">MedPredict — Système de Gestion Médicale</p>
                </div>
                """
            },
            'cancelled': {
                'subject': '❌ Votre rendez-vous a été annulé — MedPredict',
                'html': f"""
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px;">
                  <h2 style="color: #dc2626;">Bonjour {patient_name},</h2>
                  <p>Votre rendez-vous du <strong>{rdv.date}</strong> à <strong>{rdv.heure.strftime('%H:%M')}</strong> a été <strong>annulé</strong>.</p>
                  <div style="background: #fef2f2; border-left: 4px solid #dc2626; padding: 16px; margin: 20px 0; border-radius: 8px;">
                    <p style="margin: 0;">Pour prendre un nouveau rendez-vous, connectez-vous à votre espace patient ou contactez notre secrétariat.</p>
                  </div>
                  <a href="http://localhost:5173/patient" style="display: inline-block; background-color: #0d9488; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin: 12px 0;">Accéder à mon espace</a>
                  <p style="margin-top: 24px; color: #6b7280; font-size: 12px;">MedPredict — Système de Gestion Médicale</p>
                </div>
                """
            },
            'rescheduled': {
                'subject': '📅 Votre rendez-vous a été déplacé — MedPredict',
                'html': f"""
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px;">
                  <h2 style="color: #f59e0b;">Bonjour {patient_name},</h2>
                  <p>Votre rendez-vous a été <strong>déplacé</strong> à une nouvelle date.</p>
                  <div style="background: #fffbeb; border-left: 4px solid #f59e0b; padding: 16px; margin: 20px 0; border-radius: 8px;">
                    <p style="margin: 0;"><strong>📅 Nouvelle date :</strong> {rdv.date}</p>
                    <p style="margin: 8px 0 0;"><strong>🕐 Nouvelle heure :</strong> {rdv.heure.strftime('%H:%M')}</p>
                    <p style="margin: 8px 0 0;"><strong>📍 Type :</strong> {'Visioconférence' if rdv.type == 'VISIO' else 'Au cabinet'}</p>
                    <p style="margin: 8px 0 0;"><strong>📝 Motif :</strong> {rdv.motif}</p>
                  </div>
                  <p style="color: #6b7280; font-size: 14px;">Un nouveau rappel vous sera envoyé avant la consultation.</p>
                  <p style="margin-top: 24px; color: #6b7280; font-size: 12px;">MedPredict — Système de Gestion Médicale</p>
                </div>
                """
            },
            'reminder_24h': {
                'subject': '⏰ Rappel : Votre rendez-vous demain — MedPredict',
                'html': f"""
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px;">
                  <h2 style="color: #0d9488;">Bonjour {patient_name},</h2>
                  <p>Ceci est un <strong>rappel automatique</strong> pour votre rendez-vous de demain.</p>
                  <div style="background: #f0fdfa; border-left: 4px solid #0d9488; padding: 16px; margin: 20px 0; border-radius: 8px;">
                    <p style="margin: 0;"><strong>📅 Date :</strong> {rdv.date}</p>
                    <p style="margin: 8px 0 0;"><strong>🕐 Heure :</strong> {rdv.heure.strftime('%H:%M')}</p>
                    <p style="margin: 8px 0 0;"><strong>📍 Type :</strong> {'Visioconférence' if rdv.type == 'VISIO' else 'Au cabinet'}</p>
                  </div>
                  <p style="color: #6b7280; font-size: 14px;">Merci d'être ponctuel. En cas d'empêchement, veuillez nous prévenir au plus tôt.</p>
                  <p style="margin-top: 24px; color: #6b7280; font-size: 12px;">MedPredict — Système de Gestion Médicale</p>
                </div>
                """
            },
            'reminder_2h': {
                'subject': '🔔 Rappel : Votre rendez-vous dans 2 heures — MedPredict',
                'html': f"""
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px;">
                  <h2 style="color: #0d9488;">Bonjour {patient_name},</h2>
                  <p>Votre rendez-vous est dans <strong>2 heures</strong> !</p>
                  <div style="background: #f0fdfa; border-left: 4px solid #0d9488; padding: 16px; margin: 20px 0; border-radius: 8px;">
                    <p style="margin: 0;"><strong>🕐 Heure :</strong> {rdv.heure.strftime('%H:%M')}</p>
                    <p style="margin: 8px 0 0;"><strong>📍 Type :</strong> {'Visioconférence' if rdv.type == 'VISIO' else 'Au cabinet'}</p>
                  </div>
                  <p style="color: #6b7280; font-size: 14px;">À très bientôt !</p>
                  <p style="margin-top: 24px; color: #6b7280; font-size: 12px;">MedPredict — Système de Gestion Médicale</p>
                </div>
                """
            },
            # Dans send_appointment_notification_task, remplacez 'reminder_10min' par :

            'reminder_10min': {
                'subject': '🔔 Rappel : Votre rendez-vous dans 10 minutes — MedPredict',
                'html': f"""
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 16px;">
                    <div style="text-align: center; margin-bottom: 24px;">
                        <h2 style="color: #0d9488; margin: 0;">MedPredict</h2>
                        <p style="color: #64748b; margin: 4px 0 0;">Rappel de consultation</p>
                    </div>
                    
                    <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 16px; border-radius: 12px; margin: 16px 0;">
                        <p style="margin: 0; font-size: 14px; color: #dc2626; font-weight: bold;">
                            ⏰ Votre rendez-vous commence dans 10 minutes !
                        </p>
                    </div>
                    
                    <h3 style="color: #1e293b;">Bonjour {patient_name},</h3>
                    
                    <div style="background-color: #f8fafc; padding: 16px; border-radius: 12px; margin: 16px 0;">
                        <p style="margin: 0;"><strong>📅 Date :</strong> {rdv.date}</p>
                        <p style="margin: 8px 0 0;"><strong>🕐 Heure :</strong> {rdv.heure.strftime('%H:%M')}</p>
                        <p style="margin: 8px 0 0;"><strong>📝 Motif :</strong> {rdv.motif}</p>
                    </div>
                    
                    {'''<div style="background-color: #f0fdfa; padding: 16px; border-radius: 12px; margin: 16px 0; border: 1px solid #0d9488;">
                        <p style="margin: 0; color: #0d9488; font-weight: bold;">📹 Téléconsultation</p>
                        <p style="margin: 8px 0;">Vous allez recevoir votre lien de connexion par email dans un instant.</p>
                        <p style="margin: 8px 0 0; font-size: 12px;">👉 Assurez-vous d'avoir :</p>
                        <ul style="margin: 8px 0 0; font-size: 12px; color: #64748b;">
                            <li>Une connexion internet stable</li>
                            <li>Votre microphone et caméra fonctionnels</li>
                            <li>Un navigateur récent (Chrome, Edge, Firefox)</li>
                        </ul>
                    </div>''' if rdv.type == 'VISIO' else '''
                    <div style="background-color: #fef3c7; padding: 16px; border-radius: 12px; margin: 16px 0; border: 1px solid #f59e0b;">
                        <p style="margin: 0; color: #d97706; font-weight: bold;">🏥 Consultation au cabinet</p>
                        <p style="margin: 8px 0;">Merci de vous présenter au cabinet <strong>dans les plus brefs délais</strong>.</p>
                        <p style="margin: 8px 0 0; font-size: 12px;">📍 N'oubliez pas d'apporter :</p>
                        <ul style="margin: 8px 0 0; font-size: 12px; color: #64748b;">
                            <li>Votre carte d'identité (CIN)</li>
                            <li>Votre carte de mutuelle</li>
                            <li>Vos derniers examens ou analyses</li>
                        </ul>
                    </div>
                    '''}
                    
                    <div style="background-color: #fef2f2; padding: 12px; border-radius: 8px; margin: 16px 0;">
                        <p style="margin: 0; font-size: 12px; color: #92400e;">
                            ⚠️ En cas de retard, veuillez prévenir le secrétariat au <strong>+212 5 22 12 34 56</strong>
                        </p>
                    </div>
                    
                    <hr style="margin: 24px 0; border-color: #e2e8f0;">
                    
                    <p style="color: #64748b; font-size: 11px; text-align: center;">
                        Ceci est un message automatique, merci de ne pas y répondre.<br>
                        MedPredict — Soins médicaux intelligents
                    </p>
                </div>
                """
            }
        }
        
        template = templates.get(notification_type)
        if template:
            send_mail(
                subject=template['subject'],
                message='',  # Version texte vide, on utilise le HTML
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[patient_email],
                fail_silently=False,
                html_message=template['html']
            )
            return f"Notification '{notification_type}' envoyée à {patient_email}"
        else:
            return f"Type de notification inconnu: {notification_type}"
            
    except RendezVous.DoesNotExist:
        return f"RDV {appointment_id} non trouvé"
    except Exception as e:
        return f"Erreur envoi notification: {str(e)}"


@shared_task
def schedule_appointment_reminders(appointment_id):
    """
    Planifie les rappels automatiques (24h et 2h avant) pour un rendez-vous.
    À appeler après confirmation ou déplacement d'un RDV.
    """
    from apps.appointments.models import RendezVous
    
    try:
        rdv = RendezVous.objects.get(id=appointment_id)
        
        # Combiner date et heure en datetime
        rdv_datetime = timezone.make_aware(
            timezone.datetime.combine(rdv.date, rdv.heure)
        )
        
        # Rappel 24h avant
        reminder_24h = rdv_datetime - timedelta(hours=24)
        if reminder_24h > timezone.now():
            send_appointment_notification_task.apply_async(
                args=[appointment_id, 'reminder_24h'],
                eta=reminder_24h
            )
        
        # Rappel 2h avant
        reminder_2h = rdv_datetime - timedelta(hours=2)
        if reminder_2h > timezone.now():
            send_appointment_notification_task.apply_async(
                args=[appointment_id, 'reminder_2h'],
                eta=reminder_2h
            )
            
        return f"Rappels planifiés pour RDV {appointment_id} (24h: {reminder_24h}, 2h: {reminder_2h})"
        
    except RendezVous.DoesNotExist:
        return f"RDV {appointment_id} non trouvé"
    except Exception as e:
        return f"Erreur planification rappels: {str(e)}"