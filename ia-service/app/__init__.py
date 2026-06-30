"""
app/__init__.py
---------------
Factory Flask pour le microservice IA MedPredict.
"""

import logging
from flask import Flask
from flask_cors import CORS

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
    datefmt="%H:%M:%S",
)


def create_app() -> Flask:
    app = Flask(__name__)

    # ── CORS : autorise uniquement le frontend React (Django en proxy) ──────────
    CORS(app, resources={
        r"/*": {
            "origins": [
                "http://localhost:5173",
                "http://localhost:3000",
                "http://localhost:8000",
            ]
        }
    })

    # ── Enregistrement des routes ────────────────────────────────────────────────
    from .routes import bp
    app.register_blueprint(bp)

    # ── Préchargement du modèle au démarrage ────────────────────────────────────
    from .predictor import Predictor
    with app.app_context():
        Predictor.get()

    return app