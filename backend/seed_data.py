#!/usr/bin/env python
"""
Script de réinitialisation et seeding pour MedPredict
- Supprime TOUS les patients (officiels, drafts, users patients)
- Supprime les consultations et rendez-vous associés
- Crée 15 patients de test avec profils réalistes
- Crée des rendez-vous et consultations pour les patients "officiels"
"""

import os
import sys
import django
import random
from datetime import datetime, timedelta, date, time

# Configuration Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
sys.path.insert(0, '/app')  # Ajuste selon ton environnement
django.setup()

from django.contrib.auth import get_user_model
from apps.patients.models import Patient, PatientDraft
from apps.appointments.models import RendezVous
from apps.consultations.models import Consultation
from apps.prescriptions.models import Ordonnance, Medicament

User = get_user_model()

# ═══════════════════════════════════════════════════════════════
# DONNÉES DE TEST - PATIENTS RÉALISTES
# ═══════════════════════════════════════════════════════════════

PATIENTS_DATA = [
    # === PATIENTS OFFICIELS (avec dossiers médicaux complets) ===
    {
        "user": {"username": "yassine_bennani", "email": "y.bennani@email.com"},
        "profile": {
            "nom": "Bennani", "prenom": "Yassine", "genre": "M",
            "dateNaissance": "1985-03-15", "telephone": "0612345678",
            "cin": "AB123456", "adresse": "12 Rue des Oliviers, Casablanca",
            "groupeSanguin": "O+", "allergies": "Pénicilline, Sulfamides",
            "antecedents": "Hypertension artérielle diagnostiquée en 2019. Appendectomie en 2010."
        },
        "official": True,
        "consultations": [
            {
                "date": "2026-04-10", "heure": "09:00", "motif": "Consultation de suivi hypertension",
                "symptomes": "Tension artérielle élevée mesurée à 145/95. Légères vertiges matinaux. Pas de céphalées.",
                "diagnostic": "Hypertension artérielle de grade 1. Équilibre stable sous traitement.",
                "notes": "Patient observant le régime hyposodé. Activité physique régulière (marche 3x/semaine).",
                "ordonnance": [
                    {"nom": "Amlor 5mg", "dosage": "5mg", "posologie": "1 comprimé le matin à jeun"},
                    {"nom": "Tahor 10mg", "dosage": "10mg", "posologie": "1 comprimé le soir au coucher"}
                ]
            },
            {
                "date": "2026-03-15", "heure": "10:30", "motif": "Bilan annuel",
                "symptomes": "Asymptomatique. Demande bilan de routine pour suivi hypertension.",
                "diagnostic": "État général satisfaisant. IMC 24.5. Glycémie à jeun normale.",
                "notes": "Bilan biologique prescrit : NFS, ionogramme, créatinine, LDL. RDV dans 3 mois.",
                "ordonnance": [
                    {"nom": "Amlor 5mg", "dosage": "5mg", "posologie": "1 comprimé le matin"}
                ]
            }
        ]
    },
    {
        "user": {"username": "sara_tazi", "email": "s.tazi@email.com"},
        "profile": {
            "nom": "Tazi", "prenom": "Sara", "genre": "F",
            "dateNaissance": "1992-07-22", "telephone": "0623456789",
            "cin": "CD789012", "adresse": "45 Avenue Hassan II, Rabat",
            "groupeSanguin": "A-", "allergies": "Lactose (intolérance)",
            "antecedents": "Asthme léger d'enfance. Accouchement par césarienne en 2023."
        },
        "official": True,
        "consultations": [
            {
                "date": "2026-04-22", "heure": "11:00", "motif": "Toux persistante",
                "symptomes": "Toux sèche depuis 10 jours, aggravée la nuit. Fièvre à 38.2°C. Fatigue importante.",
                "diagnostic": "Bronchite aiguë d'allure virale. Épuration bronchique difficile.",
                "notes": "Auscultation : crépitants diffus bilatéraux. Pas de dyspnée au repos. Radiographie thoracique recommandée si persistance > 15 jours.",
                "ordonnance": [
                    {"nom": "Solupred 20mg", "dosage": "20mg", "posologie": "1 comprimé le matin pendant 5 jours"},
                    {"nom": "Humex toux sèche", "dosage": "15mg/5ml", "posologie": "15ml 3 fois par jour"},
                    {"nom": "Doliprane 1000mg", "dosage": "1000mg", "posologie": "1 comprimé si fièvre > 38.5°C, max 4/jour"}
                ]
            },
            {
                "date": "2026-01-20", "heure": "14:00", "motif": "Contrôle post-natal",
                "symptomes": "Consultation de routine post-accouchement. Aucun symptôme particulier.",
                "diagnostic": "Rétablissement post-partum satisfaisant. Hémoglobine à 11.2g/dL.",
                "notes": "Patient en bonne forme. Allaitement maternel maintenu. Supplémentation fer prescrite.",
                "ordonnance": [
                    {"nom": "Tardyferon 80mg", "dosage": "80mg", "posologie": "1 comprimé par jour pendant 3 mois"},
                    {"nom": "Vitamine D 1000 UI", "dosage": "1000 UI", "posologie": "1 gélule par jour"}
                ]
            }
        ]
    },
    {
        "user": {"username": "mehdi_elfassi", "email": "m.elfassi@email.com"},
        "profile": {
            "nom": "El Fassi", "prenom": "Mehdi", "genre": "M",
            "dateNaissance": "1978-11-05", "telephone": "0634567890",
            "cin": "EF345678", "adresse": "8 Rue Ibn Sina, Fès",
            "groupeSanguin": "B+", "allergies": "Aucune connue",
            "antecedents": "Diabète type 2 depuis 2015. Néphropathie diabétique stade 2."
        },
        "official": True,
        "consultations": [
            {
                "date": "2026-04-28", "heure": "09:30", "motif": "Suivi diabète",
                "symptomes": "Polyurie nocturne (3-4 levées). Soif excessive. Vision parfois floue en fin de journée.",
                "diagnostic": "Diabète type 2 déséquilibré. HbA1c estimée ~8.5%. Signes de microangiopathie.",
                "notes": "Patient rapporte non-observance récente du régime (Ramadan). Éducation diététique renforcée. Bilan rénal et ophtalmologique à jour recommandé.",
                "ordonnance": [
                    {"nom": "Glucophage 1000mg", "dosage": "1000mg", "posologie": "1 comprimé matin et soir au cours des repas"},
                    {"nom": "Galvus 50mg", "dosage": "50mg", "posologie": "1 comprimé le matin"},
                    {"nom": "Tahor 20mg", "dosage": "20mg", "posologie": "1 comprimé le soir"}
                ]
            },
            {
                "date": "2026-02-10", "heure": "16:00", "motif": "Pied douloureux",
                "symptomes": "Douleur plantaire gauche depuis 2 semaines. Rougeur localisée sous le gros orteil.",
                "diagnostic": "Ulcère plantaire superficiel chez patient diabétique. Pas de signes de nécrose.",
                "notes": "Décharge du membre inférieur gauche recommandée. Pansement quotidien. Contrôle dans 1 semaine. Podologue à consulter.",
                "ordonnance": [
                    {"nom": "Augmentin 1g", "dosage": "1g", "posologie": "1 comprimé matin et soir pendant 7 jours"},
                    {"nom": "Doliprane 500mg", "dosage": "500mg", "posologie": "1 comprimé si douleur"}
                ]
            },
            {
                "date": "2025-12-05", "heure": "10:00", "motif": "Bilan annuel diabète",
                "symptomes": "Asymptomatique. Bilan de routine demandé par l'assurance.",
                "diagnostic": "Diabète équilibré à ce jour. HbA1c à 7.2%. PAS 130/80. Poids stable.",
                "notes": "Fond d'œil : absence de rétinopathie. Créatinine à 95 µmol/L (stable). Poursuite du traitement actuel.",
                "ordonnance": [
                    {"nom": "Glucophage 850mg", "dosage": "850mg", "posologie": "1 comprimé matin et soir"},
                    {"nom": "Tahor 10mg", "dosage": "10mg", "posologie": "1 comprimé le soir"}
                ]
            }
        ]
    },
    {
        "user": {"username": "ines_idrissi", "email": "i.idrissi@email.com"},
        "profile": {
            "nom": "Idrissi", "prenom": "Ines", "genre": "F",
            "dateNaissance": "1995-09-18", "telephone": "0645678901",
            "cin": "GH567890", "adresse": "22 Boulevard Mohammed VI, Marrakech",
            "groupeSanguin": "AB+", "allergies": "Iode (réaction cutanée)",
            "antecedents": "Migraine avec aura depuis l'adolescence. Cholecystectomie laparoscopique en 2022."
        },
        "official": True,
        "consultations": [
            {
                "date": "2026-04-15", "heure": "11:30", "motif": "Crise migraineuse",
                "symptomes": "Céphalée pulsatile hémicrânienne droite depuis 48h. Photophobie, nausées. Vomissements x2.",
                "diagnostic": "Migraine avec aura, crise modérée à sévère. Pas de signes d'alerte neurologique.",
                "notes": "Patient connue. Dernier examen neurologique : 2024 (normal). Déclencheur probable : stress professionnel + écrans prolongés. Arrêt de travail 3 jours.",
                "ordonnance": [
                    {"nom": "Imigran 50mg", "dosage": "50mg", "posologie": "1 comprimé au début de la crise, renouvelable après 2h si besoin (max 2/jour)"},
                    {"nom": "Primperan 10mg", "dosage": "10mg", "posologie": "1 comprimé si nausées"},
                    {"nom": "Doliprane 1000mg", "dosage": "1000mg", "posologie": "1 comprimé si douleur résiduelle"}
                ]
            }
        ]
    },
    {
        "user": {"username": "omar_mezouar", "email": "o.mezouar@email.com"},
        "profile": {
            "nom": "Mezouar", "prenom": "Omar", "genre": "M",
            "dateNaissance": "1960-01-30", "telephone": "0656789012",
            "cin": "IJ789012", "adresse": "3 Rue Al Farabi, Tanger",
            "groupeSanguin": "O-", "allergies": "Aspirine (asthme induit)",
            "antecedents": "Coronarien : 2 stents en 2021. Fibrillation atriale paroxystique. Insuffisance cardiaque NYHA II."
        },
        "official": True,
        "consultations": [
            {
                "date": "2026-04-25", "heure": "09:00", "motif": "Dyspnée d'effort",
                "symptomes": "Essoufflement lors de la montée des escaliers (2 étages). Œdèmes des chevilles en fin de journée. Pas de douleur thoracique.",
                "diagnostic": "Insuffisance cardiaque congestive en décompensation légère. Œdèmes bilatéraux mollets + crépitants bases pulmonaires.",
                "notes": "FC 88 régulière. TA 125/80. Poids +2kg en 1 semaine. Augmentation temporaire du Lasilix. RDV cardiologue dans 2 semaines. ECG + troponine si aggravation.",
                "ordonnance": [
                    {"nom": "Lasilix 40mg", "dosage": "40mg", "posologie": "2 comprimés le matin pendant 5 jours, puis retour à 1/jour"},
                    {"nom": "Aldactone 25mg", "dosage": "25mg", "posologie": "1 comprimé le matin"},
                    {"nom": "Cordarone 200mg", "dosage": "200mg", "posologie": "1 comprimé le matin (surveiller TSH dans 1 mois)"},
                    {"nom": "Kardegic 75mg", "dosage": "75mg", "posologie": "1 comprimé le matin à jeun"}
                ]
            },
            {
                "date": "2026-03-01", "heure": "10:00", "motif": "Bilan cardiaque trimestriel",
                "symptomes": "Asymptomatique. Suivi régulier post-stenting.",
                "diagnostic": "État cardiaque stable sous traitement. Pas de nouvelle ischémie.",
                "notes": "ECG : rythme sinusal régulier 72/min. Pas de signes d'ischémie. Échocardiographie : FEVG 45% (stable). Poursuite du traitement.",
                "ordonnance": [
                    {"nom": "Lasilix 40mg", "dosage": "40mg", "posologie": "1 comprimé le matin"},
                    {"nom": "Kardegic 75mg", "dosage": "75mg", "posologie": "1 comprimé le matin"},
                    {"nom": "Crestor 10mg", "dosage": "10mg", "posologie": "1 comprimé le soir"}
                ]
            }
        ]
    },
    {
        "user": {"username": "lina_alami", "email": "l.alami@email.com"},
        "profile": {
            "nom": "Alami", "prenom": "Lina", "genre": "F",
            "dateNaissance": "2002-05-12", "telephone": "0667890123",
            "cin": "KL901234", "adresse": "67 Rue Ibn Batouta, Agadir",
            "groupeSanguin": "A+", "allergies": "Pollens (rhinite saisonnière)",
            "antecedents": "Aucun antécédent médical majeur. Vaccination à jour."
        },
        "official": True,
        "consultations": [
            {
                "date": "2026-04-18", "heure": "15:00", "motif": "Angine récidivante",
                "symptomes": "Douleur pharyngée intense depuis 3 jours. Fièvre à 39°C. Dysphagie. Adénopathies cervicales bilatérales.",
                "diagnostic": "Angine streptococcique probable (Centor 4/5). Test rapide strepto recommandé.",
                "notes": "Examen : amygdalles hypertrophiques avec exsudat blanchâtre. Pas de trismus. Traitement empirique antibiotique en attendant le résultat du TDR.",
                "ordonnance": [
                    {"nom": "Ospen 1.5M UI", "dosage": "1.5M UI", "posologie": "1 comprimé 2 fois par jour pendant 10 jours"},
                    {"nom": "Doliprane 500mg", "dosage": "500mg", "posologie": "2 comprimés 3 fois par jour si fièvre"},
                    {"nom": "Hexaspray", "dosage": "solution", "posologie": "3 pulvérisations locales 4 fois par jour"}
                ]
            }
        ]
    },
    {
        "user": {"username": "hamza_slaoui", "email": "h.slaoui@email.com"},
        "profile": {
            "nom": "Slaoui", "prenom": "Hamza", "genre": "M",
            "dateNaissance": "1988-12-03", "telephone": "0678901234",
            "cin": "MN012345", "adresse": "14 Avenue des FAR, Oujda",
            "groupeSanguin": "B-", "allergies": "Aucune",
            "antecedents": "Lombalgie chronique par hernie discale L4-L5. Arrêts de travail répétés."
        },
        "official": True,
        "consultations": [
            {
                "date": "2026-04-20", "heure": "16:30", "motif": "Exacerbation lombaire",
                "symptomes": "Lombalgie aiguë irradiant vers la fesse gauche depuis 5 jours. Aggravation à la flexion antérieure. Impossibilité de conduire.",
                "diagnostic": "Crise de lombalgie commune sur hernie discale connue. Pas de signes de gravité (saddle anesthesia, troubles sphinctériens).",
                "notes": "Examens : Lasègue gauche à 40° (positif). Réflexes achiléens présents bilatéralement. IRM lombaire de 2023 : hernie paramédiane gauche L4-L5. Arrêt de travail 10 jours. Kinésithérapie prescrite.",
                "ordonnance": [
                    {"nom": "Myolastan 4mg", "dosage": "4mg", "posologie": "1 comprimé matin et soir pendant 7 jours"},
                    {"nom": "Doliprane 1000mg", "dosage": "1000mg", "posologie": "1 comprimé 3 fois par jour"},
                    {"nom": "Voltaren 50mg", "dosage": "50mg", "posologie": "1 comprimé matin et soir pendant 5 jours (à prendre au cours des repas)"}
                ]
            },
            {
                "date": "2025-11-15", "heure": "11:00", "motif": "Bilan lombalgie",
                "symptomes": "Lombalgie chronique depuis 2 ans. Épisodes mensuels. Demande avis spécialisé.",
                "diagnostic": "Lombalgie chronique commune. Pas de signes de compression radiculaire sévère à ce jour.",
                "notes": "IRM lombaire prescrite. Résultat : hernie discale L4-L5 paramédiane gauche 7mm. Pas de sténose du canal. Avis neurochirurgical non urgent. Rééducation prolongée recommandée.",
                "ordonnance": [
                    {"nom": "Myolastan 4mg", "dosage": "4mg", "posologie": "1 comprimé soir pendant 15 jours"}
                ]
            }
        ]
    },
    {
        "user": {"username": "rita_zaki", "email": "r.zaki@email.com"},
        "profile": {
            "nom": "Zaki", "prenom": "Rita", "genre": "F",
            "dateNaissance": "1970-08-25", "telephone": "0689012345",
            "cin": "OP123456", "adresse": "9 Rue Ibn Rochd, Tétouan",
            "groupeSanguin": "O+", "allergies": "Aucune",
            "antecedents": "Hypothyroïdie depuis 2015 (Hashimoto). Ostéoporose débutante. Ménoposée depuis 2020."
        },
        "official": True,
        "consultations": [
            {
                "date": "2026-04-12", "heure": "10:00", "motif": "Bilan thyroïdien annuel",
                "symptomes": "Fatigue persistante depuis 2 mois. Intolérance au froid. Prise de poids (+3kg).",
                "diagnostic": "Hypothyroïdie sous-compensée. TSH à 8.5 mUI/L (cible <4).",
                "notes": "Augmentation du Lévothyrox. Bilan osseux à jour : DMO lombaire T-score -2.1 (ostéoporose débutante). Calcium + Vitamine D maintenus. Densitométrie dans 1 an.",
                "ordonnance": [
                    {"nom": "Lévothyrox 100µg", "dosage": "100µg", "posologie": "1 comprimé le matin à jeun (augmentation de 75µg)"},
                    {"nom": "Calcium 500mg + Vit D3", "dosage": "500mg/400UI", "posologie": "1 comprimé matin et soir"},
                    {"nom": "Fosamax 70mg", "dosage": "70mg", "posologie": "1 comprimé par semaine le matin à jeun, rester debout 30min"}
                ]
            }
        ]
    },
    {
        "user": {"username": "anas_amrani", "email": "a.amrani@email.com"},
        "profile": {
            "nom": "Amrani", "prenom": "Anas", "genre": "M",
            "dateNaissance": "1998-04-08", "telephone": "0690123456",
            "cin": "QR234567", "adresse": "31 Rue Al Mouahidine, Kenitra",
            "groupeSanguin": "AB-", "allergies": "Acariens (asthme allergique)",
            "antecedents": "Asthme allergique contrôlé. Rhinite persistante."
        },
        "official": True,
        "consultations": [
            {
                "date": "2026-04-05", "heure": "09:00", "motif": "Exacerbation asthmatique",
                "symptomes": "Dyspnée sifflante nocturne depuis 3 nuits. Toux productive. Utilisation fréquente du Ventoline (>4 fois/jour).",
                "diagnostic": "Asthme mal contrôlé, exacerbation modérée. DEP estimé 60% du théorique.",
                "notes": "Patient non observant du traitement de fond (arrêté il y a 2 mois). Rééducation à l'utilisation du inhalateur. Plan d'action asthme fourni. RDV dans 1 semaine.",
                "ordonnance": [
                    {"nom": "Ventoline 100µg", "dosage": "100µg/dose", "posologie": "2 inhalations si dyspnée, max 8/jour"},
                    {"nom": "Seretide 250", "dosage": "250µg", "posologie": "2 inhalations matin et soir"},
                    {"nom": "Singulair 10mg", "dosage": "10mg", "posologie": "1 comprimé le soir"}
                ]
            }
        ]
    },
    {
        "user": {"username": "sofia_berrada", "email": "s.berrada@email.com"},
        "profile": {
            "nom": "Berrada", "prenom": "Sofia", "genre": "F",
            "dateNaissance": "1982-10-17", "telephone": "0601234567",
            "cin": "ST345678", "adresse": "55 Boulevard Zerktouni, Casablanca",
            "groupeSanguin": "A+", "allergies": "Aucune",
            "antecedents": "Anxiété généralisée. Syndrome de fatigue chronique suspecté."
        },
        "official": True,
        "consultations": [
            {
                "date": "2026-04-08", "heure": "14:30", "motif": "Fatigue chronique",
                "symptomes": "Fatigue intense persistant depuis 6 mois. Sommeil non réparateur. Difficultés de concentration. Douleurs musculaires diffuses.",
                "diagnostic": "Syndrome de fatigue chronique probable (critères Fukuda). Bilan biologique normal à ce jour.",
                "notes": "NFS, VS, CRP, TSH, cortisol, vitamine B12, ferririne : tous normaux. Avis interniste demandé. Psychothérapie et activité graduée recommandées. Arrêt de travail 1 mois.",
                "ordonnance": [
                    {"nom": "Magnésium B6", "dosage": "complexe", "posologie": "2 comprimés matin et soir pendant 2 mois"},
                    {"nom": "Vitamine B12 1000µg", "dosage": "1000µg", "posologie": "1 comprimé sublingual par jour"},
                    {"nom": "Xanax 0.25mg", "dosage": "0.25mg", "posologie": "1 comprimé le soir si anxiété (max 3 semaines, à renouveler)"}
                ]
            },
            {
                "date": "2026-02-20", "heure": "11:00", "motif": "Bilan fatigue",
                "symptomes": "Fatigue progressive depuis 3 mois. Perte d'appétit. Anxiété croissante.",
                "diagnostic": "État dépressif anxieux léger à modéré. Bilan biologique en cours.",
                "notes": "Première consultation. Patient rapporte stress professionnel intense (burn-out). HAM-D estimé 14. Psychiatre recommandé. Pas de idéation suicidaire.",
                "ordonnance": [
                    {"nom": "Magnésium B6", "dosage": "complexe", "posologie": "2 comprimés matin et soir"},
                    {"nom": "Xanax 0.25mg", "dosage": "0.25mg", "posologie": "1/2 comprimé matin et soir pendant 2 semaines"}
                ]
            }
        ]
    },

    # === PATIENTS DRAFTS (pas encore de 1ère consultation) ===
    {
        "user": {"username": "karim_fassi", "email": "k.fassi@email.com"},
        "profile": {
            "nom": "Fassi", "prenom": "Karim", "genre": "M",
            "dateNaissance": "1990-02-14", "telephone": "0611122233",
            "cin": "UV456789", "adresse": "18 Rue des Roses, Rabat",
            "groupeSanguin": "O+", "allergies": "",
            "antecedents": ""
        },
        "official": False,
        "rdv_draft": {"date": "2026-05-18", "heure": "09:00", "motif": "Première consultation - Bilan général", "type": "PRESENTIEL"}
    },
    {
        "user": {"username": "nadia_bennis", "email": "n.bennis@email.com"},
        "profile": {
            "nom": "Bennis", "prenom": "Nadia", "genre": "F",
            "dateNaissance": "1988-06-20", "telephone": "0622233344",
            "cin": "WX567890", "adresse": "7 Avenue Al Massira, Fès",
            "groupeSanguin": "A-", "allergies": "Latex",
            "antecedents": ""
        },
        "official": False,
        "rdv_draft": {"date": "2026-05-19", "heure": "10:30", "motif": "Consultation gynécologique de routine", "type": "PRESENTIEL"}
    },
    {
        "user": {"username": "younes_ouazzani", "email": "y.ouazzani@email.com"},
        "profile": {
            "nom": "Ouazzani", "prenom": "Younes", "genre": "M",
            "dateNaissance": "1975-11-30", "telephone": "0633344455",
            "cin": "YZ678901", "adresse": "42 Rue Ibn Khaldoun, Marrakech",
            "groupeSanguin": "B+", "allergies": "",
            "antecedents": ""
        },
        "official": False,
        "rdv_draft": {"date": "2026-05-20", "heure": "14:00", "motif": "Douleur thoracique à explorer", "type": "PRESENTIEL"}
    },
    {
        "user": {"username": "fatima_hassani", "email": "f.hassani@email.com"},
        "profile": {
            "nom": "Hassani", "prenom": "Fatima", "genre": "F",
            "dateNaissance": "2000-03-08", "telephone": "0644455566",
            "cin": "AB789012", "adresse": "25 Boulevard Mohammed V, Tanger",
            "groupeSanguin": "O-", "allergies": "",
            "antecedents": ""
        },
        "official": False,
        "rdv_draft": {"date": "2026-05-18", "heure": "11:00", "motif": "Vaccination et bilan jeune adulte", "type": "VISIO"}
    },
    {
        "user": {"username": "mohamed_tahiri", "email": "m.tahiri@email.com"},
        "profile": {
            "nom": "Tahiri", "prenom": "Mohamed", "genre": "M",
            "dateNaissance": "1965-09-05", "telephone": "0655566677",
            "cin": "CD890123", "adresse": "33 Rue Al Andalous, Agadir",
            "groupeSanguin": "AB+", "allergies": "Sulfamides",
            "antecedents": ""
        },
        "official": False,
        "rdv_draft": {"date": "2026-05-22", "heure": "16:00", "motif": "Suivi diabète récemment diagnostiqué", "type": "PRESENTIEL"}
    },
]

