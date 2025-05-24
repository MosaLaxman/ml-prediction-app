import joblib
import pandas as pd
from flask import Flask, render_template, request, jsonify
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier


# Load data from CSV file
def load_data():
    data = pd.read_csv('student_data.csv')
    return data


# Train model
def train_model(data):
    X = data[['age', 'attendance_rate', 'academic_percentage', 'activities_participation']]
    y = data['retained']
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    model = RandomForestClassifier()
    model.fit(X_train, y_train)
    joblib.dump(model, 'student_retention_model.pkl')
    return model


# Predict retention status
def predict_retention(student_data):
    model = joblib.load('student_retention_model.pkl')
    prediction = model.predict([student_data])
    return prediction


app = Flask(__name__)


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/predict', methods=['POST'])
def predict():
    data = request.get_json()
    student_data = [
        int(data['age']),
        int(data['attendance_rate']),
        int(data['academic_percentage']),
        int(data['activities_participation'])
    ]
    prediction = predict_retention(student_data)

    response_data = {
        "student_name": data['name'],
        "student_age": data['age'],
        "attendance_rate": data['attendance_rate'],
        "academic_percentage": data['academic_percentage'],
        "activities_participation": data['activities_participation'],
        "retention_status": "Retained" if prediction[0] == 1 else "Not Retained"
    }

    return jsonify(response_data)


if __name__ == '__main__':
    data = load_data()
    train_model(data)
    app.run(debug=True)