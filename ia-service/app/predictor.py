"""
predictor.py
------------
Charge le modèle entraîné et expose la logique d'inférence.
Retourne les top-N maladies UNIQUES avec score de confiance + traitement suggéré.

Amélioration : prise en compte du SEXE et des ANTÉCÉDENTS médicaux
via un post-traitement des probabilités (sans modifier le dataset).
"""

import json
import logging
from pathlib import Path
from typing import Optional

import joblib
import numpy as np

log = logging.getLogger(__name__)

BASE_DIR        = Path(__file__).parent.parent
MODELS_DIR      = BASE_DIR / "models"
DATA_DIR        = BASE_DIR / "data"

MODEL_PATH      = MODELS_DIR / "model.pkl"
ENCODER_PATH    = MODELS_DIR / "label_encoder.pkl"
METADATA_PATH   = MODELS_DIR / "metadata.json"
TREATMENTS_PATH = DATA_DIR   / "treatments.json"
DISEASE_PROFILE_PATH = DATA_DIR / "disease_profiles.json"

# Seuil minimal de confiance pour qu'une prédiction soit retournée
MIN_CONFIDENCE = 0.02

# ─── Profils épidémiologiques par défaut ──────────────────────────────────────
# Ces profils encodent des connaissances médicales : prévalence par sexe
# et contre-indications selon les antécédents. Ils servent à ré-pondérer
# les probabilités brutes du RandomForest SANS toucher au dataset.
#
# Structure par maladie :
#   "sex_bias"      : { "M": float, "F": float }  — multiplicateurs (1.0 = neutre)
#   "contraindicated_if": ["maladie_antecedent", ...]  — maladies incompatibles
#   "boosted_if"    : ["maladie_antecedent", ...]  — maladies qui augmentent la proba
#
DEFAULT_DISEASE_PROFILES = {
    "Malaria": {
        "sex_bias": {"M": 1.0, "F": 1.0},
        "contraindicated_if": [],
        "boosted_if": []
    },
    "Dengue": {
        "sex_bias": {"M": 1.0, "F": 1.0},
        "contraindicated_if": [],
        "boosted_if": []
    },
    "Tuberculosis": {
        "sex_bias": {"M": 1.3, "F": 0.85},
        "contraindicated_if": [],
        "boosted_if": ["HIV/AIDS", "Diabetes"]
    },
    "Diabetes": {
        "sex_bias": {"M": 1.1, "F": 1.0},
        "contraindicated_if": [],
        "boosted_if": ["Hypertension", "Obesity"]
    },
    "Hypertension": {
        "sex_bias": {"M": 1.2, "F": 0.9},
        "contraindicated_if": [],
        "boosted_if": ["Diabetes", "Obesity", "Chronic kidney disease"]
    },
    "Heart attack": {
        "sex_bias": {"M": 1.5, "F": 0.7},
        "contraindicated_if": [],
        "boosted_if": ["Hypertension", "Diabetes", "Atherosclerosis"]
    },
    "Breast cancer": {
        "sex_bias": {"M": 0.05, "F": 2.0},
        "contraindicated_if": [],
        "boosted_if": []
    },
    "Prostate cancer": {
        "sex_bias": {"M": 2.0, "F": 0.0},
        "contraindicated_if": [],
        "boosted_if": []
    },
    "Cervical spondylosis": {
        "sex_bias": {"M": 1.1, "F": 1.0},
        "contraindicated_if": [],
        "boosted_if": []
    },
    "GERD": {
        "sex_bias": {"M": 1.2, "F": 0.9},
        "contraindicated_if": [],
        "boosted_if": []
    },
    "Pneumonia": {
        "sex_bias": {"M": 1.1, "F": 1.0},
        "contraindicated_if": [],
        "boosted_if": ["Asthma", "COPD", "HIV/AIDS"]
    },
    "Asthma": {
        "sex_bias": {"M": 0.9, "F": 1.1},
        "contraindicated_if": [],
        "boosted_if": []
    },
    "COPD": {
        "sex_bias": {"M": 1.3, "F": 0.8},
        "contraindicated_if": [],
        "boosted_if": ["Asthma"]
    },
    "Migraine": {
        "sex_bias": {"M": 0.6, "F": 1.5},
        "contraindicated_if": [],
        "boosted_if": []
    },
    "Urinary tract infection": {
        "sex_bias": {"M": 0.3, "F": 1.8},
        "contraindicated_if": [],
        "boosted_if": ["Diabetes"]
    },
    "Kidney stones": {
        "sex_bias": {"M": 1.5, "F": 0.6},
        "contraindicated_if": [],
        "boosted_if": ["Hypertension", "Diabetes"]
    },
    "Hypothyroidism": {
        "sex_bias": {"M": 0.4, "F": 1.7},
        "contraindicated_if": [],
        "boosted_if": []
    },
    "Hyperthyroidism": {
        "sex_bias": {"M": 0.3, "F": 1.8},
        "contraindicated_if": [],
        "boosted_if": []
    },
    "HIV/AIDS": {
        "sex_bias": {"M": 1.2, "F": 0.9},
        "contraindicated_if": [],
        "boosted_if": []
    },
    "Hepatitis B": {
        "sex_bias": {"M": 1.3, "F": 0.8},
        "contraindicated_if": [],
        "boosted_if": []
    },
    "Hepatitis C": {
        "sex_bias": {"M": 1.3, "F": 0.8},
        "contraindicated_if": [],
        "boosted_if": []
    },
    "Liver cirrhosis": {
        "sex_bias": {"M": 1.5, "F": 0.7},
        "contraindicated_if": [],
        "boosted_if": ["Hepatitis B", "Hepatitis C", "Alcoholism"]
    },
    "Chronic kidney disease": {
        "sex_bias": {"M": 1.2, "F": 0.9},
        "contraindicated_if": [],
        "boosted_if": ["Diabetes", "Hypertension"]
    },
    "Gastroenteritis": {
        "sex_bias": {"M": 1.0, "F": 1.0},
        "contraindicated_if": [],
        "boosted_if": []
    },
    "Appendicitis": {
        "sex_bias": {"M": 1.2, "F": 0.9},
        "contraindicated_if": [],
        "boosted_if": []
    },
    "Anemia": {
        "sex_bias": {"M": 0.6, "F": 1.5},
        "contraindicated_if": [],
        "boosted_if": []
    },
    "Arthritis": {
        "sex_bias": {"M": 0.8, "F": 1.3},
        "contraindicated_if": [],
        "boosted_if": []
    },
    "Peptic ulcer": {
        "sex_bias": {"M": 1.3, "F": 0.8},
        "contraindicated_if": [],
        "boosted_if": []
    },
    "Common Cold": {
        "sex_bias": {"M": 1.0, "F": 1.0},
        "contraindicated_if": [],
        "boosted_if": []
    },
    "Typhoid": {
        "sex_bias": {"M": 1.0, "F": 1.0},
        "contraindicated_if": [],
        "boosted_if": []
    },
    "Varicella": {
        "sex_bias": {"M": 1.0, "F": 1.0},
        "contraindicated_if": [],
        "boosted_if": []
    },
}

