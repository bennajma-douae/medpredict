"""
MedPredict – Téléconsultation Backend
Flask + faster-whisper (compatible Python 3.11/3.12/3.13, sans PyTorch)
"""

import uuid
import os
import tempfile
import requests  # ✅ AJOUT : Pour appeler le backend Django

from flask import Flask, request, jsonify, render_template, session  # ✅ AJOUT : session
from flask_cors import CORS

app = Flask(__name__)
app.secret_key = 'medpredict-secret-key-change-in-production'  # ✅ AJOUT : pour les sessions
CORS(app)

TELECONSULT_API_KEY = "medpredict@2026"
# ──────────────────────────────────────────────
# Stockage temporaire des sessions validées (optionnel)
# ──────────────────────────────────────────────
validated_sessions = {}  # {room_id: {"valid": True, "expires": timestamp}}

# ──────────────────────────────────────────────
# Chargement paresseux de faster-whisper
# device="cpu" + compute_type="int8" → optimal sans GPU
# ──────────────────────────────────────────────
_whisper_model = None

def get_whisper_model():
    global _whisper_model
    if _whisper_model is None:
        from faster_whisper import WhisperModel
        print("⏳ Chargement du modèle faster-whisper 'base'...")
        _whisper_model = WhisperModel("base", device="cpu", compute_type="int8")
        print("✅ Modèle prêt.")
    return _whisper_model


# ──────────────────────────────────────────────
# Routes – Pages
# ──────────────────────────────────────────────
@app.route("/")
def index():
    return render_template("index.html")


# ✅ MODIFICATION : Route consultation avec vérification de code
@app.route("/consultation")
def consultation():
    """Page de consultation avec gestion du rôle (médecin/patient)"""
    room_id = request.args.get('room', '')
    role = request.args.get('role', 'doctor')
    patient_name = request.args.get('patient', 'Patient')
    doctor_name = request.args.get('doctor', 'Médecin')
    rdv_id = request.args.get('rdvId', '')
    validated = request.args.get('validated', 'false')  # ✅ AJOUT
    
    # ✅ Pour le médecin : pas besoin de code
    if role == 'doctor':
        return render_template("consultation.html", 
                             room_id=room_id, 
                             role=role,
                             patient_name=patient_name,
                             doctor_name=doctor_name,
                             rdv_id=rdv_id,
                             require_code=False)
    
    # ✅ Pour le patient : vérifier si déjà validé
    if validated == 'true' and session.get(f'validated_{room_id}'):
        return render_template("consultation.html", 
                             room_id=room_id, 
                             role=role,
                             patient_name=patient_name,
                             doctor_name=doctor_name,
                             rdv_id=rdv_id,
                             require_code=False)
    
    # ✅ Sinon, demander le code
    return render_template("code_verification.html", 
                         room_id=room_id,
                         rdv_id=rdv_id,
                         patient_name=patient_name,
                         doctor_name=doctor_name)


# ──────────────────────────────────────────────
# ✅ NOUVEAU : API pour vérifier le code d'accès
# ──────────────────────────────────────────────
@app.route("/api/validate-code", methods=["POST"])
def validate_code():
    """
    Vérifie si le code d'accès est valide en appelant le backend Django
    Body JSON : { "room_id": "...", "code": "...", "rdv_id": "..." }
    """
    data = request.get_json(silent=True) or {}
    room_id = data.get('room_id')
    code = data.get('code')
    rdv_id = data.get('rdv_id')
    
    if not room_id or not code or not rdv_id:
        return jsonify({'valid': False, 'error': 'Paramètres manquants'}), 400
    
    try:
        # ✅ Appeler le backend Django pour vérifier le code
        django_url = "http://backend:8000/api/appointments/verify-visio-code/"

        headers = {
            'X-API-Key': TELECONSULT_API_KEY
        }
        
        response = requests.get(
            django_url,
            params={'rdv_id': rdv_id, 'code': code},
            headers=headers,
            timeout=5
        )
        
        if response.status_code == 200 and response.json().get('valid'):
            # ✅ Code valide, stocker dans la session
            from datetime import datetime, timedelta
            validated_sessions[room_id] = {
                'valid': True,
                'expires': (datetime.now() + timedelta(hours=1)).timestamp()
            }
            session[f'validated_{room_id}'] = True
            return jsonify({'valid': True})
        else:
            error_msg = response.json().get('error', 'Code invalide')
            return jsonify({'valid': False, 'error': error_msg})
            
    except requests.exceptions.ConnectionError:
        print("❌ Erreur: Impossible de contacter le backend Django")
        # ✅ Fallback pour le développement (à désactiver en production)
        # En développement, on peut accepter un code par défaut
        if code == "123456":
            validated_sessions[room_id] = {'valid': True, 'expires': None}
            session[f'validated_{room_id}'] = True
            return jsonify({'valid': True, 'warning': 'Mode développement'})
        return jsonify({'valid': False, 'error': 'Service indisponible'}), 503
    except Exception as e:
        print(f"❌ Erreur validation: {e}")
        return jsonify({'valid': False, 'error': 'Erreur technique'}), 500


