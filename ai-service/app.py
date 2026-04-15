from flask import Flask, request, jsonify
import random

app = Flask(__name__)

@app.route('/predict', methods=['POST'])
def predict():
    data = request.json
    symptoms = data.get('symptoms', '')
    
    # Simulation d'un modèle d'IA
    # En production, ici on chargerait le modèle .pkl (Random Forest/XGBoost)
    suggestions = [
        {"pathologie": "Grippe saisonnière", "score": 0.85},
        {"pathologie": "Rhume", "score": 0.10},
        {"pathologie": "Fatigue chronique", "score": 0.05}
    ]
    
    return jsonify({
        "status": "success",
        "predictions": suggestions,
        "disclaimer": "Outil d'aide — ne remplace pas le diagnostic médical"
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)