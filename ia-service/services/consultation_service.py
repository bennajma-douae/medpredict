import requests

IA_URL = "http://127.0.0.1:8001/predict"


def process_consultation(patient, symptoms):
    res = requests.post(IA_URL, json={
        "symptoms": symptoms
    }).json()

    return {
        "patient": patient,
        "symptoms": symptoms,
        "ai_result": res,
        "final_diagnosis": res["predictions"][0]["disease"]
    }