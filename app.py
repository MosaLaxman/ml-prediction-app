from pathlib import Path

import joblib
import pandas as pd
from flask import Flask, jsonify, render_template, request
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split

app = Flask(__name__)

MODEL_PATH = Path("student_retention_model.pkl")
DATA_PATH = Path("student_data.csv")
FEATURES = ["age", "attendance_rate", "academic_percentage", "activities_participation"]


def load_data():
    return pd.read_csv(DATA_PATH)


def train_model(data):
    X = data[FEATURES]
    y = data["retained"]
    X_train, _, y_train, _ = train_test_split(X, y, test_size=0.2, random_state=42)
    model = RandomForestClassifier(n_estimators=200, random_state=42)
    model.fit(X_train, y_train)
    joblib.dump(model, MODEL_PATH)
    return model


def get_model():
    if MODEL_PATH.exists():
        return joblib.load(MODEL_PATH)
    return train_model(load_data())


def validate_payload(data):
    required = ["name"] + FEATURES
    missing = [key for key in required if key not in data]
    if missing:
        return f"Missing required fields: {', '.join(missing)}"

    if not str(data["name"]).strip():
        return "Name cannot be empty."

    try:
        age = int(data["age"])
        attendance = int(data["attendance_rate"])
        academic = int(data["academic_percentage"])
        activities = int(data["activities_participation"])
    except (TypeError, ValueError):
        return "All numeric fields must be valid numbers."

    if age < 1 or age > 120:
        return "Age must be between 1 and 120."
    if attendance < 0 or attendance > 100:
        return "Attendance rate must be between 0 and 100."
    if academic < 0 or academic > 100:
        return "Academic percentage must be between 0 and 100."
    if activities not in (0, 1):
        return "Activities participation must be 0 or 1."

    return None


def build_recommendations(payload):
    recs = []
    if int(payload["attendance_rate"]) < 75:
        recs.append("Increase attendance with weekly check-ins and reminders.")
    if int(payload["academic_percentage"]) < 70:
        recs.append("Provide targeted tutoring for weaker subjects.")
    if int(payload["activities_participation"]) == 0:
        recs.append("Encourage participation in at least one extracurricular activity.")
    if not recs:
        recs.append("Maintain current support plan and monitor progress monthly.")
    return recs


def risk_level_from_probability(probability):
    if probability >= 80:
        return "Low Risk"
    if probability >= 60:
        return "Moderate Risk"
    return "High Risk"


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "model_available": MODEL_PATH.exists()})


@app.route("/predict", methods=["POST"])
def predict():
    data = request.get_json() or {}
    error = validate_payload(data)
    if error:
        return jsonify({"error": error}), 400

    student_data = [[
        int(data["age"]),
        int(data["attendance_rate"]),
        int(data["academic_percentage"]),
        int(data["activities_participation"]),
    ]]

    model = get_model()
    prediction = int(model.predict(student_data)[0])
    probability = float(model.predict_proba(student_data)[0][1])
    retention_percent = round(probability * 100, 1)

    response_data = {
        "student_name": str(data["name"]).strip(),
        "student_age": int(data["age"]),
        "attendance_rate": int(data["attendance_rate"]),
        "academic_percentage": int(data["academic_percentage"]),
        "activities_participation": str(int(data["activities_participation"])),
        "retention_status": "Retained" if prediction == 1 else "Not Retained",
        "retention_probability": retention_percent,
        "risk_level": risk_level_from_probability(retention_percent),
        "recommendations": build_recommendations(data),
    }

    return jsonify(response_data)


if __name__ == "__main__":
    app.run(debug=True)
