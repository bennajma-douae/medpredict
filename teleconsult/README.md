# MedPredict — Téléconsultation MVP

> Visioconférence WebRTC (Jitsi Meet) + Transcription automatique (Whisper AI)  
> Prototype local · Sans Docker · Sans base de données

---

## 📁 Structure des fichiers

```
medpredict-teleconsult/
├── app.py                      ← Backend Flask (API + routes)
├── requirements.txt            ← Dépendances Python
├── templates/
│   ├── index.html              ← Page d'accueil (création de salle)
│   └── consultation.html       ← Interface de consultation
└── static/
    ├── css/main.css            ← Design système complet
    └── js/consultation.js      ← Jitsi + MediaRecorder + Whisper client
```

---

## ⚙️ Installation (une seule fois)

### 1. Créer un environnement virtuel Python
```bash
python -m venv venv
source venv/bin/activate       # Linux / macOS
# ou
venv\Scripts\activate          # Windows
```

### 2. Installer les dépendances
```bash
pip install -r requirements.txt
```

> **Note Whisper** : Le premier lancement téléchargera automatiquement le modèle `base`
> (~140 Mo). Les modèles disponibles : `tiny`, `base`, `small`, `medium`, `large`.
> `base` est le meilleur compromis vitesse/qualité pour un prototype local.

---

## 🚀 Lancer le projet

```bash
python app.py
```

Ouvrez votre navigateur sur : **http://localhost:5000**

---

## 🧪 Scénario de test complet

### Étape 1 — Créer une salle
1. Ouvrez `http://localhost:5000`
2. Entrez le nom du médecin (ex: `Dr. Amrani`) et du patient (ex: `Youssef`)
3. Sélectionnez votre rôle (Médecin ou Patient)
4. Cliquez **"Créer la consultation"**
5. Un identifiant unique est généré (ex: `MedPredict-A1B2C3D4E5`)

### Étape 2 — Rejoindre la salle
1. Cliquez **"Rejoindre en tant que Médecin"** (ou Patient)
2. Copiez le lien affiché et ouvrez-le dans un **autre onglet ou navigateur** pour simuler l'autre participant
3. La visioconférence Jitsi s'ouvre automatiquement dans une salle privée

### Étape 3 — Enregistrer la consultation
1. Dans le panneau de droite, cliquez **"Démarrer l'enregistrement"**
2. Autorisez l'accès au microphone dans votre navigateur
3. Parlez (en français, arabe ou anglais)
4. Cliquez **"Arrêter l'enregistrement"**
5. Vous pouvez créer plusieurs segments

### Étape 4 — Transcrire avec Whisper
1. Cliquez **"✨ Transcrire avec Whisper"**
2. Le backend Flask reçoit l'audio, Whisper l'analyse localement
3. La transcription s'affiche avec :
   - La langue détectée automatiquement
   - Le texte complet
   - Les segments horodatés
4. Vous pouvez **copier** ou **télécharger** la transcription en `.txt`

### Étape 5 — Terminer
1. Cliquez **"✖ Terminer"** dans la barre du haut
2. Un résumé s'affiche, retournez à l'accueil

---

## 🔧 Personnalisation

### Changer le modèle Whisper
Dans `app.py`, ligne concernant `load_model` :
```python
_whisper_model = whisper.load_model("small")  # plus précis
_whisper_model = whisper.load_model("tiny")   # plus rapide
```

### Forcer la langue de transcription
Dans `app.py`, fonction `transcribe()` :
```python
result = model.transcribe(tmp_path, language="fr")  # forcer le français
result = model.transcribe(tmp_path, language="ar")  # arabe
```

### Utiliser une instance Jitsi privée
Dans `consultation.js` :
```javascript
const domain = "votre-jitsi.votre-domaine.com";
```

---

## 🌐 API Endpoints

| Méthode | Route | Description |
|---------|-------|-------------|
| `GET`   | `/` | Page d'accueil |
| `GET`   | `/consultation` | Page de consultation |
| `POST`  | `/api/create-room` | Génère une salle unique |
| `POST`  | `/api/transcribe` | Transcrit un fichier audio |

### Exemple `create-room`
```bash
curl -X POST http://localhost:5000/api/create-room \
  -H "Content-Type: application/json" \
  -d '{"doctor": "Dr. Amrani", "patient": "Youssef"}'
```
Réponse :
```json
{
  "room_id": "MedPredict-A1B2C3D4E5",
  "doctor": "Dr. Amrani",
  "patient": "Youssef",
  "jitsi_url": "https://meet.jit.si/MedPredict-A1B2C3D4E5"
}
```

### Exemple `transcribe`
```bash
curl -X POST http://localhost:5000/api/transcribe \
  -F "audio=@consultation.webm"
```
Réponse :
```json
{
  "success": true,
  "transcription": "Bonjour Docteur, j'ai mal à la gorge depuis trois jours.",
  "language": "fr",
  "segments": [
    {"start": 0.0, "end": 4.2, "text": "Bonjour Docteur,"},
    {"start": 4.2, "end": 8.1, "text": "j'ai mal à la gorge depuis trois jours."}
  ]
}
```

---

## ⚠️ Prérequis navigateur

- Chrome, Edge ou Firefox récent
- Accès au microphone autorisé
- Connexion internet (pour charger Jitsi depuis meet.jit.si)

---

## 🔮 Évolutions possibles (v2)

- [ ] Intégration du résumé AI (Anthropic Claude API) après transcription
- [ ] Export PDF de la consultation (FHIR-compatible)
- [ ] Persistance en base de données (PostgreSQL)
- [ ] Enregistrement côté serveur (SFU Jitsi self-hosted)
- [ ] Intégration WhatsApp (lien de salle partagé par bot)
- [ ] Signature électronique de l'ordonnance
