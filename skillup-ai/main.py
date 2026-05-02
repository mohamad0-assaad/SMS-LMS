from fastapi import FastAPI
from predictor import predict_student

app = FastAPI()

print("MAIN LOADED")

@app.get("/")
def root():
    return {"message": "AI is running"}

@app.post("/predict")
def predict(data: dict):
    basic = data.get("basic")
    full = data.get("full")

    return predict_student(basic, full)