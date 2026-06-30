#!/usr/bin/env python
"""
Script pour ajouter des patients de test pour les 25 et 26 juin 2026
- Ajoute des patients avec dossiers médicaux complets
- Crée des rendez-vous pour le 25 et 26 juin 2026
- Tous les rendez-vous en mode EN_ATTENTE pour validation par la secrétaire
- Conserve les données existantes
"""

import os
import sys
import django
from datetime import datetime, date, time, timedelta

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
    # ===== PATIENTS POUR LE 25 JUIN 2026 =====
    {
        "user": {"username": "rachid_benomar", "email": "r.benomar@email.com"},
        "profile": {
            "nom": "Benomar", "prenom": "Rachid", "genre": "M",
            "dateNaissance": "1975-06-20", "telephone": "0611111111",
            "cin": "RB111111", "adresse": "25 Rue des Orangers, Casablanca",
            "groupeSanguin": "A+", "allergies": "Aucune",
            "antecedents": "Diabète de type 2, hypercholestérolémie familiale."
        },
        "past_consultation": {
            "date": "2026-06-10", "heure": "08:30", "motif": "Contrôle diabète et bilan lipidique mensuel",
            "symptomes": "Glycémie à jeun à 1.48g/L, cholestérol total à 2.8g/L. Pas de symptômes particuliers.",
            "diagnostic": "Déséquilibre diabétique et dyslipidémie mixte.",
            "notes": "Non-observance du régime alimentaire. Reprise en charge éducative.",
            "ordonnance": [
                {"nom": "Metformine 1000mg", "dosage": "1000mg", "posologie": "1 comprimé matin et soir"},
                {"nom": "Atorvastatine 20mg", "dosage": "20mg", "posologie": "1 comprimé le soir"},
                {"nom": "Gliclazide 30mg", "dosage": "30mg", "posologie": "1 comprimé le matin"}
            ]
        },
        "future_appointment": {
            "date": "2026-06-25", "heure": "08:30", "motif": "Contrôle glycémique et lipidique post-adaptation",
            "type": "PRESENTIEL", "statut": "EN_ATTENTE"
        }
    },
    {
        "user": {"username": "samira_elgazoui", "email": "s.elgazoui@email.com"},
        "profile": {
            "nom": "El Gazoui", "prenom": "Samira", "genre": "F",
            "dateNaissance": "1982-09-08", "telephone": "0622222222",
            "cin": "SE222222", "adresse": "8 Rue des Roses, Rabat",
            "groupeSanguin": "O-", "allergies": "Aucune",
            "antecedents": "Hypothyroïdie sous Lévothyrox depuis 2015. Dépression légère."
        },
        "past_consultation": {
            "date": "2026-06-12", "heure": "10:00", "motif": "Bilan thyroïdien semestriel",
            "symptomes": "Fatigue persistante, prise de poids de 3kg en 6 mois, frilosité.",
            "diagnostic": "Hypothyroïdie périphérique modérée. TSH à 5.8 µUI/ml.",
            "notes": "Augmentation de la dose de Lévothyrox. Surveillance dans 6 semaines.",
            "ordonnance": [
                {"nom": "Lévothyrox 100µg", "dosage": "100µg", "posologie": "1 comprimé le matin à jeun"},
                {"nom": "Vitamine D 100 000 UI", "dosage": "100 000 UI", "posologie": "1 ampoule par mois"}
            ]
        },
        "future_appointment": {
            "date": "2026-06-25", "heure": "10:00", "motif": "Contrôle TSH et adaptation du Lévothyrox",
            "type": "PRESENTIEL", "statut": "EN_ATTENTE"
        }
    },
    {
        "user": {"username": "hassan_chtouki", "email": "h.chtouki@email.com"},
        "profile": {
            "nom": "Chtouki", "prenom": "Hassan", "genre": "M",
            "dateNaissance": "1990-12-01", "telephone": "0633333333",
            "cin": "HC333333", "adresse": "42 Rue de la Médina, Fès",
            "groupeSanguin": "B+", "allergies": "Arachides",
            "antecedents": "Syndrome de l'intestin irritable (SII) depuis 2020. Allergie alimentaire."
        },
        "past_consultation": {
            "date": "2026-06-05", "heure": "14:00", "motif": "Crises de SII récidivantes",
            "symptomes": "Douleurs abdominales, ballonnements, alternance diarrhée/constipation.",
            "diagnostic": "Poussée de SII en contexte de stress professionnel.",
            "notes": "Mise en place d'un régime FODMAP restrictif. Prescription de probiotiques.",
            "ordonnance": [
                {"nom": "Spasfon 80mg", "dosage": "80mg", "posologie": "2 comprimés 3 fois par jour"},
                {"nom": "Lactibiane 10M", "dosage": "10M UI", "posologie": "1 gélule le matin"},
                {"nom": "Smecta", "dosage": "3g", "posologie": "1 sachet après chaque repas"}
            ]
        },
        "future_appointment": {
            "date": "2026-06-25", "heure": "14:00", "motif": "Évaluation de l'efficacité du régime et du traitement SII",
            "type": "PRESENTIEL", "statut": "EN_ATTENTE"
        }
    },
    {
        "user": {"username": "lamia_hassani", "email": "l.hassani@email.com"},
        "profile": {
            "nom": "Hassani", "prenom": "Lamia", "genre": "F",
            "dateNaissance": "1995-03-28", "telephone": "0644444444",
            "cin": "LH444444", "adresse": "15 Rue des Palmiers, Marrakech",
            "groupeSanguin": "AB+", "allergies": "Lactose",
            "antecedents": "Intolérance au lactose, migraines avec aura, anxiété généralisée."
        },
        "past_consultation": {
            "date": "2026-06-01", "heure": "16:30", "motif": "Migraines sévères et troubles anxieux",
            "symptomes": "Migraines pulsatiles unilatérales avec aura visuelle. Anxiété sociale majeure.",
            "diagnostic": "Migraine avec aura sur fond d'anxiété généralisée.",
            "notes": "Bilan neurologique normal. Orientation vers une thérapie cognitivo-comportementale.",
            "ordonnance": [
                {"nom": "Sumatriptan 50mg", "dosage": "50mg", "posologie": "1 comprimé en début de crise"},
                {"nom": "Bromazépam 6mg", "dosage": "6mg", "posologie": "1 comprimé le soir si besoin"},
                {"nom": "Magnésium 300mg", "dosage": "300mg", "posologie": "1 comprimé le matin"}
            ]
        },
        "future_appointment": {
            "date": "2026-06-25", "heure": "16:30", "motif": "Suivi neurologique et psychiatrique",
            "type": "PRESENTIEL", "statut": "EN_ATTENTE"
        }
    },
    
    # ===== PATIENTS POUR LE 26 JUIN 2026 =====
    {
        "user": {"username": "karima_elhadri", "email": "k.elhadri@email.com"},
        "profile": {
            "nom": "El Hadri", "prenom": "Karima", "genre": "F",
            "dateNaissance": "1980-07-15", "telephone": "0655555555",
            "cin": "KE555555", "adresse": "7 Rue de la Liberté, Casablanca",
            "groupeSanguin": "A-", "allergies": "Pénicilline",
            "antecedents": "Asthme bronchique depuis l'enfance. Rhinite allergique saisonnière."
        },
        "past_consultation": {
            "date": "2026-06-08", "heure": "09:00", "motif": "Contrôle asthmatique trimestriel",
            "symptomes": "Toux sèche nocturne, sifflements en fin de nuit, fatigue matinale.",
            "diagnostic": "Asthme modéré non contrôlé. Débit expiratoire de pointe à 280 L/min.",
            "notes": "Technique d'inhalation à revoir. Ajout d'un traitement de fond.",
            "ordonnance": [
                {"nom": "Seretide 250µg", "dosage": "250µg", "posologie": "2 inhalations matin et soir"},
                {"nom": "Ventoline 100µg", "dosage": "100µg", "posologie": "2 bouffées en cas de crise"},
                {"nom": "Montélukast 10mg", "dosage": "10mg", "posologie": "1 comprimé le soir"}
            ]
        },
        "future_appointment": {
            "date": "2026-06-26", "heure": "09:00", "motif": "Contrôle respiratoire et test de réversibilité",
            "type": "PRESENTIEL", "statut": "EN_ATTENTE"
        }
    },
    {
        "user": {"username": "yassine_abid", "email": "y.abid@email.com"},
        "profile": {
            "nom": "Abid", "prenom": "Yassine", "genre": "M",
            "dateNaissance": "1988-11-22", "telephone": "0666666666",
            "cin": "YA666666", "adresse": "33 Rue Ibn Sina, Rabat",
            "groupeSanguin": "B-", "allergies": "Aucune",
            "antecedents": "Hypertension artérielle, arthrose cervicale."
        },
        "past_consultation": {
            "date": "2026-06-03", "heure": "11:30", "motif": "Douleurs cervicales et tensions musculaires",
            "symptomes": "Cervicalgies chroniques, céphalées de tension, raideur matinale.",
            "diagnostic": "Arthrose cervicale légère avec contractures musculaires associées.",
            "notes": "Séances de kinésithérapie recommandées. Adaptation du poste de travail.",
            "ordonnance": [
                {"nom": "Ketum 50mg", "dosage": "50mg", "posologie": "1 comprimé matin et soir"},
                {"nom": "Myolastan 300mg", "dosage": "300mg", "posologie": "1 comprimé le soir"},
                {"nom": "Paracétamol 1000mg", "dosage": "1000mg", "posologie": "En cas de douleur, max 3/jour"}
            ]
        },
        "future_appointment": {
            "date": "2026-06-26", "heure": "11:30", "motif": "Bilan kinésithérapique et contrôle des douleurs",
            "type": "PRESENTIEL", "statut": "EN_ATTENTE"
        }
    },
    {
        "user": {"username": "nawal_lamrani", "email": "n.lamrani@email.com"},
        "profile": {
            "nom": "Lamrani", "prenom": "Nawal", "genre": "F",
            "dateNaissance": "1993-05-03", "telephone": "0677777777",
            "cin": "NL777777", "adresse": "56 Rue des Mimosas, Casablanca",
            "groupeSanguin": "O+", "allergies": "Aucune",
            "antecedents": "Candidoses vaginales récidivantes, endométriose légère."
        },
        "past_consultation": {
            "date": "2026-06-15", "heure": "13:00", "motif": "Suivi gynécologique et bilan hormonal",
            "symptomes": "Dysménorrhée sévère, pertes blanches suspectes, douleurs pelviennes.",
            "diagnostic": "Endométriose légère associée à une candidose récidivante.",
            "notes": "Bilan hormonal en cours. Traitement antifongique prolongé.",
            "ordonnance": [
                {"nom": "Fluconazole 150mg", "dosage": "150mg", "posologie": "1 gélule par semaine"},
                {"nom": "Spasfon 80mg", "dosage": "80mg", "posologie": "2 comprimés 3 fois par jour pendant les règles"},
                {"nom": "Probiotiques gynécologiques", "dosage": "1M UI", "posologie": "1 ovule par jour"}
            ]
        },
        "future_appointment": {
            "date": "2026-06-26", "heure": "13:00", "motif": "Suivi gynécologique et contrôle candidose",
            "type": "PRESENTIEL", "statut": "EN_ATTENTE"
        }
    },
    {
        "user": {"username": "brahim_elmanzouzi", "email": "b.elmanzouzi@email.com"},
        "profile": {
            "nom": "El Manzouzi", "prenom": "Brahim", "genre": "M",
            "dateNaissance": "1970-10-10", "telephone": "0688888888",
            "cin": "BE888888", "adresse": "21 Rue de l'Atlas, Marrakech",
            "groupeSanguin": "A+", "allergies": "AINS",
            "antecedents": "Goutte, insuffisance rénale chronique stade 3, diabète de type 2."
        },
        "past_consultation": {
            "date": "2026-06-07", "heure": "15:30", "motif": "Suivi néphrologique et goutte",
            "symptomes": "Crise de goutte au gros orteil, œdèmes des membres inférieurs, HTA.",
            "diagnostic": "Poussée de goutte sur insuffisance rénale chronique.",
            "notes": "Stabilisation de l'uricémie en cours. Contrôle de la protéinurie.",
            "ordonnance": [
                {"nom": "Allopurinol 300mg", "dosage": "300mg", "posologie": "1 comprimé le matin"},
                {"nom": "Colchicine 1mg", "dosage": "1mg", "posologie": "1 comprimé en cas de crise"},
                {"nom": "Furosémide 40mg", "dosage": "40mg", "posologie": "1 comprimé le matin"}
            ]
        },
        "future_appointment": {
            "date": "2026-06-26", "heure": "15:30", "motif": "Contrôle rénal et uricémie post-crise",
            "type": "PRESENTIEL", "statut": "EN_ATTENTE"
        }
    },
    {
        "user": {"username": "sanae_tazi", "email": "s.tazi@email.com"},
        "profile": {
            "nom": "Tazi", "prenom": "Sanae", "genre": "F",
            "dateNaissance": "2000-08-25", "telephone": "0699999999",
            "cin": "ST999999", "adresse": "9 Rue des Amandiers, Rabat",
            "groupeSanguin": "AB-", "allergies": "Pénicilline, sulfamides",
            "antecedents": "Acné sévère, syndrome des ovaires polykystiques (SOPK)."
        },
        "past_consultation": {
            "date": "2026-06-01", "heure": "17:00", "motif": "Suivi SOPK et acné inflammatoire",
            "symptomes": "Acné nodulaire sur le visage et le dos, cycles irréguliers, hirsutisme.",
            "diagnostic": "SOPK associé à une acné sévère résistante.",
            "notes": "Bilan hormonal à réaliser. Traitement dermatologique associé.",
            "ordonnance": [
                {"nom": "Diane 35", "dosage": "35µg", "posologie": "1 comprimé par jour pendant 21 jours"},
                {"nom": "Spironolactone 50mg", "dosage": "50mg", "posologie": "1 comprimé matin et soir"},
                {"nom": "Traitement local acné", "dosage": "Application locale", "posologie": "Matin et soir"}
            ]
        },
        "future_appointment": {
            "date": "2026-06-26", "heure": "17:00", "motif": "Contrôle dermatologique et hormonal SOPK",
            "type": "PRESENTIEL", "statut": "EN_ATTENTE"
        }
    }
]

