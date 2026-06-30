"""
app/routes.py
"""

import logging
import uuid
import subprocess
from pathlib import Path
from flask import Blueprint, jsonify, request, send_from_directory, abort

from .predictor import Predictor

# ── PDF IMPORT FIX (Windows + Flask safe) ──
import sys
from pathlib import Path
import logging

log = logging.getLogger(__name__)

BASE_DIR = Path(__file__).resolve().parent
if str(BASE_DIR) not in sys.path:
    sys.path.append(str(BASE_DIR))

try:
    from pdf_report import generate_report
    log.info("PDF MODULE CHARGÉ ✔")
except Exception as e:
    generate_report = None
    log.warning(f"Aucun module PDF chargé : {e}")
# ─────────────────────────────────────────────
# FLASK SETUP
# ─────────────────────────────────────────────
bp = Blueprint("medpredict", __name__)

REPORTS_DIR = Path("reports")
REPORTS_DIR.mkdir(exist_ok=True)

# ─────────────────────────────────────────────
# PREDICT ENDPOINT
# ─────────────────────────────────────────────
@bp.route("/predict", methods=["POST"])
def predict():
    data = request.get_json(silent=True) or {}

    symptoms        = data.get("symptoms", [])
    top_n           = int(data.get("top_n", 3))
    sex             = data.get("sex") or None
    medical_history = data.get("medical_history") or []
    age_raw         = data.get("age")
    age             = int(age_raw) if age_raw is not None else None

    if not isinstance(symptoms, list) or len(symptoms) == 0:
        return jsonify({"success": False, "error": "Symptômes invalides"}), 400

    if sex and sex not in ("M", "F"):
        return jsonify({"success": False, "error": "sex doit être M ou F"}), 400

    predictor = Predictor.get()
    if not predictor.is_ready():
        return jsonify({"success": False, "error": "Modèle non chargé"}), 503

    try:
        result = predictor.predict(
            symptoms=symptoms,
            top_n=top_n,
            sex=sex,
            medical_history=medical_history,
            age=age,
        )
        return jsonify({"success": True, **result})

    except Exception as e:
        log.exception("Erreur /predict")
        return jsonify({"success": False, "error": str(e)}), 500


# ─────────────────────────────────────────────
# FINALIZE (PDF)
# ─────────────────────────────────────────────
@bp.route("/finalize", methods=["POST"])
def finalize():

    if not callable(generate_report):
        return jsonify({"success": False, "error": "Module PDF non disponible"}), 503

    data = request.get_json(silent=True) or {}

    patient          = data.get("patient", {})
    selected_disease = data.get("selected_disease", "")
    symptoms         = data.get("symptoms", [])
    doctor_notes     = data.get("notes", "")
    medications      = data.get("medications", [])
    ai_result        = data.get("ai_result")
    clinic_info      = data.get("clinic_info")

    exclude_ai       = bool(data.get("exclude_ai", False))

    if not selected_disease:
        return jsonify({"success": False, "error": "Aucun diagnostic sélectionné"}), 400

    # fallback IA
    if not ai_result:
        predictor = Predictor.get()
        if predictor.is_ready():
            try:
                ai_result = predictor.predict(
                    symptoms=symptoms,
                    sex=patient.get("gender"),
                    medical_history=patient.get("medical_history", []),
                )
            except Exception:
                pass

    consult_id = str(uuid.uuid4())[:8].upper()

    try:
        import inspect
        sig = inspect.signature(generate_report)

        if "medications" in sig.parameters:
            kwargs = {
                "patient": patient,
                "selected_disease": selected_disease,
                "symptoms": symptoms,
                "ai_result": ai_result,
                "consult_id": consult_id,
                "doctor_notes": doctor_notes,
                "medications": medications,
            }
            if "exclude_ai" in sig.parameters:
                kwargs["exclude_ai"] = exclude_ai
            if "clinic_info" in sig.parameters and clinic_info:
                kwargs["clinic_info"] = clinic_info
            pdf_path = generate_report(**kwargs)
        else:
            pdf_path = generate_report(
                patient,
                selected_disease,
                doctor_notes or "Analyse IA MedPredict",
                symptoms,
                consult_id,
            )

        filename = Path(pdf_path).name

        return jsonify({
            "success": True,
            "report_url": f"/reports/{filename}",
            "consult_id": consult_id
        })

    except Exception as e:
        log.exception("Erreur /finalize")
        return jsonify({"success": False, "error": str(e)}), 500


