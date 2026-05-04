# SkillUp LMS

A full-stack School Management & Learning Management System with AI-powered student insights, exam generation, and attendance tracking.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite, TailwindCSS, React Router |
| Backend | Node.js, Express, MongoDB (Atlas), JWT auth |
| AI Service | Python, FastAPI, scikit-learn |

---

## Prerequisites

- **Node.js** v18+
- **Python** 3.10+
- A MongoDB Atlas account (or update `MONGO_URL` in `.env` to a local MongoDB URI)

---

## 1. Backend

```bash
cd backend
```

Create a `.env` file (copy from the example below and fill in your values):

```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5175
MONGO_URL=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/<dbname>
JWT_SECRET=your_jwt_secret_key
GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash
```

Install dependencies and start:

```bash
npm install
npm run dev
```

The backend will be available at `http://localhost:5000`.

---

## 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at `http://localhost:5175` (Vite picks the next free port if 5173/5174 are taken).

> **Note:** Make sure `CLIENT_URL` in the backend `.env` matches the port Vite actually uses.

---

## 3. SkillUp AI Service

The AI service provides student skill prediction and is built with FastAPI and scikit-learn.

```bash
cd skillup-ai
```

Install Python dependencies:

```bash
pip install -r requirements.txt
```

Start the server:

```bash
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

The AI service will be available at `http://localhost:8000`.

> **Note:** You may see `InconsistentVersionWarning` from scikit-learn if your installed version differs from the one used to train the models. The service still works correctly.

---

## Running All Services

Open three terminal windows:

| Terminal | Command |
|----------|---------|
| 1 — Backend | `cd backend && npm run dev` |
| 2 — Frontend | `cd frontend && npm run dev` |
| 3 — AI Service | `cd skillup-ai && python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload` |

---

## Default Ports

| Service | Port |
|---------|------|
| Frontend | 5175 |
| Backend API | 5000 |
| AI Service | 8000 |

---

## Features

- Role-based dashboards: Admin, Teacher, Student, Parent
- AI-powered exam generation (Gemini)
- AI class insights and student skill prediction
- Attendance tracking and report cards
- Fee collection and salary management
- Study materials upload/download
- Assignment management
- Timetable generation
- Activity logs