# ═══════════════════════════════════════════════════════════════
# FONCTIONS UTILITAIRES
# ═══════════════════════════════════════════════════════════════

def clear_all_patient_data():
    """Supprime TOUTES les données patients (officiels, drafts, users, consultations, RDV)"""
    print("\n🗑️  RÉINITIALISATION DE LA BASE...")

    # 1. Supprimer les consultations d'abord (foreign key vers RendezVous)
    consult_count = Consultation.objects.all().count()
    Consultation.objects.all().delete()
    print(f"   ✅ {consult_count} consultation(s) supprimée(s)")

    # 2. Supprimer les ordonnances et médicaments
    med_count = Medicament.objects.all().count()
    ord_count = Ordonnance.objects.all().count()
    Medicament.objects.all().delete()
    Ordonnance.objects.all().delete()
    print(f"   ✅ {med_count} médicament(s) et {ord_count} ordonnance(s) supprimée(s)")

    # 3. Supprimer les rendez-vous
    rdv_count = RendezVous.objects.all().count()
    RendezVous.objects.all().delete()
    print(f"   ✅ {rdv_count} rendez-vous supprimé(s)")

    # 4. Supprimer les patients officiels
    patient_count = Patient.objects.all().count()
    Patient.objects.all().delete()
    print(f"   ✅ {patient_count} patient(s) officiel(s) supprimé(s)")

    # 5. Supprimer les drafts
    draft_count = PatientDraft.objects.all().count()
    PatientDraft.objects.all().delete()
    print(f"   ✅ {draft_count} draft(s) supprimé(s)")

    # 6. Supprimer les users patients (pas les médecins/secrétaires/admins!)
    user_count = User.objects.filter(role='PATIENT').count()
    User.objects.filter(role='PATIENT').delete()
    print(f"   ✅ {user_count} utilisateur(s) patient(s) supprimé(s)")

    print("\n🧹 Base de données patients complètement réinitialisée!\n")


