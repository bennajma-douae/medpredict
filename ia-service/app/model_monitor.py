"""
model_monitor.py
----------------
Expose les métriques et statistiques du modèle pour le dashboard médecin.
Lit depuis metadata.json (généré à l'entraînement) + compteurs runtime.
"""

import json
import logging
from datetime import datetime
from pathlib import Path
from collections import defaultdict
from threading import Lock

log = logging.getLogger(__name__)

BASE_DIR      = Path(__file__).parent.parent
METADATA_PATH = BASE_DIR / "models" / "metadata.json"


class ModelMonitor:
    """
    Collecte les métriques runtime (appels, maladies prédites, symptômes fréquents)
    et les combine avec les métriques statiques du fichier metadata.json.
    Thread-safe via Lock.
    """

    _instance = None

    def __init__(self):
        self._lock               = Lock()
        self._call_count         = 0
        self._disease_counter    = defaultdict(int)
        self._symptom_counter    = defaultdict(int)
        self._response_times_ms  = []
        self._errors             = 0
        self._session_start      = datetime.now().isoformat()

    @classmethod
    def get(cls) -> "ModelMonitor":
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    # ─── Enregistrement des appels (appelé depuis routes.py) ───────────────────

    def record_prediction(self, symptoms: list[str], top_disease: str, response_ms: float):
        with self._lock:
            self._call_count += 1
            self._disease_counter[top_disease] += 1
            for s in symptoms:
                self._symptom_counter[s] += 1
            self._response_times_ms.append(response_ms)
            # Garder seulement les 1000 derniers temps de réponse
            if len(self._response_times_ms) > 1000:
                self._response_times_ms = self._response_times_ms[-1000:]

    def record_error(self):
        with self._lock:
            self._errors += 1

    # ─── Statistiques complètes pour le dashboard ──────────────────────────────

    def get_stats(self) -> dict:
        # Charger les métadonnées statiques du modèle
        static = {}
        if METADATA_PATH.exists():
            with open(METADATA_PATH, encoding="utf-8") as f:
                static = json.load(f)

        with self._lock:
            call_count  = self._call_count
            errors      = self._errors
            times       = list(self._response_times_ms)
            disease_counts = dict(self._disease_counter)
            symptom_counts = dict(self._symptom_counter)

        # Calculs des temps de réponse
        avg_ms  = round(sum(times) / len(times), 1) if times else 0
        max_ms  = round(max(times), 1) if times else 0
        min_ms  = round(min(times), 1) if times else 0

        # Top maladies prédites (session runtime)
        top_diseases = sorted(
            disease_counts.items(), key=lambda x: x[1], reverse=True
        )[:10]

        # Top symptômes saisis (session runtime)
        top_symptoms = sorted(
            symptom_counts.items(), key=lambda x: x[1], reverse=True
        )[:10]

        return {
            # ── Infos modèle ────────────────────────────────────────────────────
            "model": {
                "type":           static.get("model_type", "RandomForestClassifier"),
                "trained_at":     static.get("trained_at"),
                "n_estimators":   static.get("n_estimators"),
                "n_diseases":     static.get("n_diseases"),
                "n_symptoms":     static.get("n_symptoms"),
                "n_train_samples": static.get("n_samples"),
            },

            # ── Performances ────────────────────────────────────────────────────
            "performance": {
                "test_accuracy":     static.get("test_accuracy"),
                "cv_mean_accuracy":  static.get("cv_mean_accuracy"),
                "cv_std":            static.get("cv_std"),
                "cv_scores":         static.get("cv_scores", []),
            },

            # ── Feature importance top 20 ────────────────────────────────────────
            "feature_importance": static.get("feature_importance_top20", []),

            # ── Matrice de confusion (encodée pour le frontend) ──────────────────
            "confusion_matrix": {
                "matrix":  static.get("confusion_matrix", []),
                "labels":  static.get("disease_classes", []),
            },

            # ── Statistiques runtime (session courante) ──────────────────────────
            "runtime": {
                "session_start":      self._session_start,
                "total_predictions":  call_count,
                "total_errors":       errors,
                "error_rate":         round(errors / max(call_count, 1), 4),
                "avg_response_ms":    avg_ms,
                "min_response_ms":    min_ms,
                "max_response_ms":    max_ms,
                "top_diseases_predicted": [
                    {"disease": d, "count": c} for d, c in top_diseases
                ],
                "top_symptoms_entered": [
                    {"symptom": s, "count": c} for s, c in top_symptoms
                ],
            },

            # ── Health status ────────────────────────────────────────────────────
            "health": _compute_health(
                accuracy=static.get("test_accuracy", 0),
                avg_ms=avg_ms,
                error_rate=errors / max(call_count, 1),
            ),
        }


def _compute_health(accuracy: float, avg_ms: float, error_rate: float) -> dict:
    """Calcule un statut de santé global du modèle."""
    issues = []

    if accuracy < 0.80:
        issues.append({"level": "warning", "msg": f"Précision basse : {accuracy*100:.1f}%"})
    if avg_ms > 1500:
        issues.append({"level": "warning", "msg": f"Temps de réponse élevé : {avg_ms}ms"})
    if error_rate > 0.05:
        issues.append({"level": "error", "msg": f"Taux d'erreur élevé : {error_rate*100:.1f}%"})

    if not issues:
        status = "healthy"
        color  = "green"
    elif any(i["level"] == "error" for i in issues):
        status = "degraded"
        color  = "red"
    else:
        status = "warning"
        color  = "amber"

    return {
        "status": status,
        "color":  color,
        "issues": issues,
        "checked_at": datetime.now().isoformat(),
    }
