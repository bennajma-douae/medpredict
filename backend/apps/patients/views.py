from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.http import HttpResponse
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from io import BytesIO

# ✅ NOUVEAUX IMPORTS AJOUTÉS :
from django.contrib.auth import get_user_model
import uuid
from django.utils import timezone

from .models import Patient, PatientDraft
from .serializers import PatientSerializer, PatientUpdateSerializer

User = get_user_model()


class PatientViewSet(viewsets.ModelViewSet):
    queryset = Patient.objects.all().select_related('user')
    serializer_class = PatientSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        # Un patient ne voit que son propre profil
        if user.role == 'PATIENT':
            return Patient.objects.filter(user=user).select_related('user')
        # Médecin / Secrétaire voient tous les patients
        return Patient.objects.all().select_related('user')

    @action(detail=False, methods=['get'], url_path='me')
    def me(self, request):
        """Retourne le profil du patient connecté (Patient officiel OU PatientDraft)."""
        user = request.user
        
        # 1. Essayer d'abord le vrai Patient (officiel)
        try:
            patient = Patient.objects.select_related('user').get(user=user)
            serializer = PatientSerializer(patient)
            data = serializer.data
            data['is_official'] = True
            data['draft_status'] = 'CONVERTI'
            return Response(data)
        except Patient.DoesNotExist:
            pass
        
        # 2. Sinon, retourner le PatientDraft
        try:
            draft = PatientDraft.objects.get(user=user)
            
            # Message selon le statut
            status_messages = {
                'ACTIF': 'En attente de première visite',
                'ABANDONNE': 'RDV manqué - Veuillez reprendre rendez-vous',
            }
            
            data = {
                'id': None,
                'user': user.id,
                'nom': draft.nom,
                'prenom': draft.prenom,
                'nom_complet': draft.nom_complet,
                'dateNaissance': draft.dateNaissance,
                'telephone': draft.telephone,
                'cin': draft.cin,
                'adresse': draft.adresse,
                'genre': draft.genre,
                'groupeSanguin': draft.groupeSanguin,
                'allergies': draft.allergies,
                'antecedents': draft.antecedents,
                'email': user.email,
                'created_at': draft.created_at,
                'updated_at': draft.updated_at,
                'is_official': draft.is_official,
                'draft_status': draft.status,
                'status_message': status_messages.get(draft.status, ''),
            }
            return Response(data)
        except PatientDraft.DoesNotExist:
            return Response({
                'has_dossier': False, 
                'detail': 'Profil patient non trouvé.'
            }, status=status.HTTP_200_OK)
        
    @action(detail=False, methods=['patch'], url_path='me/update')
    def update_me(self, request):
        """Permet au patient connecté de modifier ses infos (Patient ou PatientDraft)."""
        user = request.user
        
        email = request.data.get('email')
        if email and email != user.email:
            if User.objects.filter(email=email).exclude(id=user.id).exists():
                return Response({'detail': 'Cet email est déjà utilisé par un autre utilisateur.'}, status=status.HTTP_400_BAD_REQUEST)
            user.email = email
            user.save()
        
        # 1. Chercher d'abord le PatientDraft (le plus courant)
        try:
            draft = PatientDraft.objects.get(user=user)
            
            # Si le draft est encore actif ou abandonné → on le modifie
            if draft.status in ['ACTIF', 'ABANDONNE']:
                allowed_fields = ['nom', 'prenom', 'dateNaissance', 'telephone', 'cin', 'adresse', 'genre', 'groupeSanguin', 'allergies', 'antecedents']
                for field in allowed_fields:
                    if field in request.data:
                        setattr(draft, field, request.data[field])
                draft.save()
                
                # Synchroniser avec User
                if 'nom' in request.data:
                    user.last_name = request.data['nom']
                if 'prenom' in request.data:
                    user.first_name = request.data['prenom']
                user.save()
                
                status_messages = {
                    'ACTIF': 'En attente de première visite',
                    'ABANDONNE': 'RDV manqué - Veuillez reprendre rendez-vous',
                }
                
                data = {
                    'id': None,
                    'user': user.id,
                    'nom': draft.nom,
                    'prenom': draft.prenom,
                    'nom_complet': draft.nom_complet,
                    'dateNaissance': draft.dateNaissance,
                    'telephone': draft.telephone,
                    'cin': draft.cin,
                    'adresse': draft.adresse,
                    'genre': draft.genre,
                    'groupeSanguin': draft.groupeSanguin,
                    'allergies': draft.allergies,
                    'antecedents': draft.antecedents,
                    'email': user.email,
                    'created_at': draft.created_at,
                    'updated_at': draft.updated_at,
                    'is_official': draft.is_official,
                    'draft_status': draft.status,
                    'status_message': status_messages.get(draft.status, ''),
                }
                return Response(data)
            
            # Si CONVERTI → on ne modifie pas le draft, on passe au Patient
            # (le draft est archivé)
            
        except PatientDraft.DoesNotExist:
            pass
        
        # 2. Sinon, chercher le Patient officiel
        try:
            patient = Patient.objects.get(user=user)
            serializer = PatientUpdateSerializer(patient, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                
                # Synchroniser avec User
                if 'nom' in request.data:
                    user.last_name = request.data['nom']
                if 'prenom' in request.data:
                    user.first_name = request.data['prenom']
                user.save()
                
                return Response(PatientSerializer(patient).data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Patient.DoesNotExist:
            pass
        
        # 3. Ni l'un ni l'autre
        return Response({'detail': 'Profil patient non trouvé.'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=False, methods=['get'], url_path='me/dossier')
    def dossier(self, request):
        """Retourne le dossier médical complet du patient connecté."""
        try:
            patient = Patient.objects.select_related('user').get(user=request.user)
        except Patient.DoesNotExist:
            return Response({'has_dossier': False, 'detail': 'Aucun dossier médical trouvé.'}, status=status.HTTP_200_OK)

        # Récupérer toutes les consultations liées aux RDV du patient
        from apps.consultations.models import Consultation
        from apps.consultations.serializers import ConsultationSerializer
        from apps.appointments.models import RendezVous

        rdvs = RendezVous.objects.filter(patient=patient).order_by('-date')
        rdv_ids = rdvs.values_list('id', flat=True)
        consultations = Consultation.objects.filter(rendezvous__in=rdv_ids).select_related('rendezvous').order_by('-rendezvous__date')

        patient_data = PatientSerializer(patient).data
        consultations_data = ConsultationSerializer(consultations, many=True).data

        return Response({
            'has_dossier': True,
            'patient': patient_data,
            'consultations': consultations_data,
            'nb_consultations': consultations.count(),
            'nb_rdv': rdvs.count(),
        })

    @action(detail=True, methods=['get'], url_path='dossier')
    def detail_dossier(self, request, pk=None):
        """Retourne le dossier médical complet d'un patient spécifique (réservé au médecin)."""
        if request.user.role != 'MEDECIN':
            return Response({'detail': 'Accès refusé. Seul le médecin peut consulter le dossier médical.'}, status=status.HTTP_403_FORBIDDEN)
            
        patient = self.get_object()
        
        from apps.consultations.models import Consultation
        from apps.consultations.serializers import ConsultationSerializer
        from apps.appointments.models import RendezVous

        rdvs = RendezVous.objects.filter(patient=patient).order_by('-date')
        rdv_ids = rdvs.values_list('id', flat=True)
        consultations = Consultation.objects.filter(rendezvous__in=rdv_ids).select_related('rendezvous').order_by('-rendezvous__date')

        patient_data = PatientSerializer(patient).data
        consultations_data = ConsultationSerializer(consultations, many=True).data

        return Response({
            'has_dossier': True,
            'patient': patient_data,
            'consultations': consultations_data,
            'nb_consultations': consultations.count(),
            'nb_rdv': rdvs.count(),
        })

    @action(detail=False, methods=['get'], url_path='me/download-dossier')
    def download_pdf(self, request):
        import traceback
        from io import BytesIO
        from reportlab.pdfgen import canvas
        from reportlab.lib.pagesizes import A4
        from django.utils import timezone

        try:
            patient = Patient.objects.get(user=request.user)
            
            # Charger les configurations du cabinet (100% dynamique)
            from apps.accounts.models import CabinetConfig
            try:
                cab = CabinetConfig.objects.get(id=1)
                cabinet_name = cab.nom
                pdf_footer = cab.pied_page
            except Exception:
                cabinet_name = "MedPredict"
                pdf_footer = "Document confidentiel genere par le systeme intelligent MedPredict."
        except Patient.DoesNotExist:
            return Response({'error': 'Profil patient non trouve'}, status=404)

        try:
            from apps.consultations.models import Consultation
            from apps.appointments.models import RendezVous
            from apps.prescriptions.models import Ordonnance, Medicament

            rdv_ids = list(RendezVous.objects.filter(patient=patient).values_list('id', flat=True))
            consultations = list(Consultation.objects.filter(rendezvous__in=rdv_ids).order_by('-date_consultation'))

            ordonnances_data = {}
            for consultation in consultations:
                try:
                    ordonnance = Ordonnance.objects.get(consultation=consultation)
                    medicaments = list(Medicament.objects.filter(ordonnance=ordonnance))
                    ordonnances_data[consultation.id] = {'ordonnance': ordonnance, 'medicaments': medicaments}
                except Ordonnance.DoesNotExist:
                    ordonnances_data[consultation.id] = None

        except Exception as e:
            traceback.print_exc()
            return Response({'error': 'Erreur donnees: ' + str(e)}, status=500)

        try:
            buffer = BytesIO()
            p = canvas.Canvas(buffer, pagesize=A4)
            width, height = A4

            p.setFillColorRGB(0.118, 0.251, 0.686)
            p.rect(0, height - 80, width, 80, fill=1, stroke=0)
            p.setFillColorRGB(1, 1, 1)
            p.setFont("Helvetica-Bold", 20)
            p.drawCentredString(width / 2, height - 35, "DOSSIER MEDICAL NUMERIQUE")
            p.setFont("Helvetica", 10)
            p.drawCentredString(width / 2, height - 55, f"{cabinet_name} - Systeme de Gestion Medicale")

            y = height - 100

            def section_title(title, r, g, b):
                nonlocal y
                p.setFillColorRGB(r, g, b)
                p.setFont("Helvetica-Bold", 13)
                p.drawString(50, y, title)
                y -= 8
                p.setStrokeColorRGB(r, g, b)
                p.line(50, y, width - 50, y)
                y -= 18

            def draw_row(label, value):
                nonlocal y
                p.setFillColorRGB(0.243, 0.302, 0.388)
                p.setFont("Helvetica-Bold", 9)
                p.drawString(55, y, label)
                p.setFillColorRGB(0.122, 0.161, 0.22)
                p.setFont("Helvetica", 9)
                val = str(value)[:90] if value else "N/A"
                p.drawString(200, y, val)
                y -= 16

            section_title("IDENTITE DU PATIENT", 0.118, 0.251, 0.686)
            dob = patient.dateNaissance.strftime('%d/%m/%Y') if patient.dateNaissance else None
            age_val = self.calculer_age(patient.dateNaissance) if patient.dateNaissance else None
            dob_str = (str(dob) + ' (Age: ' + str(age_val) + ' ans)') if dob else None
            genre_label = 'Masculin' if patient.genre == 'M' else ('Feminin' if patient.genre == 'F' else str(patient.genre or ''))
            draw_row("Nom complet :", patient.nom_complet)
            draw_row("CIN :", patient.cin)
            draw_row("Date de naissance :", dob_str)
            draw_row("Genre :", genre_label)
            draw_row("Telephone :", patient.telephone)
            draw_row("Groupe sanguin :", patient.groupeSanguin)
            draw_row("Adresse :", patient.adresse)
            y -= 10

            section_title("INFORMATIONS MEDICALES", 0.702, 0.345, 0.035)
            draw_row("Allergies :", patient.allergies or "Aucune allergie connue")
            ant = str(patient.antecedents or "Aucun antecedent connu")
            draw_row("Antecedents :", ant[:80] + ("..." if len(ant) > 80 else ""))
            y -= 10

            section_title("HISTORIQUE DES CONSULTATIONS", 0.118, 0.251, 0.686)

            if consultations:
                for c in consultations:
                    if y < 120:
                        p.showPage()
                        y = height - 50
                    date_str = c.date_consultation.strftime('%d/%m/%Y a %H:%M')
                    p.setFillColorRGB(0.02, 0.38, 0.63)
                    p.setFont("Helvetica-Bold", 10)
                    p.drawString(55, y, "> Consultation du " + date_str)
                    y -= 15
                    symp = str(c.symptomes or '')[:100] + ("..." if len(str(c.symptomes or '')) > 100 else "")
                    draw_row("Symptomes :", symp)
                    diag = str(c.diagnostic or 'Non specifie')[:100]
                    draw_row("Diagnostic :", diag)
                    if c.notes:
                        draw_row("Notes :", str(c.notes)[:80])
                    ord_data = ordonnances_data.get(c.id)
                    if ord_data and ord_data['medicaments']:
                        p.setFillColorRGB(0.02, 0.37, 0.27)
                        p.setFont("Helvetica-Bold", 9)
                        p.drawString(60, y, "Ordonnance :")
                        y -= 13
                        for med in ord_data['medicaments']:
                            if y < 80:
                                p.showPage()
                                y = height - 50
                            p.setFillColorRGB(0.122, 0.161, 0.22)
                            p.setFont("Helvetica", 8)
                            posologie = str(med.posologie or '')[:60]
                            p.drawString(75, y, "- " + str(med.nom) + "  |  " + str(med.dosage) + "  |  " + posologie)
                            y -= 12
                    else:
                        p.setFillColorRGB(0.5, 0.5, 0.5)
                        p.setFont("Helvetica-Oblique", 8)
                        p.drawString(65, y, "Aucune ordonnance pour cette consultation")
                        y -= 12
                    p.setStrokeColorRGB(0.82, 0.84, 0.87)
                    p.line(50, y, width - 50, y)
                    y -= 12
            else:
                p.setFillColorRGB(0.5, 0.5, 0.5)
                p.setFont("Helvetica-Oblique", 10)
                p.drawString(55, y, "Aucune consultation enregistree pour ce patient.")
                y -= 20

            if y < 100:
                p.showPage()
                y = height - 50
            y -= 10
            section_title("RECAPITULATIF", 0.09, 0.40, 0.20)
            draw_row("Nombre total de RDV :", str(len(rdv_ids)))
            draw_row("Nombre total de consultations :", str(len(consultations)))
            draw_row("Ordonnances prescrites :", str(sum(1 for v in ordonnances_data.values() if v is not None)))

            p.setStrokeColorRGB(0.118, 0.251, 0.686)
            p.line(50, 45, width - 50, 45)
            p.setFillColorRGB(0.42, 0.47, 0.53)
            p.setFont("Helvetica", 7)
            p.drawCentredString(width / 2, 32, f"{pdf_footer} - Genere le " + timezone.now().strftime('%d/%m/%Y a %H:%M:%S'))

            p.save()
            buffer.seek(0)

            nom_safe = str(patient.nom or 'Patient').replace(' ', '_')
            prenom_safe = str(patient.prenom or '').replace(' ', '_')
            filename = "Dossier_Medical_" + nom_safe + "_" + prenom_safe + "_" + timezone.now().strftime('%Y%m%d') + ".pdf"
            return HttpResponse(buffer.getvalue(), content_type='application/pdf',
                                headers={'Content-Disposition': 'attachment; filename="' + filename + '"'})

        except Exception as e:
            traceback.print_exc()
            return Response({'error': 'Erreur PDF: ' + str(e)}, status=500)

    def calculer_age(self, date_naissance):
        """Calcule l'âge à partir de la date de naissance."""
        if not date_naissance:
            return None
        today = timezone.now().date()
        age = today.year - date_naissance.year
        if today.month < date_naissance.month or (today.month == date_naissance.month and today.day < date_naissance.day):
            age -= 1
        return age

    def _generate_simple_pdf(self, patient, consultations, ordonnances_data, buffer):
        """Méthode de fallback avec QR Code fonctionnel"""
        from reportlab.pdfgen import canvas
        from reportlab.lib.pagesizes import A4
        from django.utils import timezone
        import os
        import tempfile
        import qrcode
        
        p = canvas.Canvas(buffer, pagesize=A4)
        width, height = A4
        y = height - 50
        
        # Entête
        p.setFont("Helvetica-Bold", 22)
        p.drawCentredString(width/2, height - 50, "DOSSIER MEDICAL NUMERIQUE")
        
        p.setFont("Helvetica-Bold", 14)
        p.drawString(50, height - 90, f"Patient : {patient.nom_complet}")
        
        p.setFont("Helvetica", 11)
        p.drawString(50, height - 110, f"CIN : {patient.cin or 'N/A'}")
        p.drawString(50, height - 125, f"Telephone : {patient.telephone or 'N/A'}")
        p.drawString(50, height - 140, f"Groupe Sanguin : {patient.groupeSanguin or 'N/A'}")
        
        # ==================== QR CODE (CORRIGÉ) ====================
        qr_placed = False
        try:
            # Données à encoder dans le QR code
            qr_data = f"MEDPREDICT|ID:{patient.id}|NAME:{patient.nom_complet}"
            
            qr = qrcode.QRCode(
                version=2,
                error_correction=qrcode.constants.ERROR_CORRECT_M,
                box_size=6,
                border=1,
            )
            qr.add_data(qr_data)
            qr.make(fit=True)
            
            qr_img = qr.make_image(fill_color="#1e3a8a", back_color="white")
            
            # Sauvegarde en mémoire
            qr_buffer = BytesIO()
            qr_img.save(qr_buffer, format='PNG')
            qr_buffer.seek(0)
            
            from reportlab.lib.utils import ImageReader
            qr_reader = ImageReader(qr_buffer)
            
            p.drawImage(qr_reader, width - 90, height - 100, width=60, height=60)
            p.setFont("Helvetica", 6)
            p.drawString(width - 85, height - 115, "Scanner le QR")
            qr_placed = True
            
        except Exception as e:
            print(f"Erreur QR Code: {e}")
            p.setFont("Helvetica-Oblique", 8)
            p.drawString(width - 100, height - 80, "QR Code non disponible")
        
        p.line(50, height - 165, width - 50, height - 165)
        
        # Antécédents & allergies
        p.setFont("Helvetica-Bold", 12)
        p.drawString(50, height - 190, "Informations Medicales de Base :")
        p.setFont("Helvetica", 10)
        
        # Nettoyer les textes
        allergies = patient.allergies if patient.allergies else "Aucune"
        if allergies and len(allergies) > 50:
            allergies = allergies[:47] + "..."
        p.drawString(70, height - 210, f"Allergies : {allergies}")
        
        antecedents = patient.antecedents if patient.antecedents else "Aucun"
        if antecedents and len(antecedents) > 50:
            antecedents = antecedents[:47] + "..."
        p.drawString(70, height - 225, f"Antecedents : {antecedents}")
        
        # Historique des consultations
        p.setFont("Helvetica-Bold", 12)
        p.drawString(50, height - 260, "Historique des Consultations :")
        
        y = height - 285
        for c in consultations:
            if y < 100:
                p.showPage()
                y = height - 50
                p.setFont("Helvetica", 10)
            
            p.setFont("Helvetica-Bold", 10)
            date_str = c.date_consultation.strftime('%d/%m/%Y')
            p.drawString(60, y, f"> Consultation du {date_str}")
            
            p.setFont("Helvetica", 9)
            symptomes = c.symptomes[:80] if c.symptomes else "Non renseignes"
            if len(symptomes) > 80:
                symptomes = symptomes[:77] + "..."
            p.drawString(70, y - 15, f"Symptomes : {symptomes}")
            
            p.setFont("Helvetica-Oblique", 9)
            diag = c.diagnostic[:80] if c.diagnostic else "Non specifie"
            if len(diag) > 80:
                diag = diag[:77] + "..."
            p.drawString(70, y - 30, f"Diagnostic : {diag}")
            
            # Ordonnances
            if ordonnances_data.get(c.id):
                p.setFont("Helvetica-Bold", 9)
                p.drawString(70, y - 45, "Ordonnance :")
                y -= 20
                for med in ordonnances_data[c.id]['medicaments']:
                    if y < 80:
                        p.showPage()
                        y = height - 50
                    p.setFont("Helvetica", 8)
                    med_name = med.nom[:30] if len(med.nom) > 30 else med.nom
                    p.drawString(80, y, f"- {med_name} ({med.dosage})")
                    y -= 12
            else:
                y -= 20
            
            y -= 35
        
        # Pied de page
        p.setFont("Helvetica-Bold", 8)
        p.drawCentredString(width/2, 30, f"Document genere par MedPredict le {timezone.now().strftime('%d/%m/%Y a %H:%M')}")
        
        p.showPage()
        p.save()
        
        return True

    # =========================================================================
    # ✅ NOUVELLES ROUTES AJOUTÉES POUR LE DASHBOARD SECRÉTAIRE
    # =========================================================================
    
    @action(detail=False, methods=['get'], url_path='liste-complete')
    def liste_complete(self, request):
        """Retourne une liste combinée des Dossiers Officiels et des Brouillons"""
        patients = Patient.objects.all().order_by('-created_at')
        drafts = PatientDraft.objects.filter(status='ACTIF').order_by('-created_at')
        
        data = []
        for p in patients:
            data.append({
                'id': p.id, 'is_draft': False, 'nom': p.nom, 'prenom': p.prenom,
                'genre': p.genre, 'dateNaissance': p.dateNaissance, 'telephone': p.telephone,
                'groupeSanguin': p.groupeSanguin, 'cin': p.cin
            })
        for d in drafts:
            data.append({
                'id': d.id, 'is_draft': True, 'nom': d.nom, 'prenom': d.prenom,
                'genre': d.genre, 'dateNaissance': d.dateNaissance, 'telephone': d.telephone,
                'groupeSanguin': d.groupeSanguin, 'cin': d.cin
            })
        return Response(data)

    @action(detail=False, methods=['post'], url_path='creer-brouillon')
    def creer_brouillon(self, request):
        """La secrétaire crée un patient (Draft) directement"""
        data = request.data
        
        # 1. Créer un utilisateur fantôme (obligatoire pour le système)
        username = f"pat_{uuid.uuid4().hex[:8]}"
        user = User.objects.create_user(username=username, role='PATIENT', email_verified=False)
        user.first_name = data.get('prenom', '')
        user.last_name = data.get('nom', '')
        user.save()

        # 2. Créer le Draft
        draft = PatientDraft.objects.create(
            user=user,
            nom=data.get('nom'),
            prenom=data.get('prenom'),
            telephone=data.get('telephone'),
            cin=data.get('cin', ''),
            dateNaissance=data.get('dateNaissance') or None,
            genre=data.get('genre', 'M'),
            groupeSanguin=data.get('groupeSanguin', ''),
            status='ACTIF'
        )
        return Response({'success': True})

    @action(detail=False, methods=['patch'], url_path='modifier-patient')
    def modifier_patient(self, request):
        """Modifie les informations de base d'un patient (Draft ou Officiel)"""
        data = request.data
        patient_id = data.get('id')
        is_draft = data.get('is_draft')
        
        fields_to_update = ['nom', 'prenom', 'telephone', 'cin', 'dateNaissance', 'genre', 'groupeSanguin']
        
        try:
            if is_draft:
                obj = PatientDraft.objects.get(id=patient_id)
            else:
                obj = Patient.objects.get(id=patient_id)
                
            for field in fields_to_update:
                if field in data:
                    val = data[field]
                    setattr(obj, field, val if val else None)  # Gère les dates vides
            obj.save()
            return Response({'success': True})
        except Exception as e:
            return Response({'error': str(e)}, status=400)