# ─────────────────────────────────────────────
# SERVE PDF FILES
# ─────────────────────────────────────────────
@bp.route("/reports/<path:filename>")
def serve_report(filename):
    path = REPORTS_DIR.resolve()

    if not (path / filename).exists():
        abort(404)

    return send_from_directory(str(path), filename)


# ─────────────────────────────────────────────
# HEALTH
# ─────────────────────────────────────────────
@bp.route("/health", methods=["GET"])
def health():
    predictor = Predictor.get()
    meta = predictor.metadata if predictor.is_ready() else {}

    return jsonify({
        "status": "ok" if predictor.is_ready() else "degraded",
        "model_ready": predictor.is_ready(),
        "n_diseases": meta.get("n_diseases"),
        "n_symptoms": meta.get("n_symptoms"),
        "accuracy": meta.get("test_accuracy"),
        "trained_at": meta.get("trained_at"),
    })


# ─────────────────────────────────────────────
# SYMPTOMS
# ─────────────────────────────────────────────
@bp.route("/symptoms", methods=["GET"])
def symptoms():
    predictor = Predictor.get()

    if not predictor.is_ready():
        return jsonify({"success": False, "error": "Modèle non chargé"}), 503

    return jsonify({
        "success": True,
        "symptoms": predictor.get_symptom_list(),
        "count": len(predictor.get_symptom_list())
    })


@bp.route("/symptoms/search", methods=["GET"])
def symptoms_search():
    q = request.args.get("q", "").strip()
    predictor = Predictor.get()

    if not predictor.is_ready():
        return jsonify({"success": False, "error": "Modèle non chargé"}), 503

    return jsonify({
        "success": True,
        "query": q,
        "results": predictor.search_symptoms(q)
    })


# ─────────────────────────────────────────────
# MODEL STATS
# ─────────────────────────────────────────────
@bp.route("/model/stats", methods=["GET"])
def model_stats():
    predictor = Predictor.get()

    if not predictor.is_ready():
        return jsonify({"success": False, "error": "Modèle non chargé"}), 503

    meta = predictor.metadata

    return jsonify({
        "success": True,
        "trained_at": meta.get("trained_at"),
        "n_diseases": meta.get("n_diseases"),
        "n_symptoms": meta.get("n_symptoms"),
        "accuracy": meta.get("test_accuracy"),
        "cv_mean": meta.get("cv_mean"),
        "cv_std": meta.get("cv_std"),
        "diseases": meta.get("diseases", [])
    })


# ─────────────────────────────────────────────
# RETRAIN
# ─────────────────────────────────────────────
@bp.route("/model/retrain", methods=["POST"])
def retrain():
    try:
        result = subprocess.run(
            ["python", "trainer.py"],
            capture_output=True,
            text=True,
            timeout=300
        )

        if result.returncode != 0:
            return jsonify({
                "success": False,
                "error": result.stderr[-500:]
            }), 500

        Predictor._instance = None
        Predictor.get()

        return jsonify({
            "success": True,
            "message": "Modèle réentraîné",
            "log": result.stdout[-1000:]
        })

    except subprocess.TimeoutExpired:
        return jsonify({"success": False, "error": "Timeout"}), 504

    except Exception as e:
        log.exception("Erreur retrain")
        return jsonify({"success": False, "error": str(e)}), 500