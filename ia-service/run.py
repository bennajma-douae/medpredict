"""
run.py
------
Point d'entrée du microservice IA MedPredict.
"""

import argparse
import sys
from pathlib import Path

# ─────────────────────────────────────────────
# 🔥 FIX CRITIQUE : ajouter le path AVANT imports
# ─────────────────────────────────────────────
BASE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE_DIR))

from app import create_app
def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="MedPredict IA Microservice")
    parser.add_argument("--port", type=int, default=5001)
    parser.add_argument("--host", type=str, default="0.0.0.0")
    parser.add_argument("--debug", action="store_true")
    return parser.parse_args()


def print_banner(host: str, port: int, debug: bool):
    print("\n" + "═" * 55)
    print("  MedPredict — Microservice IA")
    print(f"  Écoute sur : http://{host}:{port}")
    print(f"  Mode debug : {'activé' if debug else 'désactivé'}")
    print("═" * 55)


if __name__ == "__main__":
    args = parse_args()
    app = create_app()

    print_banner(args.host, args.port, args.debug)
    app.run(host=args.host, port=args.port, debug=args.debug)