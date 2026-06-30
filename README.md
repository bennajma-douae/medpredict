# 🩺 MedPredict — Intelligent Medical Practice Management System

**MedPredict** is a full-stack medical practice management platform designed to simplify healthcare workflows by centralizing patient records, appointments, consultations, prescriptions, teleconsultation, and AI-assisted diagnosis.

Rather than focusing solely on features, the project was engineered as a real-world healthcare information system with modular architecture, secure data management, responsible AI integration, and a user experience tailored to the daily workflow of healthcare professionals.

---

## 🎯 Objectives

- 📌 Centralize medical practice management within a single platform.
- 📌 Improve traceability of consultations and patient records.
- 📌 Reduce administrative workload through workflow automation.
- 📌 Provide AI-assisted clinical decision support while preserving physicians' responsibility.
- 📌 Build a scalable and maintainable architecture following modern software engineering practices.

---

# 🏗️ General Architecture

MedPredict follows a modular architecture composed of a React frontend, a Django REST backend, dedicated microservices, asynchronous processing and external communication services.

The AI engine is intentionally isolated from the core business logic to ensure that patient management remains fully operational even if the prediction service becomes unavailable.

<p align="center">
  <img src="docs/diagrams/architecture-overview.png"
       alt="Architecture Overview"
       width="100%">
</p>

### Core Components

### 🎨 Frontend

- React + Vite
- Tailwind CSS
- Zustand
- JWT Authentication
- Role-based dashboards

### ⚙️ Backend

- Django
- Django REST Framework
- JWT Authentication
- RESTful API
- Modular business applications

### 🧠 AI Microservice

- Flask
- Scikit-learn
- Random Forest classifier
- Independent deployment
- Clinical post-processing

### 📡 Teleconsultation

- Flask-SocketIO
- Jitsi Meet
- Whisper speech transcription

### 💾 Database

- PostgreSQL
- ACID-compliant storage
- Structured medical records

### ⚡ Background Processing

- Celery
- Redis
- Email scheduling
- WhatsApp reminders

---

# 🔄 System Workflow

The following workflow illustrates the complete lifecycle of a patient, from appointment booking to consultation, AI-assisted diagnosis and prescription generation.

<p align="center">
  <img src="docs/diagrams/system-workflow.png"
       alt="System Workflow"
       width="100%">
</p>

---

# 🧩 Class Diagram

The following UML diagram illustrates the application's core entities and their relationships.

<p align="center">
  <img src="docs/diagrams/class-diagram.png"
       alt="Class Diagram"
       width="100%">
</p>

---

# 🚀 Technologies Used

| Layer | Technologies |
|--------|--------------|
| **Frontend** | React, Vite, Tailwind CSS, Zustand |
| **Backend** | Django, Django REST Framework |
| **Database** | PostgreSQL |
| **Authentication** | JWT (SimpleJWT) |
| **AI Service** | Flask, Scikit-learn |
| **Task Queue** | Celery, Redis |
| **Teleconsultation** | Flask-SocketIO, Jitsi Meet |
| **Notifications** | Brevo, Twilio |
| **Containerization** | Docker, Docker Compose |

---

# 🔑 Key Concepts

## 🏥 Centralized Patient Management

MedPredict centralizes all essential medical information into a unified platform, allowing healthcare professionals to access patient records, appointments, consultations, prescriptions, and medical history without switching between multiple tools.

---

## 🤖 AI: Assistant, Not Replacement

Artificial Intelligence was designed as a **clinical decision-support tool**, not as a diagnostic replacement.

The AI model analyzes patient symptoms and suggests the most probable conditions, while the physician remains solely responsible for the final diagnosis.

Clinical post-processing adjusts prediction scores according to contextual patient information to provide more relevant recommendations.

<p align="center">
  <img src="docs/diagrams/ai-decision-flow.png"
       alt="AI Decision Flow"
       width="95%">
</p>

### AI Features

- Symptom-based disease prediction
- Top-3 ranked diagnostic suggestions
- Confidence score visualization
- Clinical post-processing
- Explainable prediction results
- Physician-centered decision support

---

## 📅 Appointment Management

The platform simplifies appointment scheduling by providing:

- Appointment creation and modification
- Calendar visualization
- Status management
- Automated reminders
- Consultation history

---

## 📄 Digital Prescriptions

Doctors can generate structured digital prescriptions that are:

- Exportable as PDF
- Stored in patient history
- Easily printable
- Accessible during future consultations

---

## 🎥 Teleconsultation

Integrated teleconsultation allows physicians and patients to communicate remotely using:

- Secure video conferencing
- Integrated chat
- Whisper speech transcription
- Consultation history

---

## 🔔 Automated Notifications

Background workers handle asynchronous communication including:

- Email reminders (Brevo)
- WhatsApp notifications (Twilio)
- Appointment confirmations
- Follow-up reminders

---

# ⚙️ Installation

## Prerequisites

Before running MedPredict, make sure the following software is installed:

- Python 3.11+
- Node.js 18+
- PostgreSQL
- Redis
- Docker & Docker Compose (recommended)

---

## Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/MedPredict.git
cd MedPredict
```

---

## Backend Setup

```bash
cd backend

python -m venv venv

# Windows
venv\Scripts\activate

# Linux / macOS
source venv/bin/activate

pip install -r requirements.txt
```

---

## Frontend Setup

```bash
cd frontend

npm install
```

---

## AI Service Setup

```bash
cd ai-service

pip install -r requirements.txt
```

---

## Configure Environment Variables

Create a `.env` file inside the backend directory.

Example:

```env
SECRET_KEY=your_secret_key

DEBUG=True

DATABASE_NAME=medpredict

DATABASE_USER=postgres

DATABASE_PASSWORD=your_password

DATABASE_HOST=localhost

DATABASE_PORT=5432

JWT_SECRET_KEY=your_jwt_secret

BREVO_API_KEY=your_brevo_api_key

TWILIO_ACCOUNT_SID=your_sid

TWILIO_AUTH_TOKEN=your_token

JITSI_DOMAIN=meet.jit.si
```

> **Important:** Never commit your `.env` file or any API keys to GitHub.

---

## Apply Database Migrations

```bash
python manage.py migrate
```

---

## Create a Superuser

```bash
python manage.py createsuperuser
```

---

## Run the Backend

```bash
python manage.py runserver
```

---

## Run the Frontend

```bash
npm run dev
```

---

## Run Celery

```bash
celery -A medpredict worker -l info
```

---

## Run Redis

```bash
redis-server
```

---

## Run the AI Service

```bash
python app.py
```

---

## Docker Deployment

To launch the complete platform:

```bash
docker-compose up --build
```

The application will automatically start:

- React Frontend
- Django Backend
- PostgreSQL
- Redis
- Celery
- AI Microservice

---
# 🔐 Authentication & Permissions

MedPredict uses **JSON Web Tokens (JWT)** for secure authentication and **Role-Based Access Control (RBAC)** to ensure that each user only accesses the resources relevant to their role.

<p align="center">
  <img src="docs/diagrams/authentication-flow.png"
       alt="Authentication Flow"
       width="95%">
</p>

## User Roles

| Role | Permissions |
|------|-------------|
| 👨‍⚕️ Doctor | Manage patients, consultations, prescriptions, appointments, AI diagnosis, teleconsultation |
| 👩‍💼 Secretary | Manage appointments, patient registration, scheduling |
| 👨‍💻 Administrator | Full platform management, users, permissions and system settings |

---

# 🔌 REST API

The backend exposes a RESTful API built with **Django REST Framework**.

### Main API Modules

- Authentication
- Users
- Patients
- Medical Records
- Appointments
- Consultations
- Prescriptions
- AI Prediction
- Notifications
- Teleconsultation

Example endpoint:

```http
POST /api/auth/login/
```

Example response:

```json
{
  "access": "<JWT_TOKEN>",
  "refresh": "<REFRESH_TOKEN>"
}
```

---

# 🧪 Testing

The project includes automated testing to ensure application reliability.

### Backend

- Django Test Framework
- API endpoint testing
- Authentication tests
- Business logic validation

### Frontend

- Component testing
- User interface validation

### AI Module

- Model evaluation
- Prediction validation
- Clinical post-processing verification

---

# 📂 Repository Structure

```text
MedPredict/
│
├── backend/                 # Django REST API
├── frontend/                # React + Vite
├── ai-service/              # Flask AI microservice
├── docs/
│   └── diagrams/
│       ├── architecture-overview.png
│       ├── system-workflow.png
│       ├── class-diagram.png
│       ├── authentication-flow.png
│       └── ai-decision-flow.png
│
├── docker-compose.yml
├── README.md
└── .gitignore
```

---

# 📚 Documentation

The project documentation includes:

- Software Requirements Specification (SRS)
- UML Diagrams
- API Documentation
- Database Design
- System Architecture
- User Guide

---

# 🌟 Highlights

- Modular Full-Stack Architecture
- RESTful API
- JWT Authentication
- AI-assisted Diagnosis
- Teleconsultation
- Digital Prescriptions
- Automated Notifications
- Dockerized Deployment
- Responsive User Interface
- PostgreSQL Database
- Celery Background Tasks
- Redis Message Broker

---

# 👥 Authors

Developed as an engineering capstone project by:

- **Douae Ben Najma**
- **Imane Hachimi**
- **Fathi Chaybi**

Under the supervision of **Prof. Soumia Chokri**.

---

# 🙏 Acknowledgments

We would like to express our sincere gratitude to **Prof. Soumia Chokri** for her continuous guidance, valuable feedback, and unwavering support throughout this project.

Her expertise and encouragement played a fundamental role in the successful completion of MedPredict.

We also thank **ISGA** for providing us with the academic environment and technical foundation that made this project possible.

---

# 📄 License

This repository is published for educational and portfolio purposes.

All rights reserved © 2026.

The source code may not be copied, redistributed, or used for commercial purposes without the permission of the authors.

---

<div align="center">

**⭐ If you find this project interesting, consider giving it a star! ⭐**

Made with ❤️ using Django, React, Flask and PostgreSQL.

</div>