# Facteur max de boost/pénalité pour les antécédents
ANTECEDENT_BOOST   = 1.35   # +35 % si maladie liée à un antécédent
ANTECEDENT_PENALTY = 0.60   # -40 % si maladie incompatible avec un antécédent


class Predictor:
    """
    Singleton chargé une seule fois au démarrage du service.
    Toutes les requêtes de prédiction passent par cette instance.
    """

    _instance: Optional["Predictor"] = None

    def __init__(self):
        self.model          = None
        self.label_encoder  = None
        self.symptom_list   = []
        self.metadata       = {}
        self.treatments     = {}
        self.disease_profiles: dict = {}
        self._loaded        = False

    @classmethod
    def get(cls) -> "Predictor":
        if cls._instance is None:
            cls._instance = cls()
            cls._instance._load()
        return cls._instance

    # ─── Chargement ────────────────────────────────────────────────────────────

    def _load(self):
        if not MODEL_PATH.exists():
            log.warning("Modèle non trouvé. Lance d'abord : python trainer.py")
            return

        log.info("Chargement du modèle RandomForest...")
        self.model         = joblib.load(MODEL_PATH)
        self.label_encoder = joblib.load(ENCODER_PATH)

        with open(METADATA_PATH, encoding="utf-8") as f:
            self.metadata = json.load(f)

        self.symptom_list = self.metadata.get("symptom_list", [])

        if TREATMENTS_PATH.exists():
            with open(TREATMENTS_PATH, encoding="utf-8") as f:
                self.treatments = json.load(f)

        # Chargement des profils épidémiologiques (fichier optionnel)
        if DISEASE_PROFILE_PATH.exists():
            with open(DISEASE_PROFILE_PATH, encoding="utf-8") as f:
                self.disease_profiles = json.load(f)
            log.info("Profils épidémiologiques chargés depuis disease_profiles.json")
        else:
            self.disease_profiles = DEFAULT_DISEASE_PROFILES
            log.info("Profils épidémiologiques par défaut utilisés (disease_profiles.json absent)")

        self._loaded = True
        log.info(
            f"Modèle chargé — {self.metadata.get('n_diseases')} maladies, "
            f"{self.metadata.get('n_symptoms')} symptômes, "
            f"précision : {self.metadata.get('test_accuracy', 0) * 100:.1f}%"
        )

    def is_ready(self) -> bool:
        return self._loaded and self.model is not None

    # ─── Encodage d'une liste de symptômes ─────────────────────────────────────

    def _encode(self, symptoms: list[str]) -> np.ndarray:
        """Encode une liste de symptômes en vecteur binaire (one-hot)."""
        normalized = {s.strip().lower().replace(" ", "_") for s in symptoms}
        vector = np.array(
            [1 if s in normalized else 0 for s in self.symptom_list],
            dtype=np.float32,
        ).reshape(1, -1)
        return vector

    # ─── Déduplication des probabilités ────────────────────────────────────────

    def _deduplicate_proba(self, probabilities: np.ndarray) -> dict[str, float]:
        """
        Agrège les probabilités par nom de maladie unique.
        Si une maladie apparaît plusieurs fois dans les classes du label encoder,
        on garde le score MAX pour chaque maladie.
        """
        best: dict[str, float] = {}
        for idx, prob in enumerate(probabilities):
            name = self.label_encoder.classes_[idx]
            if name not in best or prob > best[name]:
                best[name] = float(prob)
        return best

    # ─── Post-traitement : biais démographique + antécédents ───────────────────

    def _apply_clinical_context(
        self,
        unique_scores: dict[str, float],
        sex: str | None,
        medical_history: list[str],
    ) -> dict[str, float]:
        """
        Ré-pondère les probabilités brutes du modèle en tenant compte :
          - du sexe du patient (biais épidémiologique)
          - de ses antécédents médicaux (boost / pénalité)

        Cette approche est un POST-TRAITEMENT : le dataset et le modèle ne
        sont pas modifiés. On multiplie chaque score par des facteurs calibrés
        issus des profils épidémiologiques.

        Args:
            unique_scores   : { disease_name: raw_probability }
            sex             : "M", "F", ou None
            medical_history : liste de maladies connues du patient

        Returns:
            dict { disease_name: adjusted_probability }  (non normalisé)
        """
        history_normalized = {h.strip().lower() for h in medical_history}
        adjusted: dict[str, float] = {}

        for disease, score in unique_scores.items():
            profile = self.disease_profiles.get(disease, {})
            factor = 1.0

            # ── Biais par sexe ──
            if sex and profile.get("sex_bias"):
                sex_key = sex.upper()  # "M" ou "F"
                sex_factor = profile["sex_bias"].get(sex_key, 1.0)
                factor *= sex_factor

            # ── Boost si antécédent lié ──
            boosted_if = [b.lower() for b in profile.get("boosted_if", [])]
            if any(ant in history_normalized for ant in boosted_if):
                factor *= ANTECEDENT_BOOST

            # ── Pénalité si antécédent incompatible ──
            contra = [c.lower() for c in profile.get("contraindicated_if", [])]
            if any(ant in history_normalized for ant in contra):
                factor *= ANTECEDENT_PENALTY

            adjusted[disease] = score * factor

        # Renormalisation pour que les scores restent interprétables
        total = sum(adjusted.values())
        if total > 0:
            adjusted = {k: v / total for k, v in adjusted.items()}

        return adjusted

    # ─── Explication de la prédiction ──────────────────────────────────────────

    def _build_explanation(
        self,
        disease: str,
        raw_score: float,
        adjusted_score: float,
        sex: str | None,
        medical_history: list[str],
        recognized_symptoms: list[str],
    ) -> dict:
        """
        Génère une explication médicale lisible pour une prédiction.

        Returns:
            {
              "key_symptoms"      : [...],    # symptômes qui pèsent le plus
              "sex_influence"     : str,
              "history_influence" : str,
              "score_delta_pct"   : str,
            }
        """
        profile = self.disease_profiles.get(disease, {})
        history_normalized = {h.strip().lower() for h in medical_history}

        # ── Symptômes clés : on consulte l'importance des features du RF ──
        key_symptoms: list[str] = []
        try:
            importances = self.model.feature_importances_
            symptom_weights = {
                s: importances[i]
                for i, s in enumerate(self.symptom_list)
                if s in recognized_symptoms
            }
            key_symptoms = sorted(
                symptom_weights, key=symptom_weights.get, reverse=True
            )[:5]
        except Exception:
            key_symptoms = recognized_symptoms[:5]

        # ── Influence du sexe ──
        sex_influence = "Neutre (sexe non renseigné)"
        if sex and profile.get("sex_bias"):
            factor = profile["sex_bias"].get(sex.upper(), 1.0)
            if factor > 1.05:
                sex_influence = f"Prévalence plus élevée chez {'les hommes' if sex == 'M' else 'les femmes'} ({factor:.1f}×)"
            elif factor < 0.95:
                sex_influence = f"Prévalence plus faible chez {'les hommes' if sex == 'M' else 'les femmes'} ({factor:.1f}×)"
            else:
                sex_influence = "Pas de différence significative selon le sexe"

        # ── Influence des antécédents ──
        history_parts = []
        boosted_if = [b.lower() for b in profile.get("boosted_if", [])]
        contra     = [c.lower() for c in profile.get("contraindicated_if", [])]
        matched_boosts = [ant for ant in boosted_if if ant in history_normalized]
        matched_contras = [ant for ant in contra if ant in history_normalized]

        if matched_boosts:
            history_parts.append(f"Risque augmenté — antécédents liés : {', '.join(matched_boosts)}")
        if matched_contras:
            history_parts.append(f"Moins probable — antécédents incompatibles : {', '.join(matched_contras)}")
        history_influence = "; ".join(history_parts) if history_parts else "Aucun antécédent significatif"

        # ── Delta de score ──
        delta = (adjusted_score - raw_score) / (raw_score + 1e-9) * 100
        if abs(delta) < 1:
            delta_str = "Score non modifié par le contexte clinique"
        elif delta > 0:
            delta_str = f"Score ajusté +{delta:.0f}% par le contexte clinique"
        else:
            delta_str = f"Score ajusté {delta:.0f}% par le contexte clinique"

        return {
            "key_symptoms":      key_symptoms,
            "sex_influence":     sex_influence,
            "history_influence": history_influence,
            "score_delta_pct":   delta_str,
        }

    # ─── Prédiction principale ─────────────────────────────────────────────────

    def predict(
        self,
        symptoms: list[str],
        top_n: int = 3,
        sex: str | None = None,
        medical_history: list[str] | None = None,
        age: int | None = None,
    ) -> dict:
        """
        Prédit les top_n maladies UNIQUES les plus probables,
        avec contextualisation clinique (sexe, antécédents).

        Args:
            symptoms        : liste de symptômes (strings)
            top_n           : nombre de résultats à retourner (défaut : 3)
            sex             : "M" ou "F" (optionnel)
            medical_history : liste de maladies connues (optionnel)
            age             : âge du patient (optionnel, réservé pour extensions futures)

        Returns:
            {
              "predictions": [
                {
                  "rank"           : 1,
                  "disease"        : "Malaria",
                  "confidence"     : 0.87,
                  "confidence_pct" : "87.0%",
                  "raw_confidence" : 0.82,          # avant ajustement clinique
                  "explanation"    : { ... },
                  "treatment"      : { ... }
                },
                ...
              ],
              "patient_context"      : { "sex": ..., "medical_history": [...] },
              "symptoms_received"    : [...],
              "symptoms_recognized"  : [...],
              "symptoms_unknown"     : [...],
              "n_recognized"         : int,
              "model_accuracy"       : float,
              "model_trained_at"     : str,
              "disclaimer"           : str
            }
        """
        if not self.is_ready():
            raise RuntimeError(
                "Modèle non chargé. Vérifie que trainer.py a été exécuté."
            )

        if not symptoms:
            raise ValueError("La liste de symptômes ne peut pas être vide.")

        medical_history = medical_history or []

        # ── Identifier les symptômes reconnus vs inconnus ──
        normalized_input = {s.strip().lower().replace(" ", "_") for s in symptoms}
        recognized   = [s for s in self.symptom_list if s in normalized_input]
        unrecognized = sorted(normalized_input - set(self.symptom_list))

        if not recognized:
            raise ValueError(
                "Aucun symptôme reconnu par le modèle. "
                "Utilise /symptoms pour voir la liste complète."
            )

        # ── Encodage et prédiction brute ──
        X             = self._encode(symptoms)
        probabilities = self.model.predict_proba(X)[0]

        # ── Déduplication ──
        raw_scores = self._deduplicate_proba(probabilities)

        # ── Post-traitement clinique ──
        adjusted_scores = self._apply_clinical_context(
            raw_scores, sex, medical_history
        )

        # ── Tri décroissant + filtre seuil + top_n ──
        sorted_diseases = sorted(
            adjusted_scores.items(),
            key=lambda x: x[1],
            reverse=True,
        )

        predictions = []
        rank = 1
        for disease_name, confidence in sorted_diseases:
            if confidence < MIN_CONFIDENCE:
                break
            if rank > top_n:
                break

            raw_conf = raw_scores.get(disease_name, confidence)

            treatment = self.treatments.get(disease_name, {
                "medications": [],
                "advice": "Consultez un spécialiste pour un avis médical adapté.",
                "follow_up_days": None,
            })

            explanation = self._build_explanation(
                disease         = disease_name,
                raw_score       = raw_conf,
                adjusted_score  = confidence,
                sex             = sex,
                medical_history = medical_history,
                recognized_symptoms = recognized,
            )

            predictions.append({
                "rank":            rank,
                "disease":         disease_name,
                "confidence":      round(confidence, 4),
                "confidence_pct":  f"{confidence * 100:.1f}%",
                "raw_confidence":  round(raw_conf, 4),
                "explanation":     explanation,
                "treatment":       treatment,
            })
            rank += 1

        return {
            "predictions":          predictions,
            "patient_context":      {
                "sex":             sex,
                "medical_history": medical_history,
                "age":             age,
            },
            "symptoms_received":   list(symptoms),
            "symptoms_recognized": recognized,
            "symptoms_unknown":    unrecognized,
            "n_recognized":        len(recognized),
            "model_accuracy":      self.metadata.get("test_accuracy"),
            "model_trained_at":    self.metadata.get("trained_at"),
            "disclaimer": (
                "Outil d'aide au diagnostic — ne remplace pas le jugement clinique du médecin. "
                "Le médecin reste seul responsable du diagnostic et de la prescription."
            ),
        }

    # ─── Accès aux symptômes disponibles ───────────────────────────────────────

    def get_symptom_list(self) -> list[str]:
        return self.symptom_list

    def search_symptoms(self, query: str) -> list[str]:
        """Recherche de symptômes par correspondance partielle (autocomplétion)."""
        q = query.strip().lower()
        return [s for s in self.symptom_list if q in s][:20]