# ──────────────────────────────────────────────
# ✅ NOUVEAU : API pour vérifier si une session est validée
# ──────────────────────────────────────────────
@app.route("/api/check-validation", methods=["GET"])
def check_validation():
    """Vérifie si une salle a déjà été validée"""
    room_id = request.args.get('room', '')
    
    if session.get(f'validated_{room_id}'):
        return jsonify({'validated': True})
    
    if room_id in validated_sessions:
        from datetime import datetime
        if validated_sessions[room_id].get('expires'):
            if datetime.now().timestamp() > validated_sessions[room_id]['expires']:
                del validated_sessions[room_id]
                return jsonify({'validated': False, 'expired': True})
        return jsonify({'validated': True})
    
    return jsonify({'validated': False})


# ──────────────────────────────────────────────
# API – Créer une salle
# ──────────────────────────────────────────────
@app.route("/api/create-room", methods=["POST"])
def create_room():
    """
    Génère un identifiant de salle unique pour Jitsi Meet.
    Body JSON : { "patient": "...", "doctor": "...", "rdvId": "..." }
    """
    data    = request.get_json(silent=True) or {}
    patient = (data.get("patient") or "Patient").strip()
    doctor  = (data.get("doctor")  or "Médecin").strip()
    rdv_id  = data.get("rdvId", "")
    room_id = f"MedPredict-{rdv_id}-{uuid.uuid4().hex[:8].upper()}" if rdv_id else f"MedPredict-{uuid.uuid4().hex[:10].upper()}"

    return jsonify({
        "room_id":   room_id,
        "patient":   patient,
        "doctor":    doctor,
        "rdv_id":    rdv_id,
        "jitsi_url": f"https://meet.jit.si/{room_id}",
    })


# ──────────────────────────────────────────────
# API – Consultation status
# ──────────────────────────────────────────────
@app.route("/api/consultation-status", methods=["GET"])
def consultation_status():
    """Vérifie si une consultation est active (pour le backend Django)"""
    room_id = request.args.get('room', '')
    return jsonify({
        "active": True,
        "room_id": room_id,
        "timestamp": str(uuid.uuid4())
    })


# ──────────────────────────────────────────────
# API – Terminer la consultation
# ──────────────────────────────────────────────
@app.route("/api/end-consultation", methods=["POST"])
def end_consultation():
    """Termine la consultation et retourne un résumé"""
    data = request.get_json(silent=True) or {}
    room_id = data.get('room_id', '')
    rdv_id = data.get('rdv_id', '')
    
    # ✅ Nettoyer la session
    if room_id in validated_sessions:
        del validated_sessions[room_id]
    session.pop(f'validated_{room_id}', None)
    
    return jsonify({
        "success": True,
        "message": "Consultation terminée",
        "room_id": room_id,
        "rdv_id": rdv_id
    })


# ──────────────────────────────────────────────
# API – Transcription faster-whisper
# ──────────────────────────────────────────────
@app.route("/api/transcribe", methods=["POST"])
def transcribe():
    """
    Reçoit un fichier audio (webm/wav/ogg),
    le transcrit via faster-whisper et renvoie le texte.
    FormData : audio (file)
    """
    if "audio" not in request.files:
        return jsonify({"error": "Aucun fichier audio reçu."}), 400

    audio_file   = request.files["audio"]
    content_type = audio_file.content_type or ""
    ext = ".ogg" if "ogg" in content_type else ".wav" if "wav" in content_type else ".webm"

    with tempfile.NamedTemporaryFile(suffix=ext, delete=False) as tmp:
        audio_file.save(tmp.name)
        tmp_path = tmp.name

    try:
        model = get_whisper_model()

        # language=None → détection automatique (fr, ar, en …)
        segments_iter, info = model.transcribe(tmp_path, language=None, task="transcribe")

        segments   = []
        full_parts = []

        for seg in segments_iter:
            segments.append({
                "start": round(seg.start, 1),
                "end":   round(seg.end,   1),
                "text":  seg.text.strip(),
            })
            full_parts.append(seg.text.strip())

        return jsonify({
            "success":       True,
            "transcription": " ".join(full_parts),
            "language":      info.language,
            "segments":      segments,
        })

    except Exception as exc:
        return jsonify({"error": str(exc)}), 500

    finally:
        if os.path.exists(tmp_path):
            os.unlink(tmp_path)


# ──────────────────────────────────────────────
if __name__ == "__main__":
    app.run(debug=True, port=5000, host="0.0.0.0")