def seed_new_patients():
    print("\n" + "="*70)
    print("🚀 MEDPREDICT - INJECTION DE PATIENTS POUR LE 25 ET 26 JUIN 2026")
    print("="*70 + "\n")

    # Récupérer le médecin par défaut
    medecin = User.objects.filter(role='MEDECIN').first()
    if not medecin:
        print("❌ Erreur : Aucun médecin trouvé dans la base de données.")
        return

    print(f"👨‍⚕️ Médecin référent : {medecin.username} (ID: {medecin.id})")
    print(f"📅 Date des rendez-vous : 25 et 26 juin 2026 - Tous en statut EN_ATTENTE")
    print(f"👥 Nombre de patients à injecter : {len(NEW_PATIENTS_DATA)}\n")

    patients_inserted = 0
    rdv_inserted = 0
    patients_25 = 0
    patients_26 = 0

    for index, item in enumerate(NEW_PATIENTS_DATA):
        u_data = item["user"]
        p_data = item["profile"]
        past_c = item["past_consultation"]
        fut_a = item["future_appointment"]
        
        # Déterminer la date du rendez-vous
        rdv_date = fut_a["date"]
        date_label = "25 juin" if rdv_date == "2026-06-25" else "26 juin"
        
        print(f"\n--- Patient #{index+1} : RDV le {date_label} ---")

        # 1. Création du User
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

        # 2. Création du Patient
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
            if rdv_date == "2026-06-25":
                patients_25 += 1
            else:
                patients_26 += 1
            print(f"      ✅ Profil Patient créé : {patient.nom_complet} (CIN: {patient.cin})")
        else:
            if not patient.user:
                patient.user = user
                patient.save()
            print(f"      ℹ️ Profil Patient existant : {patient.nom_complet}")

        # 3. Création de la consultation passée
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

        # 4. Création du rendez-vous futur
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
                statut=fut_a["statut"],
                motif=fut_a["motif"],
                type=fut_a["type"]
            )
            rdv_inserted += 1
            print(f"      📅 RDV Futur créé : Le {fut_a['date']} à {fut_a['heure']} ({fut_a['statut']})")
        else:
            print(f"      ℹ️ RDV Futur du {fut_a['date']} à {fut_a['heure']} déjà existant")

    print("\n" + "="*70)
    print("📊 BILAN DE L'INJECTION")
    print("="*70)
    print(f"   👥 Nouveaux patients injectés : {patients_inserted}")
    print(f"      - RDV le 25 juin 2026 : {patients_25} patients")
    print(f"      - RDV le 26 juin 2026 : {patients_26} patients")
    print(f"   📅 Nouveaux rendez-vous : {rdv_inserted} (tous en ATTENTE)")
    print(f"   📈 Total patients en base : {Patient.objects.count()}")
    print(f"   📈 Total rendez-vous en base : {RendezVous.objects.count()}")
    print(f"   📈 Rendez-vous en attente : {RendezVous.objects.filter(statut='EN_ATTENTE').count()}")
    print("="*70)
    print("\n💡 Tous les rendez-vous sont en mode EN_ATTENTE.")
    print("   La secrétaire doit les accepter manuellement depuis l'interface.\n")

if __name__ == "__main__":
    seed_new_patients()