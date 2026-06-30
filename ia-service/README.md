# MedPredict — Microservice IA

Microservice Flask de classification symptômes → maladies.
RandomForest entraîné sur le dataset Disease-Symptom (Kaggle).

---

## Installation

```bash
cd ia-service
python -m venv venv

# Windows
venv\Scripts\activate

# Linux / macOS
source venv/bin/activate

pip install -r requirements.txt
```

---

## Dataset

Télécharge le dataset depuis Kaggle :
https://www.kaggle.com/datasets/itachi9604/disease-symptom-description-dataset

Copie le fichier `dataset.csv` dans `data/dataset.csv`.

---

## Entraînement du modèle

```bash
python trainer.py
```

Sortie attendue :
```
══════════════════════════════════════════════════
  Entraînement terminé
  Précision test  : 97.00%
  CV moyen        : 96.80%
  Maladies        : 41
  Symptômes       : 132
══════════════════════════════════════════════════
```

Fichiers générés dans `models/` :
- `model.pkl`         → modèle RandomForest sérialisé
- `label_encoder.pkl` → encodeur des noms de maladies
- `metadata.json`     → toutes les métriques et statistiques

---

## Lancement du serveur

```bash
python run.py
# ou en mode debug :
python run.py --debug --port 5001
```

---

## Endpoints

### POST /predict
```json
{
  "symptoms": ["fever", "headache", "vomiting", "nausea"],
  "top_n": 3
}
```

Réponse :
```json
{
  "success": true,
  "predictions": [
    {
      "rank": 1,
      "disease": "Malaria",
      "confidence": 0.8734,
      "confidence_pct": "87.3%",
      "treatment": {
        "medications": [
          {
            "name": "Arthémether-Luméfantrine",
            "dosage": "80/480mg",
            "frequency": "2x/jour",
            "duration": "3 jours"
          }
        ],
        "advice": "Confirmer par frottis sanguin / TDR.",
        "follow_up_days": 7
      }
    }
  ],
  "symptoms_recognized": ["fever", "headache", "vomiting"],
  "symptoms_unknown": ["nausea"],
  "disclaimer": "Outil d'aide au diagnostic — ne remplace pas le jugement clinique du médecin.",
  "response_time_ms": 45.2
}
```

### GET /health
```json
{
  "success": true,
  "service": "ia-service",
  "model_loaded": true,
  "health_status": "healthy",
  "model_accuracy": 0.97,
  "n_diseases": 41
}
```

### GET /symptoms
Retourne la liste complète des 132 symptômes reconnus.

### GET /symptoms/search?q=fev
Autocomplétion : retourne les symptômes contenant "fev".

### GET /model/stats
Métriques complètes pour le dashboard :
- Précision, cross-validation scores
- Feature importance top 20
- Matrice de confusion
- Statistiques runtime (appels, temps de réponse, maladies prédites)
- Health status

### POST /model/retrain
Relance l'entraînement en arrière-plan (dev uniquement).

---

## Structure

```
ia-service/
├── app/
│   ├── __init__.py        ← factory Flask + CORS
│   ├── routes.py          ← tous les endpoints
│   ├── predictor.py       ← chargement modèle + inférence
│   └── model_monitor.py   ← métriques runtime + dashboard
├── data/
│   ├── dataset.csv        ← à télécharger sur Kaggle
│   └── treatments.json    ← traitements par maladie (41 maladies)
├── models/                ← généré par trainer.py
│   ├── model.pkl
│   ├── label_encoder.pkl
│   └── metadata.json
├── trainer.py             ← entraînement + évaluation
├── run.py                 ← point d'entrée
└── requirements.txt
```

---

## Intégration Django

Le backend Django appelle ce service via :
```
POST http://localhost:5001/predict
```

Le service fonctionne de manière indépendante.
Si le service IA est indisponible, Django répond en mode dégradé (sans suggestions IA).
