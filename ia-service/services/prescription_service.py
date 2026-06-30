def generate_prescription(ai_result):
    top = ai_result["predictions"][0]

    return {
        "disease": top["disease"],
        "confidence": top["confidence_pct"],
        "medications": ["Paracetamol"],
        "editable": True
    }