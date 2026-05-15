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

    @action(detail=False, methods=['get'], url_path='me/download-dossier')
    def download_pdf(self, request):
        """Génère et télécharge le dossier médical en PDF."""
        try:
            patient = Patient.objects.get(user=request.user)
            
            # Récupération des consultations
            from apps.consultations.models import Consultation
            from apps.appointments.models import RendezVous
            from apps.prescriptions.models import Ordonnance, Medicament
            import qrcode
            from PIL import Image
            import tempfile
            from reportlab.lib.utils import ImageReader
            from reportlab.lib.colors import HexColor
            from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
            from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
            from reportlab.lib import colors
            from reportlab.lib.units import mm
            
            rdv_ids = RendezVous.objects.filter(patient=patient).values_list('id', flat=True)
            consultations = Consultation.objects.filter(rendezvous__in=rdv_ids).order_by('-date_consultation')
            
            # Récupération des ordonnances par consultation
            ordonnances_data = {}
            for consultation in consultations:
                try:
                    ordonnance = Ordonnance.objects.get(consultation=consultation)
                    medicaments = Medicament.objects.filter(ordonnance=ordonnance)
                    ordonnances_data[consultation.id] = {
                        'ordonnance': ordonnance,
                        'medicaments': medicaments
                    }
                except Ordonnance.DoesNotExist:
                    ordonnances_data[consultation.id] = None
                    
        except Patient.DoesNotExist:
            return Response({'error': 'Profil non trouvé'}, status=404)

        # Création du buffer et du document
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4, 
                               rightMargin=50, leftMargin=50,
                               topMargin=50, bottomMargin=50)
        
        # Styles personnalisés
        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=24,
            textColor=HexColor('#1e40af'),  # Bleu foncé
            alignment=1,  # Centré
            spaceAfter=30,
            fontName='Helvetica-Bold'
        )
        
        header_style = ParagraphStyle(
            'HeaderStyle',
            parent=styles['Heading2'],
            fontSize=14,
            textColor=HexColor('#1e3a8a'),
            spaceAfter=12,
            spaceBefore=20,
            fontName='Helvetica-Bold'
        )
        
        subheader_style = ParagraphStyle(
            'SubheaderStyle',
            parent=styles['Heading3'],
            fontSize=12,
            textColor=HexColor('#374151'),
            spaceAfter=8,
            spaceBefore=10,
            fontName='Helvetica-Bold'
        )
        
        normal_style = ParagraphStyle(
            'NormalStyle',
            parent=styles['Normal'],
            fontSize=10,
            textColor=HexColor('#1f2937'),
            leading=14,
            fontName='Helvetica'
        )
        
        info_style = ParagraphStyle(
            'InfoStyle',
            parent=styles['Normal'],
            fontSize=11,
            textColor=HexColor('#111827'),
            leading=16,
            fontName='Helvetica-Bold'
        )
        
        # Liste des éléments du document
        story = []
        
        # ==================== 1. EN-TÊTE AVEC LOGO ====================
        from reportlab.platypus import Table, TableStyle
        
        # Essayer de charger un logo (si le fichier existe)
        logo_paths = [
            '/app/static/logo.png',
            '/app/media/logo.png',
            'static/logo.png',
            'media/logo.png'
        ]
        
        logo_elem = None
        import os
        for path in logo_paths:
            if os.path.exists(path):
                try:
                    from reportlab.lib.utils import ImageReader
                    img = ImageReader(path)
                    logo_elem = img
                    break
                except:
                    pass
        
        if logo_elem:
            from reportlab.platypus import Image
            logo = Image(logo_elem, width=60, height=60)
            header_data = [
                [logo, Paragraph("<b><font color='#1e40af' size=24>DOSSIER MÉDICAL NUMÉRIQUE</font></b>", title_style)]
            ]
            header_table = Table(header_data, colWidths=[80, 420])
            header_table.setStyle(TableStyle([
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                ('ALIGN', (1, 0), (1, 0), 'CENTER'),
            ]))
            story.append(header_table)
        else:
            story.append(Paragraph("<b><font color='#1e40af' size=24>DOSSIER MÉDICAL NUMÉRIQUE</font></b>", title_style))
        
        story.append(Spacer(1, 20))
        
        # ==================== 2. LIGNE DE SÉPARATION ====================
        from reportlab.platypus import HRFlowable
        story.append(HRFlowable(width="100%", thickness=1, color=HexColor('#1e40af'), spaceAfter=15))
        
        # ==================== 3. IDENTITÉ DU PATIENT (Tableau) ====================
        story.append(Paragraph("IDENTITÉ DU PATIENT", header_style))
        
        # Tableau des informations patient
        patient_data_table = [
            ["Nom complet:", f"{patient.nom_complet}"],
            ["CIN:", patient.cin or "N/A"],
            ["Date de naissance:", patient.dateNaissance.strftime('%d/%m/%Y') if patient.dateNaissance else "N/A"],
            ["Âge:", f"{self.calculer_age(patient.dateNaissance)} ans" if patient.dateNaissance else "N/A"],
            ["Genre:", patient.get_genre_display() if hasattr(patient, 'get_genre_display') else (patient.genre or "N/A")],
            ["Téléphone:", patient.telephone or "N/A"],
            ["Groupe sanguin:", patient.groupeSanguin or "N/A"],
            ["Adresse:", patient.adresse or "N/A"],
        ]
        
        patient_table = Table(patient_data_table, colWidths=[120, 400])
        patient_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), HexColor('#f3f4f6')),
            ('TEXTCOLOR', (0, 0), (0, -1), HexColor('#1e40af')),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('GRID', (0, 0), (-1, -1), 0.5, HexColor('#e5e7eb')),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ]))
        story.append(patient_table)
        story.append(Spacer(1, 15))
        story.append(HRFlowable(width="100%", thickness=0.5, color=HexColor('#d1d5db'), spaceAfter=10))
        
        # ==================== 4. INFORMATIONS MÉDICALES DE BASE ====================
        story.append(Paragraph("INFORMATIONS MÉDICALES", header_style))
        
        medical_data = [
            ["Allergies:", patient.allergies or "Aucune allergie connue"],
            ["Antécédents:", patient.antecedents or "Aucun antécédent connu"],
        ]
        
        medical_table = Table(medical_data, colWidths=[120, 400])
        medical_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), HexColor('#fef3c7')),
            ('TEXTCOLOR', (0, 0), (0, -1), HexColor('#b45309')),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ]))
        story.append(medical_table)
        story.append(Spacer(1, 20))
        story.append(HRFlowable(width="100%", thickness=0.5, color=HexColor('#d1d5db'), spaceAfter=10))
        
        # ==================== 5. QR CODE POUR SUIVI PATIENT ====================
        story.append(Paragraph("CODE DE SUIVI", header_style))
        
        # Génération du QR Code
        try:
            # Données à encoder dans le QR code
            qr_data = f"Patient ID: {patient.id}\nNom: {patient.nom_complet}\nCIN: {patient.cin or 'N/A'}"
            
            qr = qrcode.QRCode(version=1, box_size=10, border=1)
            qr.add_data(qr_data)
            qr.make(fit=True)
            qr_img = qr.make_image(fill_color="#1e40af", back_color="white")
            
            # Sauvegarde temporaire du QR code
            with tempfile.NamedTemporaryFile(suffix='.png', delete=False) as tmpfile:
                qr_img.save(tmpfile.name)
                tmpfile_path = tmpfile.name
            
            from reportlab.lib.utils import ImageReader
            qr_reader = ImageReader(tmpfile_path)
            
            from reportlab.platypus import Image
            qr_elem = Image(qr_reader, width=80, height=80)
            
            # Tableau pour QR code + texte explicatif
            qr_table_data = [
                [qr_elem, Paragraph("Scannez ce code QR pour accéder rapidement à votre dossier médical sur l'application MedPredict", normal_style)]
            ]
            qr_table = Table(qr_table_data, colWidths=[100, 400])
            qr_table.setStyle(TableStyle([
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                ('TOPPADDING', (0, 0), (-1, -1), 5),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
            ]))
            story.append(qr_table)
            
            # Nettoyage
            os.unlink(tmpfile_path)
            
        except Exception as e:
            story.append(Paragraph("QR Code non disponible", normal_style))
            print(f"Erreur génération QR code: {e}")
        
        story.append(Spacer(1, 20))
        story.append(HRFlowable(width="100%", thickness=0.5, color=HexColor('#d1d5db'), spaceAfter=10))
        
        # ==================== 6. HISTORIQUE DES CONSULTATIONS ====================
        story.append(Paragraph("HISTORIQUE DES CONSULTATIONS", header_style))
        
        if consultations.exists():
            for consultation in consultations:
                date_str = consultation.date_consultation.strftime('%d/%m/%Y à %H:%M')
                
                # En-tête de consultation (style carte)
                story.append(Paragraph(f"▸ Consultation du {date_str}", subheader_style))
                
                # Détails de la consultation en tableau
                consult_details = [
                    ["Symptômes:", consultation.symptomes[:200] + "..." if len(consultation.symptomes) > 200 else consultation.symptomes],
                    ["Diagnostic:", consultation.diagnostic or "Non spécifié"],
                    ["Notes:", consultation.notes or "Aucune note"],
                ]
                
                consult_table = Table(consult_details, colWidths=[80, 410])
                consult_table.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (0, -1), HexColor('#e0f2fe')),
                    ('TEXTCOLOR', (0, 0), (0, -1), HexColor('#0369a1')),
                    ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
                    ('FONTSIZE', (0, 0), (-1, -1), 9),
                    ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                    ('TOPPADDING', (0, 0), (-1, -1), 4),
                    ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
                ]))
                story.append(consult_table)
                
                # ==================== 7. ORDONNANCES ====================
                if ordonnances_data.get(consultation.id):
                    ord_data = ordonnances_data[consultation.id]
                    story.append(Paragraph("   └ Ordonnance prescrite :", normal_style))
                    
                    # Tableau des médicaments
                    med_data = [["Médicament", "Dosage", "Posologie"]]
                    for med in ord_data['medicaments']:
                        med_data.append([
                            med.nom,
                            med.dosage,
                            med.posologie[:50] + "..." if len(med.posologie) > 50 else med.posologie
                        ])
                    
                    med_table = Table(med_data, colWidths=[150, 100, 240])
                    med_table.setStyle(TableStyle([
                        ('BACKGROUND', (0, 0), (-1, 0), HexColor('#065f46')),
                        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                        ('FONTSIZE', (0, 0), (-1, -1), 8),
                        ('GRID', (0, 0), (-1, -1), 0.5, HexColor('#d1d5db')),
                        ('TOPPADDING', (0, 0), (-1, -1), 5),
                        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
                    ]))
                    story.append(med_table)
                else:
                    story.append(Paragraph("   └ Aucune ordonnance prescrite", normal_style))
                
                story.append(Spacer(1, 10))
        else:
            story.append(Paragraph("Aucune consultation enregistrée", normal_style))
        
        # ==================== 8. STATISTIQUES RÉCAPITULATIVES ====================
        story.append(Spacer(1, 20))
        story.append(HRFlowable(width="100%", thickness=0.5, color=HexColor('#d1d5db'), spaceAfter=10))
        story.append(Paragraph("RÉCAPITULATIF", header_style))
        
        total_consultations = consultations.count()
        total_rdv = RendezVous.objects.filter(patient=patient).count()
        total_ordonnances = sum(1 for v in ordonnances_data.values() if v is not None)
        
        recap_data = [
            ["Nombre total de consultations:", str(total_consultations)],
            ["Nombre total de rendez-vous:", str(total_rdv)],
            ["Nombre total d'ordonnances:", str(total_ordonnances)],
            ["Date de création du dossier:", patient.created_at.strftime('%d/%m/%Y') if patient.created_at else "N/A"],
        ]
        
        recap_table = Table(recap_data, colWidths=[200, 300])
        recap_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), HexColor('#f0fdf4')),
            ('TEXTCOLOR', (0, 0), (0, -1), HexColor('#166534')),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('TOPPADDING', (0, 0), (-1, -1), 5),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ]))
        story.append(recap_table)
        
        # ==================== 9. PIED DE PAGE ====================
        story.append(Spacer(1, 30))
        story.append(HRFlowable(width="100%", thickness=1, color=HexColor('#1e40af'), spaceAfter=10))
        
        footer_text = Paragraph(
            "<font size=8 color='#6b7280'><i>Document généré par MedPredict - Système de Gestion Médicale Intelligente<br/>"
            "Date de génération: {} - Ce document est confidentiel et protégé</i></font>".format(
                timezone.now().strftime('%d/%m/%Y à %H:%M:%S')
            ),
            normal_style
        )
        story.append(footer_text)
        
        # ==================== GESTION DES SAUTS DE PAGE ====================
        # La gestion des sauts de page est automatique avec SimpleDocTemplate
        # On construit le document
        try:
            doc.build(story)
        except Exception as e:
            # Fallback en cas d'erreur avec SimpleDocTemplate
            print(f"Erreur avec SimpleDocTemplate: {e}")
            # Reconstruction avec la méthode canvas originale (plus simple)
            return self._generate_simple_pdf(patient, consultations, ordonnances_data, buffer)
        
        buffer.seek(0)
        filename = f"Dossier_Medical_{patient.nom}_{patient.prenom}_{timezone.now().strftime('%Y%m%d')}.pdf"
        return HttpResponse(
            buffer, 
            content_type='application/pdf', 
            headers={'Content-Disposition': f'attachment; filename="{filename}"'}
        )

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
            
            # Sauvegarde temporaire
            with tempfile.NamedTemporaryFile(suffix='.png', delete=False) as tmpfile:
                qr_img.save(tmpfile.name, 'PNG')
                tmpfile_path = tmpfile.name
            
            # Vérifier que le fichier existe et a une taille valide
            if os.path.exists(tmpfile_path) and os.path.getsize(tmpfile_path) > 0:
                p.drawImage(tmpfile_path, width - 90, height - 100, width=60, height=60)
                p.setFont("Helvetica", 6)
                p.drawString(width - 85, height - 115, "Scanner le QR")
                qr_placed = True
            
            # Nettoyage
            os.unlink(tmpfile_path)
            
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