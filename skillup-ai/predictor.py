import joblib
import numpy as np

# load models
failure_model = joblib.load("models/failure_model.pkl")
topic_model = joblib.load("models/topic_recommender.pkl")
strategy_model = joblib.load("models/study_strategy_model.pkl")

topic_encoder = joblib.load("models/topic_encoder.pkl")
strategy_encoder = joblib.load("models/strategy_encoder.pkl")
print("MAIN LOADED")

def predict_student(basic, full):
    basic = np.array([basic])
    full = np.array([full])

    fail = failure_model.predict(basic)[0]
    topic = topic_model.predict(full)[0]
    strategy = strategy_model.predict(full)[0]

    return {
        "failure_risk": int(fail),
        "recommended_topic": topic_encoder.inverse_transform([topic])[0],
        "study_strategy": strategy_encoder.inverse_transform([strategy])[0],
    }