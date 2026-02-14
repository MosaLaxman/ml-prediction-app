# Student Retention Intelligence Dashboard

A Flask-based machine learning web app that predicts student retention and provides actionable intervention guidance.

Live App: `https://ml-prediction-app-5g48.onrender.com/`

## Features

- Professional dashboard UI with responsive design and modern styling
- Retention prediction with probability score and risk level
- Validation and user-friendly error handling
- Actionable recommendations generated from student profile signals
- Quick profile presets (`High-Risk`, `Improving`, `High-Performing`) for demos
- Downloadable prediction report (`.txt`)
- Local recent-history tracking with CSV export
- Health-check endpoint for deployment monitoring

## Tech Stack

- Flask
- scikit-learn (`RandomForestClassifier`)
- Pandas
- Vanilla JavaScript, HTML, CSS

## Project Structure

```text
app.py
templates/
  index.html
static/
  style.css
  script.js
student_data.csv
student_retention_model.pkl
```

## Run Locally

1. Create and activate a virtual environment.
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Start the app:
   ```bash
   python app.py
   ```
4. Open:
   - `http://127.0.0.1:5000/` for the dashboard
   - `http://127.0.0.1:5000/health` for health status

## API

### `POST /predict`

Request body:

```json
{
  "name": "Student Name",
  "age": 20,
  "attendance_rate": 82,
  "academic_percentage": 74,
  "activities_participation": 1
}
```

Response includes:

- `retention_status`
- `retention_probability`
- `risk_level`
- `recommendations`
