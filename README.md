# 🩺 MedPredict — Gestion Intelligente de Cabinet Médical

MedPredict est une application métier Full-Stack conçue pour centraliser la gestion d'un cabinet médical, intégrant une assistance au diagnostic basée sur l'intelligence artificielle.

## 🚀 Technologies utilisées

*   **Backend** : Django 6.0 + Django REST Framework (Architecture modulaire)
*   **Frontend** : React + Vite + Tailwind CSS v4
*   **State Management** : Zustand
*   **Base de données** : PostgreSQL 18
*   **Conteneurisation** : Docker & Docker Compose
*   **Sécurité** : Authentification par Token JWT (SimpleJWT)

## 📁 Structure du Projet

Le projet suit une architecture d'entreprise découpée par domaines métier :
- `apps/accounts` : Authentification (Admin, Médecin, Secrétaire, Patient).
- `apps/patients` : Dossiers médicaux complets.
- `apps/appointments` : Gestion de l'agenda et des demandes de RDV.
- `apps/consultations` : Cœur médical et futur module IA.
- `apps/prescriptions` : Édition d'ordonnances PDF.

## 🛠 Installation et Lancement

Pour lancer le projet sur votre machine locale :

1. Assurez-vous d'avoir **Docker** et **Docker Compose** installés.
2. Clonez le dépôt :
   ```bash
   git clone https://github.com/VOTRE_PSEUDO/medpredict.git
   cd medpredict
3. Lancez l'infrastructure :
    ```bash
    docker-compose up --build
4. Appliquez les migrations et créez l'admin :
    ```bash
    docker-compose exec backend python manage.py migrate
    docker-compose exec backend python manage.py createsuperuser

## 🔄 Workflow Actuel (Le "Flow")
- Patient : Inscription -> Demande de RDV (Statut : En attente).
- Secrétaire : Visualisation des demandes -> Validation (Crée le dossier Patient + Confirme le RDV).
- Médecin : Agenda dynamique -> Clic sur le RDV -> Ouverture de la Consultation.

## 🔑 Accès Spéciaux
- Maintenance Console : Accessible via le raccourci Alt + T sur la page d'accueil (Accès réservé au rôle ADMIN).