def create_medecin_if_needed():
    """Crée un médecin de test si aucun n'existe"""
    medecin = User.objects.filter(role='MEDECIN').first()
    if not medecin:
        print("👨‍⚕️  Création d'un médecin de test...")
        medecin = User.objects.create_user(
            username="dr_test",
            email="dr.test@medpredict.ma",
            password="password123",
            role="MEDECIN",
            first_name="Test",
            last_name="Médecin"
        )
        print(f"   ✅ Médecin créé: {medecin.username}")
    else:
        print(f"   ℹ️  Médecin existant: {medecin.username}")
    return medecin


def create_patient_official(data, medecin):
    """Crée un patient officiel avec consultations et ordonnances"""
    user_data = data["user"]
    profile = data["profile"]

    # 1. Créer le User
    user = User.objects.create_user(
        username=user_data["username"],
        email=user_data["email"],
        password="password123",
        role="PATIENT",
        first_name=profile["prenom"],
        last_name=profile["nom"],
        email_verified=True
    )

    # 2. Créer le Patient officiel
    patient = Patient.objects.create(
        user=user,
        nom=profile["nom"],
        prenom=profile["prenom"],
        genre=profile["genre"],
        dateNaissance=profile["dateNaissance"],
        telephone=profile["telephone"],
        cin=profile["cin"],
        adresse=profile["adresse"],
        groupeSanguin=profile.get("groupeSanguin"),
        allergies=profile.get("allergies"),
        antecedents=profile.get("antecedents")
    )

    print(f"   👤 Patient officiel: {patient.nom_complet} (CIN: {profile['cin']})")

    # 3. Créer les rendez-vous et consultations
    for consult_data in data.get("consultations", []):
        # Créer le RDV (statut TERMINE pour les consultations passées)
        rdv = RendezVous.objects.create(
            user=user,
            patient=patient,
            medecin=medecin,
            date=consult_data["date"],
            heure=consult_data["heure"],
            statut="TERMINE",
            motif=consult_data["motif"],
            type="PRESENTIEL"
        )

        # Créer la Consultation
        consultation = Consultation.objects.create(
            rendezvous=rdv,
            symptomes=consult_data["symptomes"],
            diagnostic=consult_data.get("diagnostic", ""),
            notes=consult_data.get("notes", "")
        )

        # Créer l'Ordonnance et les Médicaments
        if consult_data.get("ordonnance"):
            ordonnance = Ordonnance.objects.create(consultation=consultation)
            for med in consult_data["ordonnance"]:
                Medicament.objects.create(
                    ordonnance=ordonnance,
                    nom=med["nom"],
                    dosage=med["dosage"],
                    posologie=med["posologie"]
                )

        print(f"      📋 Consultation du {consult_data['date']} - {consult_data['motif'][:40]}...")

    return patient


