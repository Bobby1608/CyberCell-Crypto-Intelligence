# 👥 Team Onboarding & Development Guide

Welcome to the **Crypto Fraud Attribution Platform** project workspace. Follow these steps to clone, configure, and develop locally.

---

## 1. Initial Setup

### Step 1: Clone the Repository
```bash
git clone <GITHUB_REPOSITORY_URL>
cd crypto-fraud-attribution
```

### Step 2: Configure Environment Variables

```bash
cp .env.example .env
# Edit .env and insert your Alchemy/Infura WSS key and Etherscan API key
```

---

## 2. Running the Application

### Option A: Standard Docker Workflow (Recommended)

```bash
docker compose up --build -d
```

Inspect logs:

```bash
docker compose logs -f backend
```

### Option B: Local Bare-Metal Development

**Terminal 1 — Database Services:**

```bash
docker compose up neo4j redis -d
```

**Terminal 2 — Python Backend:**

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
export PYTHONPATH=$(pwd)
uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```

**Terminal 3 — React Frontend:**

```bash
cd frontend
npm install
npm run dev
```

---

## 3. Git Branching Strategy

* `main`: Production-ready, fully containerized releases.
* `develop`: Integration branch for tested feature modules.
* `feature/<feature-name>`: Individual work branches. Create PRs against `develop`.
