#!/usr/bin/env python
"""
Script pour ajouter des patients de test pour le 24/06/2026
- Conserve les anciens patients intacts
- Ajoute des patients officiels avec dossiers complets (consultations + ordonnances)
- Ajoute des patients "drafts" (en attente) avec dossiers complets
- Crée des rendez-vous en mode EN_ATTENTE pour validation par la secrétaire
"""

import os
import sys
import django
from datetime import datetime, date, time

# Configuration Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
sys.path.insert(0, '/app')
django.setup()

from django.contrib.auth import get_user_model
from apps.patients.models import Patient
from apps.appointments.models import RendezVous
from apps.consultations.models import Consultation
from apps.prescriptions.models import Ordonnance, Medicament

User = get_user_model()

NEW_PATIENTS_DATA = [
    # ===== PATIENTS OFFICIELS (avec compte utilisateur existant) =====
    {
        "user": {"username": "nadia_benali", "email": "n.benali@email.com"},
        "profile": {
            "nom": "Benali", "prenom": "Nadia", "genre": "F",
            "dateNaissance": "1985-03-15", "telephone": "0612345678",
            "cin": "NB456789", "adresse": "15 Rue des Lilas, Casablanca",
            "groupeSanguin": "A-", "allergies": "Aucune",
            "antecedents": "Hypertension artérielle traitée depuis 2019."
        },
        "past_consultation": {
            "date": "2026-05-25", "heure": "09:00", "motif": "Contrôle tensionnel annuel",
            "symptomes": "Tension artérielle à 142/88 au dernier contrôle. Légers maux de tête occasionnels.",
            "diagnostic": "Hypertension artérielle légère non contrôlée.",
            "notes": "Adaptation du traitement antihypertenseur. Recommandation d'activité physique régulière.",
            "ordonnance": [
                {"nom": "Lisinopril 10mg", "dosage": "10mg", "posologie": "1 comprimé par jour le matin"},
                {"nom": "Amlodipine 5mg", "dosage": "5mg", "posologie": "1 comprimé le soir"}
            ]
        },
        "future_appointment": {
            "date": "2026-06-24", "heure": "09:00", "motif": "Contrôle tensionnel post-adaptation du traitement",
            "type": "PRESENTIEL", "statut": "EN_ATTENTE"
        }
    },
    {
        "user": {"username": "sarah_elalami", "email": "s.elalami@email.com"},
        "profile": {
            "nom": "El Alami", "prenom": "Sarah", "genre": "F",
            "dateNaissance": "1992-07-22", "telephone": "0634567890",
            "cin": "SE789012", "adresse": "8 Rue des Oliviers, Rabat",
            "groupeSanguin": "B+", "allergies": "Pénicilline",
            "antecedents": "Migraines cataméniales depuis l'adolescence."
        },
        "past_consultation": {
            "date": "2026-04-15", "heure": "15:30", "motif": "Migraines persistantes et troubles du sommeil",
            "symptomes": "Migraines sévères durant la période menstruelle, insomnie modérée, photophobie.",
            "diagnostic": "Migraines cataméniales avec troubles du sommeil associés.",
            "notes": "Mise en place d'un protocole préventif. Évaluation des facteurs déclenchants.",
            "ordonnance": [
                {"nom": "Propranolol 40mg", "dosage": "40mg", "posologie": "1 comprimé matin et soir"},
                {"nom": "Ibuprofène 400mg", "dosage": "400mg", "posologie": "1 comprimé en cas de crise, max 3/jour"},
                {"nom": "Zolpidem 10mg", "dosage": "10mg", "posologie": "1 comprimé le soir en cas d'insomnie sévère"}
            ]
        },
        "future_appointment": {
            "date": "2026-06-24", "heure": "15:30", "motif": "Suivi de l'efficacité du protocole anti-migraineux",
            "type": "PRESENTIEL", "statut": "EN_ATTENTE"
        }
    },

    # ===== PATIENTS DRAFTS (en attente de validation) =====
    {
        "user": {"username": "mounir_elghazi", "email": "m.elghazi@email.com"},
        "profile": {
            "nom": "El Ghazi", "prenom": "Mounir", "genre": "M",
            "dateNaissance": "1978-11-05", "telephone": "0645678901",
            "cin": "ME901234", "adresse": "32 Avenue Mohammed V, Casablanca",
            "groupeSanguin": "O-", "allergies": "Sulfamides",
            "antecedents": "Diabète de type 2 diagnostiqué en 2020, obésité modérée."
        },
        "past_consultation": {
            "date": "2026-06-10", "heure": "10:00", "motif": "Suivi diabétologique mensuel",
            "symptomes": "Légère hyperglycémie à jeun (1.35g/L). Soif excessive et polyurie légère.",
            "diagnostic": "Déséquilibre glycémique modéré nécessitant une adaptation thérapeutique.",
            "notes": "Non-conformité partielle au régime alimentaire. Renforcement des conseils diététiques.",
            "ordonnance": [
                {"nom": "Metformine 850mg", "dosage": "850mg", "posologie": "1 comprimé matin et midi"},
                {"nom": "Glibenclamide 5mg", "dosage": "5mg", "posologie": "1 comprimé le matin"}
            ]
        },
        "future_appointment": {
            "date": "2026-06-24", "heure": "10:00", "motif": "Contrôle glycémique complet et ajustement du traitement",
            "type": "PRESENTIEL", "statut": "EN_ATTENTE"
        }
    },
    {
        "user": {"username": "leila_tazi", "email": "l.tazi@email.com"},
        "profile": {
            "nom": "Tazi", "prenom": "Leila", "genre": "F",
            "dateNaissance": "1998-09-18", "telephone": "0656789012",
            "cin": "LT123456", "adresse": "45 Rue de la Liberté, Rabat",
            "groupeSanguin": "AB-", "allergies": "Aucune",
            "antecedents": "Candidoses vaginales récidivantes. Pas d'antécédents chirurgicaux."
        },
        "past_consultation": {
            "date": "2026-06-05", "heure": "11:30", "motif": "Prélèvements gynécologiques annuels",
            "symptomes": "Pas de symptômes particuliers. Frottis de routine.",
            "diagnostic": "Frottis normal. Cependant, flore légèrement déséquilibrée.",
            "notes": "Recommandation de probiotiques et d'une hygiène adaptée.",
            "ordonnance": [
                {"nom": "Gynophilus", "dosage": "Comprimés vaginaux", "posologie": "1 ovule par jour pendant 10 jours"},
                {"nom": "Débridat 100mg", "dosage": "100mg", "posologie": "1 comprimé 3 fois par jour"}
            ]
        },
        "future_appointment": {
            "date": "2026-06-24", "heure": "11:30", "motif": "Contrôle post-traitement des candidoses récidivantes",
            "type": "PRESENTIEL", "statut": "EN_ATTENTE"
        }
    },
    {
        "user": {"username": "karim_skalli", "email": "k.skalli@email.com"},
        "profile": {
            "nom": "Skalli", "prenom": "Karim", "genre": "M",
            "dateNaissance": "1982-12-30", "telephone": "0667890123",
            "cin": "KS567890", "adresse": "7 Rue d'Ifrane, Casablanca",
            "groupeSanguin": "A+", "allergies": "Aucune",
            "antecedents": "Gastrite chronique, ulcère bulbaire traité en 2021."
        },
        "past_consultation": {
            "date": "2026-06-01", "heure": "16:00", "motif": "Douleurs épigastriques post-prandiales",
            "symptomes": "Douleurs brûlures épigastriques apparaissant 2h après les repas, légères nausées.",
            "diagnostic": "Récidive de gastrite chronique probable, à confirmer par endoscopie.",
            "notes": "Arrêt des AINS. Mise en place d'un traitement protecteur gastrique.",
            "ordonnance": [
                {"nom": "Inexium 40mg", "dosage": "40mg", "posologie": "1 comprimé le matin à jeun"},
                {"nom": "Gaviscon 500mg", "dosage": "500mg", "posologie": "2 comprimés après chaque repas et le soir"}
            ]
        },
        "future_appointment": {
            "date": "2026-06-24", "heure": "16:00", "motif": "Résultats de l'endoscopie et bilan après 3 semaines de traitement",
            "type": "PRESENTIEL", "statut": "EN_ATTENTE"
        }
    },
    {
        "user": {"username": "amina_elhankouri", "email": "a.elhankouri@email.com"},
        "profile": {
            "nom": "El Hankouri", "prenom": "Amina", "genre": "F",
            "dateNaissance": "2000-01-10", "telephone": "0678901234",
            "cin": "AE901234", "adresse": "19 Rue des Jardins, Rabat",
            "groupeSanguin": "B-", "allergies": "Pénicilline",
            "antecedents": "Allergie aux acariens, asthme allergique léger."
        },
        "past_consultation": {
            "date": "2026-05-15", "heure": "14:00", "motif": "Crise d'asthme et allergie saisonnière",
            "symptomes": "Toux sèche, sifflements bronchiques, rhinorrhée, yeux qui piquent.",
            "diagnostic": "Exacerbation asthmatique modérée sur allergie aux pollens.",
            "notes": "Mise en place d'un traitement inhalé. Conseils d'éviction des allergènes.",
            "ordonnance": [
                {"nom": "Symbicort 160/4.5µg", "dosage": "160/4.5µg", "posologie": "2 inhalations matin et soir"},
                {"nom": "Zyrtec 10mg", "dosage": "10mg", "posologie": "1 comprimé par jour"},
                {"nom": "Bricanyl 0.5mg", "dosage": "0.5mg", "posologie": "2 bouffées en cas de crise"}
            ]
        },
        "future_appointment": {
            "date": "2026-06-24", "heure": "14:00", "motif": "Contrôle respiratoire et évaluation du traitement anti-allergique",
            "type": "PRESENTIEL", "statut": "EN_ATTENTE"
        }
    }
]

