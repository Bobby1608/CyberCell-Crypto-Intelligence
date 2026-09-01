# 👥 Team Onboarding & Self-Service Setup Guide

Welcome to the **Crypto Fraud Attribution Platform** project workspace. Follow these steps to clone, configure, and develop locally using a **Strict Zero-Secrets / Zero-Credentials Policy**.

---

## 🔒 Security Policy
* **Never commit credentials**: Do NOT commit passwords, API keys, private keys (`*.pem`, `*.key`), or real `.env` files.
* **Independent local provisioning**: Each developer generates their own private API keys and defines their own local Neo4j database password in their `.env` file.

---

## 1. Initial Setup

### Step 1: Clone the Repository
```bash
git clone <GITHUB_REPOSITORY_URL>
cd crypto-fraud-attribution
```

### Step 2: Provision Local Environment Variables (`.env`)

Copy the structural template to create your local `.env` configuration:

```bash
cp .env.example .env
```

Open `.env` in your code editor and fill in your independent local credentials:

1. **`SEPOLIA_WS_URL`**: Generate your free WebSocket RPC URL via [Alchemy](https://www.alchemy.com/) or [Infura](https://www.infura.io/).
2. **`ETHERSCAN_API_KEY`**: Generate a free API key at [Etherscan Developer Portal](https://etherscan.io/apis).
3. **`NEO4J_PASSWORD`**: Define a private, arbitrary local database password (e.g. `MySecureLocalPass2026!`).

---

## 2. Running the Application Stack

### Option A: Standard Docker Workflow (Recommended)

Once `.env` is configured, build and launch all containerized services:

```bash
docker compose up --build -d
```

Verify service status:

```bash
docker compose ps
```

Inspect live backend logs:

```bash
docker compose logs -f backend
```

Access local endpoints:
* **Frontend UI**: `http://localhost` (or `http://localhost:3000`)
* **FastAPI Docs**: `http://localhost:8000/docs`
* **Neo4j Console**: `http://localhost:7474` (Log in using user `neo4j` and your configured `NEO4J_PASSWORD`)

### Option B: Local Bare-Metal Development

**Terminal 1 — Databases:**

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

* `main`: Production-ready, zero-secret releases.
* `develop`: Integration branch for tested feature modules.
* `feature/<feature-name>`: Individual work branches. Create PRs against `develop`.
