import json
import math
from pathlib import Path
from typing import Any

from fastapi import FastAPI, HTTPException

from predictor import predict_student

app = FastAPI()

print("MAIN LOADED")

feature_info_path = Path("models/feature_info.json")
with feature_info_path.open("r", encoding="utf-8") as f:
    feature_info = json.load(f)

BASIC_FEATURES = feature_info.get("basic_features", [])
ALL_FEATURES = feature_info.get("all_features", [])


def _normalize_value(value: Any) -> float:
    if isinstance(value, bool):
        return 1.0 if value else 0.0
    if isinstance(value, (int, float)):
        if isinstance(value, float) and math.isnan(value):
            return 0.0
        return float(value)
    if isinstance(value, str):
        try:
            return float(value.strip())
        except ValueError:
            return 0.0
    return 0.0


def _build_feature_arrays(data: dict) -> tuple[list[float], list[float]]:
    basic = data.get("basic")
    full = data.get("full")

    if isinstance(basic, list) and isinstance(full, list):
        basic_arr = [_normalize_value(v) for v in basic]
        full_arr = [_normalize_value(v) for v in full]
        if len(basic_arr) != len(BASIC_FEATURES) or len(full_arr) != len(ALL_FEATURES):
            raise ValueError("Invalid feature vector length")
        return basic_arr, full_arr

    flat = {key: _normalize_value(data.get(key)) for key in ALL_FEATURES}
    basic_arr = [_normalize_value(flat[key]) for key in BASIC_FEATURES]
    full_arr = [_normalize_value(flat[key]) for key in ALL_FEATURES]
    return basic_arr, full_arr


@app.get("/")
def root():
    return {"message": "AI is running"}


@app.post("/predict")
def predict(data: dict):
    try:
        basic, full = _build_feature_arrays(data)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    return predict_student(basic, full)