def create_patient_draft(data, medecin):
    """Crée un patient draft avec RDV en attente"""
    user_data = data["user"]
    profile = data["profile"]
    rdv_data = data["rdv_draft"]

    # 1. Créer le User
    user = User.objects.create_user(
        username=user_data["username"],
        email=user_data["email"],
        password="password123",
        role="PATIENT",
        first_name=profile["prenom"],
        last_name=profile["nom"],
        email_verified=True
    )

    # 2. Créer le PatientDraft (statut ACTIF)
    draft = PatientDraft.objects.create(
        user=user,
        nom=profile["nom"],
        prenom=profile["prenom"],
        genre=profile["genre"],
        dateNaissance=profile["dateNaissance"],
        telephone=profile["telephone"],
        cin=profile["cin"],
        adresse=profile["adresse"],
        groupeSanguin=profile.get("groupeSanguin"),
        allergies=profile.get("allergies"),
        antecedents=profile.get("antecedents"),
        status="ACTIF"
    )

    # 3. Créer le RDV (CONFIRME pour que le médecin puisse le voir immédiatement dans son calendrier)
    rdv = RendezVous.objects.create(
        user=user,
        patient=None,  # Pas encore de patient officiel
        medecin=medecin,
        date=rdv_data["date"],
        heure=rdv_data["heure"],
        statut="CONFIRME",
        motif=rdv_data["motif"],
        type=rdv_data["type"]
    )

    print(f"   📝 Draft: {draft.nom_complet} - RDV {rdv_data['date']} à {rdv_data['heure']} (CONFIRME)")
    return draft