def seed_new_patients():
    print("\n" + "="*70)
    print("🚀 MEDPREDICT - INJECTION DE PATIENTS (OFFICIELS + DRAFTS) POUR LE 24/06/2026")
    print("="*70 + "\n")

    # Récupérer le médecin par défaut (dr_test ou le premier médecin trouvé)
    medecin = User.objects.filter(role='MEDECIN').first()
    if not medecin:
        print("❌ Erreur : Aucun médecin trouvé dans la base de données. Veuillez d'abord initialiser la base avec seed_data.py.")
        return

    print(f"👨‍⚕️ Médecin référent pour les rendez-vous : {medecin.username} (ID: {medecin.id})")
    print(f"📅 Date des rendez-vous : 24/06/2026 - Tous en statut EN_ATTENTE")
    print(f"👥 Nombre de patients à injecter : {len(NEW_PATIENTS_DATA)} (officiels + drafts)\n")

    patients_inserted = 0
    rdv_inserted = 0
    official_count = 0
    draft_count = 0

    for index, item in enumerate(NEW_PATIENTS_DATA):
        u_data = item["user"]
        p_data = item["profile"]
        past_c = item["past_consultation"]
        fut_a = item["future_appointment"]
        
        # Déterminer si c'est un patient officiel ou draft (basé sur les 2 premiers ou une condition)
        is_official = index < 2  # Les 2 premiers sont officiels
        patient_type = "OFFICIEL" if is_official else "DRAFT"

        print(f"\n--- Patient #{index+1} : {patient_type} ---")

        # 1. Création ou récupération du User
        user, created_user = User.objects.get_or_create(
            username=u_data["username"],
            defaults={
                "email": u_data["email"],
                "role": "PATIENT",
                "first_name": p_data["prenom"],
                "last_name": p_data["nom"],
                "email_verified": True
            }
        )
        if created_user:
            user.set_password("password123")
            user.save()
            print(f"   👤 Utilisateur créé : {user.username}")
        else:
            print(f"   ℹ️ Utilisateur existant : {user.username}")

        # 2. Création ou récupération du Patient
        patient, created_patient = Patient.objects.get_or_create(
            cin=p_data["cin"],
            defaults={
                "user": user,
                "nom": p_data["nom"],
                "prenom": p_data["prenom"],
                "genre": p_data["genre"],
                "dateNaissance": p_data["dateNaissance"],
                "telephone": p_data["telephone"],
                "adresse": p_data["adresse"],
                "groupeSanguin": p_data.get("groupeSanguin"),
                "allergies": p_data.get("allergies"),
                "antecedents": p_data.get("antecedents")
            }
        )
        if created_patient:
            patients_inserted += 1
            if is_official:
                official_count += 1
            else:
                draft_count += 1
            print(f"      ✅ Profil Patient créé : {patient.nom_complet} (CIN: {patient.cin}) - {patient_type}")
        else:
            # Associer au user existant si non associé
            if not patient.user:
                patient.user = user
                patient.save()
            print(f"      ℹ️ Profil Patient existant : {patient.nom_complet}")

        # 3. Création de la consultation passée (uniquement si pas déjà présente pour éviter les doublons)
        past_rdv_exists = RendezVous.objects.filter(
            user=user,
            date=past_c["date"],
            heure=past_c["heure"]
        ).exists()

        if not past_rdv_exists:
            rdv_past = RendezVous.objects.create(
                user=user,
                patient=patient,
                medecin=medecin,
                date=past_c["date"],
                heure=past_c["heure"],
                statut="TERMINE",
                motif=past_c["motif"],
                type="PRESENTIEL"
            )
            
            consultation = Consultation.objects.create(
                rendezvous=rdv_past,
                symptomes=past_c["symptomes"],
                diagnostic=past_c.get("diagnostic", ""),
                notes=past_c.get("notes", "")
            )

            if past_c.get("ordonnance"):
                ordonnance = Ordonnance.objects.create(consultation=consultation)
                for med in past_c["ordonnance"]:
                    Medicament.objects.create(
                        ordonnance=ordonnance,
                        nom=med["nom"],
                        dosage=med["dosage"],
                        posologie=med["posologie"]
                    )
            print(f"      📋 Dossier médical : Consultation passée créée pour le {past_c['date']}")
        else:
            print(f"      ℹ️ Dossier médical : Consultation du {past_c['date']} déjà existante")

        # 4. Création du rendez-vous futur (uniquement si pas déjà présent)
        future_rdv_exists = RendezVous.objects.filter(
            user=user,
            date=fut_a["date"],
            heure=fut_a["heure"]
        ).exists()

        if not future_rdv_exists:
            RendezVous.objects.create(
                user=user,
                patient=patient,
                medecin=medecin,
                date=fut_a["date"],
                heure=fut_a["heure"],
                statut=fut_a["statut"],  # EN_ATTENTE pour tous
                motif=fut_a["motif"],
                type=fut_a["type"]
            )
            rdv_inserted += 1
            print(f"      📅 RDV Futur créé : Le {fut_a['date']} à {fut_a['heure']} ({fut_a['statut']}) - {patient_type}")
        else:
            print(f"      ℹ️ RDV Futur du {fut_a['date']} à {fut_a['heure']} déjà existant")

    print("\n" + "="*70)
    print("📊 BILAN DE L'INJECTION")
    print("="*70)
    print(f"   👥 Nouveaux profils Patients injectés : {patients_inserted}")
    print(f"      - Patients Officiels : {official_count}")
    print(f"      - Patients Drafts    : {draft_count}")
    print(f"   📅 Nouveaux Rendez-vous futurs injectés : {rdv_inserted} (tous en ATTENTE)")
    print(f"   📈 Total Patients officiels en base : {Patient.objects.count()}")
    print(f"   📈 Total Rendez-vous en base : {RendezVous.objects.count()}")
    print(f"   📈 Total Rendez-vous en attente : {RendezVous.objects.filter(statut='EN_ATTENTE').count()}")
    print("="*70)
    print("\n💡 Note : Les rendez-vous sont tous en mode EN_ATTENTE.")
    print("         La secrétaire doit les accepter manuellement depuis l'interface.\n")

if __name__ == "__main__":
    seed_new_patients()