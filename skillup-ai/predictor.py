import math
import joblib
import numpy as np

# load models
failure_model = joblib.load("models/failure_model.pkl")
topic_model = joblib.load("models/topic_recommender.pkl")
strategy_model = joblib.load("models/study_strategy_model.pkl")

topic_encoder = joblib.load("models/topic_encoder.pkl")
strategy_encoder = joblib.load("models/strategy_encoder.pkl")
print("MAIN LOADED")


def _failure_probability(model, basic_arr: np.ndarray) -> float:
    """Return a 0–1 probability instead of a binary 0/1 class label."""
    basic_arr = np.nan_to_num(np.asarray(basic_arr, dtype=float), nan=0.0, posinf=0.0, neginf=0.0)
    if basic_arr.ndim == 1:
        basic_arr = basic_arr.reshape(1, -1)
    if hasattr(model, "predict_proba"):
        return round(float(model.predict_proba(basic_arr)[0][1]), 2)
    if hasattr(model, "decision_function"):
        # Convert decision score to probability via sigmoid
        score = float(model.decision_function(basic_arr)[0])
        return round(1.0 / (1.0 + math.exp(-score)), 2)
    # Fallback: binary, but at least return a float
    return float(model.predict(basic_arr)[0])


def _study_strategy_from_score(exam_score: float) -> str:
    """
    Derive a meaningful study strategy from the student's actual exam average.
    The topic-mastery features (topic_variables, loops, …) are unavailable in a
    general school LMS, so feeding zeros to the ML model always outputs the same
    label ('Practice Exercises'). This rule-based fallback is far more useful.
    """
    if exam_score < 40:
        return "Review Lessons"
    if exam_score < 55:
        return "Extra Practice"
    if exam_score < 70:
        return "Practice Exercises"
    if exam_score < 85:
        return "Interactive Exercises"
    return "Advanced Challenges"


def predict_student(basic, full):
    basic_arr = np.nan_to_num(np.asarray([basic], dtype=float), nan=0.0, posinf=0.0, neginf=0.0)
    full_arr = np.nan_to_num(np.asarray([full], dtype=float), nan=0.0, posinf=0.0, neginf=0.0)

    if basic_arr.ndim == 1:
        basic_arr = basic_arr.reshape(1, -1)
    if full_arr.ndim == 1:
        full_arr = full_arr.reshape(1, -1)

    # Failure risk as a real probability (e.g. 0.34 = 34 %)
    failure_risk = _failure_probability(failure_model, basic_arr)

    # Topic recommendation from ML (frontend already overrides this with the
    # real weakest subject when exam data is available)
    topic = topic_model.predict(full_arr)[0]
    recommended_topic = topic_encoder.inverse_transform([topic])[0]

    # Study strategy derived from the actual exam score (basic[0]) because
    # all topic-mastery inputs are zero, which makes the ML strategy model
    # output the same label for every student regardless of performance.
    exam_score = float(basic_arr[0][0])
    study_strategy = _study_strategy_from_score(exam_score)

    return {
        "failure_risk": failure_risk,
        "recommended_topic": recommended_topic,
        "study_strategy": study_strategy,
    }
