"""
trainer.py
----------
Entraîne un RandomForest sur dataset symptom/disease.
Version médicale réaliste — 29 maladies, symptômes cohérents par système.
"""

import json
import argparse
import logging
from datetime import datetime
from pathlib import Path

import numpy as np
import pandas as pd
import joblib

from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix


# ─── LOG ─────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
log = logging.getLogger(__name__)


# ─── PATHS ───────────────────────────────────────────────────────────
BASE_DIR    = Path(__file__).parent
DATA_DIR    = BASE_DIR / "data"
MODELS_DIR  = BASE_DIR / "models"
MODELS_DIR.mkdir(exist_ok=True)

DATASET_PATH  = DATA_DIR / "dataset.csv"
MODEL_PATH    = MODELS_DIR / "model.pkl"
ENCODER_PATH  = MODELS_DIR / "label_encoder.pkl"
METADATA_PATH = MODELS_DIR / "metadata.json"


# ─── LOAD DATASET ────────────────────────────────────────────────────
def load_and_clean(path: Path) -> pd.DataFrame:
    log.info(f"Chargement dataset : {path}")
    df = pd.read_csv(path)
    df.columns = df.columns.str.strip()

    # Détection flexible de la colonne cible
    disease_col = None
    for candidate in ["Disease", "Prognosis", "disease", "prognosis", "maladie"]:
        if candidate in df.columns:
            disease_col = candidate
            break

    if not disease_col:
        raise ValueError("Colonne Disease/maladie introuvable dans le CSV")

    df = df.drop_duplicates()
    df = df.dropna(subset=[disease_col])
    df = df.rename(columns={disease_col: "Disease"})

    log.info(f"Dataset: {len(df)} lignes | {df['Disease'].nunique()} maladies")
    return df


# ─── ENCODING ────────────────────────────────────────────────────────
def encode_symptoms(df: pd.DataFrame):
    """
    Supporte deux formats CSV :
      - Format liste  → colonnes Symptom_1 … Symptom_N (valeurs texte / NaN)
      - Format one-hot → colonnes binaires (0/1), pas de Disease
    """
    symptom_cols = [c for c in df.columns if c.lower().startswith("symptom")]

    if symptom_cols:
        # ── Format liste (Symptom_1 … Symptom_N) ──
        all_symptoms: set[str] = set()
        for col in symptom_cols:
            vals = (
                df[col]
                .dropna()
                .astype(str)
                .str.strip()
                .str.lower()
                .unique()
            )
            all_symptoms.update(vals)
        all_symptoms.discard("")
        symptom_list = sorted(all_symptoms)
        log.info(f"Symptômes uniques: {len(symptom_list)}")

        X_rows = []
        for _, row in df.iterrows():
            sset = {
                str(row[c]).strip().lower()
                for c in symptom_cols
                if pd.notna(row[c])
            }
            X_rows.append({s: int(s in sset) for s in symptom_list})
        X = pd.DataFrame(X_rows)

    else:
        # ── Format one-hot (colonnes binaires) ──
        symptom_list = [c for c in df.columns if c != "Disease"]
        log.info(f"Symptômes uniques: {len(symptom_list)}")
        X = df[symptom_list].astype(int)

    le = LabelEncoder()
    y = le.fit_transform(df["Disease"].astype(str).str.strip())

    return X, y, symptom_list, le


# ─── TRAIN ───────────────────────────────────────────────────────────
def train(X, y, symptom_list, le):
    log.info("Train/test split...")

    min_class = int(pd.Series(y).value_counts().min())
    use_stratify = min_class > 1

    X_train, X_test, y_train, y_test = train_test_split(
        X, y,
        test_size=0.2,
        random_state=42,
        stratify=y if use_stratify else None,
    )

    model = RandomForestClassifier(
        n_estimators=300,
        random_state=42,
        class_weight="balanced",
        n_jobs=-1,
    )

    log.info("Training model...")
    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)
    acc    = accuracy_score(y_test, y_pred)
    log.info(f"Accuracy: {acc:.4f}")

    cv = cross_val_score(model, X, y, cv=5, scoring="accuracy", n_jobs=-1)
    log.info(f"Cross-validation (5-fold): {cv.mean():.4f} ± {cv.std():.4f}")

    # ── Rapport détaillé ──────────────────────────────────────────────
    labels = np.unique(y)
    report = classification_report(
        y_test, y_pred,
        labels=labels,
        target_names=le.classes_[labels],
        output_dict=True,
        zero_division=0,
    )
    cm = confusion_matrix(y_test, y_pred)

    log.info("\nTop maladies (precision / recall / f1) :")
    sorted_diseases = sorted(
        [(k, v) for k, v in report.items() if isinstance(v, dict)],
        key=lambda x: x[1]["f1-score"],
        reverse=True,
    )
    for disease, metrics in sorted_diseases[:10]:
        log.info(
            f"  {disease:<35} "
            f"precision={metrics['precision']:.2f}  "
            f"recall={metrics['recall']:.2f}  "
            f"f1={metrics['f1-score']:.2f}"
        )

    # ── Sauvegarde ────────────────────────────────────────────────────
    joblib.dump(model, MODEL_PATH)
    joblib.dump(le,    ENCODER_PATH)
    log.info(f"Modèle      → {MODEL_PATH}")
    log.info(f"Encoder     → {ENCODER_PATH}")

    metadata = {
        "trained_at":            datetime.now().isoformat(),
        "n_symptoms":            len(symptom_list),
        "n_diseases":            len(le.classes_),
        "test_accuracy":         float(acc),
        "cv_mean":               float(cv.mean()),
        "cv_std":                float(cv.std()),
        "symptom_list":          symptom_list,
        "diseases":              list(le.classes_),
        "classification_report": report,
        "confusion_matrix":      cm.tolist(),
    }

    with open(METADATA_PATH, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2, ensure_ascii=False)
    log.info(f"Métadonnées → {METADATA_PATH}")

    return metadata


# ─── MAIN ─────────────────────────────────────────────────────────────
def main():
    parser = argparse.ArgumentParser(description="Train medical symptom classifier")
    parser.add_argument("--dataset", default=str(DATASET_PATH),
                        help="Chemin vers le CSV dataset")
    args = parser.parse_args()

    df                        = load_and_clean(Path(args.dataset))
    X, y, symptom_list, le   = encode_symptoms(df)
    metadata                  = train(X, y, symptom_list, le)

    print(f"\n✔ DONE  Accuracy: {metadata['test_accuracy']:.5f}  "
          f"({metadata['test_accuracy']*100:.1f}%)")


if __name__ == "__main__":
    main()