def seed_database():
    """Fonction principale de seeding"""
    print("\n" + "="*60)
    print("🚀 MEDPREDICT - INITIALISATION DES DONNÉES DE TEST")
    print("="*60 + "\n")

    # Étape 1: Nettoyage
    clear_all_patient_data()

    # Étape 2: Vérifier le médecin
    medecin = create_medecin_if_needed()

    # Étape 3: Créer les patients officiels (avec dossiers médicaux)
    print("\n📚 CRÉATION DES PATIENTS OFFICIELS (avec dossiers médicaux)...")
    official_count = 0
    for data in PATIENTS_DATA:
        if data["official"]:
            create_patient_official(data, medecin)
            official_count += 1
    print(f"\n   ✅ {official_count} patients officiels créés avec consultations et ordonnances")

    # Étape 4: Créer les patients drafts (en attente de 1ère visite)
    print("\n📝 CRÉATION DES PATIENTS DRAFTS (en attente de 1ère consultation)...")
    draft_count = 0
    for data in PATIENTS_DATA:
        if not data["official"]:
            create_patient_draft(data, medecin)
            draft_count += 1
    print(f"\n   ✅ {draft_count} patients drafts créés avec RDV en attente")

    # Résumé final
    print("\n" + "="*60)
    print("📊 RÉSUMÉ DE LA BASE DE DONNÉES")
    print("="*60)
    print(f"   👥 Patients officiels: {Patient.objects.count()}")
    print(f"   📝 Drafts en attente: {PatientDraft.objects.count()}")
    print(f"   📅 Rendez-vous total: {RendezVous.objects.count()}")
    print(f"      └─ Terminés: {RendezVous.objects.filter(statut='TERMINE').count()}")
    print(f"      └─ En attente: {RendezVous.objects.filter(statut='EN_ATTENTE').count()}")
    print(f"   📋 Consultations: {Consultation.objects.count()}")
    print(f"   💊 Ordonnances: {Ordonnance.objects.count()}")
    print(f"   💉 Médicaments: {Medicament.objects.count()}")
    print("="*60)
    print("\n🎉 Base de données prête pour les tests!")
    print("\n💡 INFOS DE CONNEXION:")
    print("   Médecin: dr_test / password123")
    print("   Patients: [username] / password123 (ex: yassine_bennani)")
    print("="*60 + "\n")


if __name__ == "__main__":
    seed_database()