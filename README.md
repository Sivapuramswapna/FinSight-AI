# FinSight AI — Intelligent Financial Analytics & Intelligence Platform

**FinSight AI** is a production-grade full-stack personal finance intelligence platform built with **React**, **Vite**, **Tailwind CSS**, **FastAPI**, **SQLite**, and **Scikit-learn**.

The platform incorporates machine learning expense predictions (Ridge regression), unsupervised anomaly detection (Isolation Forest), automated smart categorization (TF-IDF NLP), grounded ledger financial chatbot (RAG), receipt OCR extraction, dynamic budget/goals tracking with 30-day cash flow forecasting, executive financial reporting, and live notification surveillance.

---

## Architecture & Tech Stack

- **Frontend:** React 18, Vite, Tailwind CSS 3, Recharts 2.12, Lucide Icons, React Router 6, React Icons.
- **Backend:** Python 3.11+, FastAPI, SQLAlchemy, Pydantic v2, Uvicorn.
- **Machine Learning & AI:** Scikit-learn (Ridge Regression, Isolation Forest 100 Trees, TF-IDF Vectorizer), Ledger Grounded RAG, OCR Regex Engine.
- **Authentication & Security:** Salted bcrypt password hashing (`passlib[bcrypt]`), RFC 7519 HMAC-SHA256 (`HS256`) signed JWT access tokens, SQLAlchemy ORM SQL injection immunity.

---

## Quick Start (How to Run Anytime)

### Method 1: 1-Click Launch (Windows)
Double-click `start.bat` in the root folder.  
It will automatically launch the backend server, frontend server, and open your browser at `http://localhost:3000`.

### Method 2: Manual Terminal Commands

#### 1. Start the Backend API (Terminal 1)
```bash
cd backend
python -m uvicorn app.main:app --reload --port 8000
```
- API Base URL: `http://localhost:8000`
- Swagger UI Documentation: `http://localhost:8000/docs`
- ReDoc Documentation: `http://localhost:8000/redoc`

#### 2. Start the Frontend Application (Terminal 2)
```bash
cd frontend
npm run dev
```
- Application Web App: `http://localhost:3000`

---

## Demo Credentials

You can use the pre-configured test account or click **"1-Click Demo Login"** on the sign-in screen:
- **Email:** `alex.reynolds@example.com`
- **Password:** `password123`

---

## How to Push to GitHub

Follow these steps to initialize and push this project to your GitHub account:

### Step 1: Create a New Repository on GitHub
1. Go to [https://github.com/new](https://github.com/new).
2. Enter a repository name (e.g., `FinSight-AI` or `Expense-Tracker`).
3. Choose **Public** or **Private**.
4. **Do NOT** initialize with README or .gitignore (we already created them).
5. Click **Create repository**.
6. Copy your repository URL (e.g., `https://github.com/YOUR_USERNAME/FinSight-AI.git`).

### Step 2: Open Terminal in the Project Root
In PowerShell or Command Prompt, ensure you are in the project root:
```bash
cd "C:\Users\S.SWAPNA\Downloads\Expense_tracker"
```

### Step 3: Initialize Git and Commit
```bash
# 1. Initialize git repository (if not already initialized)
git init

# 2. Add all project files (safe .gitignore prevents node_modules from uploading)
git add .

# 3. Commit the changes
git commit -m "feat: complete FinSight AI personal finance intelligence platform (Phases 1-12)"
```

### Step 4: Link Remote and Push to GitHub
```bash
# 4. Set main branch
git branch -M main

# 5. Add your GitHub remote repository (replace with your actual GitHub URL)
git remote add origin https://github.com/YOUR_USERNAME/FinSight-AI.git

# 6. Push code to GitHub
git push -u origin main
```

*(Note: If you have already added a remote previously, you can update it using `git remote set-url origin <URL>`)*

---

## 12 Implemented Phases

- [x] **Phase 1: Frontend Dashboard & Design Tokens** — KPI StatCards, Financial Health Score gauge, Recharts interactive visualizations, dark/light theme engine.
- [x] **Phase 2: Authentication & Database Models** — 7 relational SQLAlchemy models, bcrypt password hashing, RFC 7519 HMAC-SHA256 JWT auth, demo mode.
- [x] **Phase 3: Transaction CRUD Management** — Ledger CRUD, pagination, multi-attribute search, category & type filters, and modal dialogs.
- [x] **Phase 4: Financial Analytics Engine** — Dynamic SQL database aggregations for monthly trends, category burn rates, merchant rankings, and weekday/weekend splits.
- [x] **Phase 5: ML Expense Prediction** — Scikit-learn Ridge Regression with 95% confidence intervals, projected trend indicators, and Bayesian category decomposition.
- [x] **Phase 6: Anomaly Detection & Fraud Surveillance** — Isolation Forest (100 Decision Trees), calibrated risk scores (0.00–0.98), XAI rationales, and resolution workflow.
- [x] **Phase 7: AI Smart Categorizer** — Hybrid TF-IDF NLP model + historical preference memory with merchant disambiguation in transaction forms.
- [x] **Phase 8: Grounded Financial AI Chatbot** — Ledger RAG engine querying SQL transactions with zero hallucination and conversational affordability simulations.
- [x] **Phase 9: Receipt OCR Scanner** — Document parser extracting merchant, date, total amount, sales tax, line items, and instant AI categorization.
- [x] **Phase 10: Smart Budgeting, Goals & Cash Flow Forecasting** — Dynamic spend tracking (Safe/Warning/Exceeded), savings goals with deposit contributions, and 30-day cash flow forecasting.
- [x] **Phase 11: Reports & Notifications Engine** — Executive monthly financial reports, CSV streaming export, printable HTML/PDF statements, and real-time alert notifications with unread badge counter in the navbar.
- [x] **Phase 12: Testing & Security Audit** — 11-module regression test suite (`backend/test_full_suite.py`) passed 100%, security audit passed, and clean production build achieved.
