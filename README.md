# AI Review Moderation System

## Overview

The AI Review Moderation System is a full-stack web application designed to detect fake and misleading product reviews in e-commerce platforms. The system combines AI-powered text analysis with statistical and behavioral techniques to improve review authenticity and trustworthiness.

The project uses Natural Language Processing (NLP), TF-IDF vectorization, cosine similarity, user behavior analysis, and time-based anomaly detection to identify spam reviews, suspicious users, duplicate content, and review bombing campaigns.

---

## Features

* AI-Based Fake Review Detection
* Duplicate & Near-Duplicate Review Detection
* User Behavior Analysis
* Review Bombing Detection
* CSV Upload Analysis
* URL-Based Review Extraction
* Dashboard Visualization
* PDF Report Generation
* Firebase Authentication
* Report History Tracking

---

## Technologies Used

### Frontend

* React.js
* Vite
* Tailwind CSS

### Backend

* FastAPI
* Python
* Uvicorn

### AI & Data Processing

* Google Gemini API
* Scikit-learn
* Pandas
* NumPy
* TF-IDF Vectorization
* Cosine Similarity

### Database & Authentication

* Firebase Authentication
* Firebase Firestore

---

## System Architecture

The system follows a modular pipeline:

1. User uploads CSV file or enters product URL
2. Reviews are extracted and preprocessed
3. AI-Based Text Analysis is performed
4. Duplicate reviews are detected using TF-IDF and cosine similarity
5. User behavior patterns are analyzed
6. Review bombing detection is performed using timestamp analysis
7. Weighted scoring model generates final moderation results
8. Reports and dashboards are generated

---

## Algorithms & Methods Used

* TF-IDF (Term Frequency - Inverse Document Frequency)
* Cosine Similarity
* Natural Language Processing (NLP)
* User Behavior Pattern Analysis
* Time-Based Anomaly Detection
* Weighted Scoring Model

---

## Installation Guide

### Clone Repository

```bash
git clone <repository-link>
cd AI-Review-Moderation-System
```

---

## Backend Setup

### Navigate to backend folder

```bash
cd backend
```

### Create virtual environment

```bash
python -m venv venv
```

### Activate virtual environment

#### Windows

```bash
venv\Scripts\activate
```

#### Mac/Linux

```bash
source venv/bin/activate
```

### Install dependencies

```bash
pip install fastapi uvicorn pandas numpy scikit-learn python-multipart requests beautifulsoup4 langdetect google-generativeai
```

### Run backend server

```bash
uvicorn main:app --reload
```

Backend runs at:

```text
http://127.0.0.1:8000
```

---

## Frontend Setup

### Navigate to frontend folder

```bash
cd frontend
```

### Install dependencies

```bash
npm install
```

### Run frontend

```bash
npm run dev
```

Frontend runs at:

```text
http://localhost:5173
```

---

## Firebase Configuration

1. Create Firebase project
2. Enable Authentication
3. Enable Firestore Database
4. Add Firebase configuration in frontend project

Example:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
};
```

---

## Gemini API Configuration

Set Gemini API key as environment variable:

### Windows

```bash
set GEMINI_API_KEY=your_api_key
```

### Mac/Linux

```bash
export GEMINI_API_KEY=your_api_key
```

---

## Project Structure

```text
project/
│
├── backend/
│   ├── main.py
│   ├── upload.py
│   ├── url_analysis.py
│   ├── duplicate_detection.py
│   ├── behavior_analysis.py
│
├── frontend/
│   ├── src/
│   ├── components/
│   ├── pages/
│
└── README.md
```

---

## Results

* Successfully detects fake and spam reviews
* Identifies duplicate reviews and suspicious users
* Detects review bombing campaigns
* Generates moderation reports and dashboards
* Improves trust and transparency in review systems

---

## Future Scope

* Multi-language support
* Advanced deep learning integration
* Real-time API-based review monitoring
* Cloud deployment
* Mobile application support
* Real-time alert system

---

## Conclusion

The AI Review Moderation System provides an efficient and scalable solution for detecting fake reviews, spam campaigns, suspicious users, and review bombing attacks. By combining AI, NLP, behavioral analysis, and statistical techniques, the system improves the reliability and trustworthiness of online review platforms.

---

## Author

Develop
