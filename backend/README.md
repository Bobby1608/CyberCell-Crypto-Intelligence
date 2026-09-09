# ⚙️ FastApi Backend & Forensic Engine

> **Backend Service Module — SIH Problem Statement 26183**  
> Built with **Python 3.11**, **FastAPI**, **Neo4j 5.18**, **AsyncWeb3**, **NetworkX**, and **ReportLab**.

---

## 🏛 Directory & Core Module Overview

```
backend/
├── main.py                   # Application entrypoint & FastAPI startup events
├── Dockerfile                # Multi-stage production Docker container definition
├── api/                      # REST & SSE API endpoints
│   ├── routes.py             # Primary investigation & graph retrieval routes
│   ├── ncrp_routes.py        # NCRP / SAHYOG complaint intake webhooks
│   ├── report_routes.py      # Section 63 BSA PDF dossier generation endpoint
│   └── auth.py               # X-API-Key security middleware
├── core/                     # Configuration, database drivers & logging
│   ├── config.py             # Settings loader (Pydantic / .env)
│   ├── database.py           # Async Neo4j driver connection pool
│   └── logging.py            # Structured JSON audit logging (structlog)
├── schemas/                  # Pydantic data validation models
│   ├── investigation.py      # Graph request & node/edge schemas
│   └── ncrp.py               # NCRP intake complaint schemas
└── services/                 # Business logic & forensic engines
    ├── event_bus.py          # Redis Pub/Sub & SSE event streaming bus
    ├── attribution/          # VASP attribution heuristics & registry
    │   └── vasp_engine.py    # VASP entity signature matcher
    ├── blockchain/           # EVM data ingestion & multi-hop crawler
    │   ├── ingestor.py       # Etherscan / Blockscout async API crawler
    │   ├── graph_loader.py   # Neo4j Cypher query builder
    │   └── realtime_listener.py # AsyncWeb3 WebSocket Sepolia block watcher
    ├── heuristics/           # Risk calculation & typologies
    │   └── risk_engine.py    # NetworkX DAG analysis (peel-chain, fan-out, velocity)
    └── reporting/            # PDF report generator
        └── dossier_builder.py# Section 63 BSA PDF dossier generator (ReportLab)
```

---

## 🔑 Key Service Responsibilities

### 1. Multi-Hop Blockchain Ingestor (`services/blockchain/ingestor.py`)
- Executes bounded recursive Breadth-First Search (BFS) starting from target suspect wallet address down to $k=3$ hops.
- Implements provider fallback (Etherscan V2 API $\rightarrow$ Blockscout REST API).
- Caches response query hashes in-memory to prevent rate-limiting (HTTP 429).

### 2. Neo4j Graph Loader (`services/blockchain/graph_loader.py`)
- Writes target wallets, transactions, and token movements into Neo4j Graph DB using optimized Cypher batch statements.
- Schema: `(:Wallet)-[:SENT]->(:Transaction)-[:RECEIVED_BY]->(:Wallet)`.

### 3. Forensic Risk Engine (`services/heuristics/risk_engine.py`)
- Analyzes transaction DAGs in NetworkX to compute risk scores ($0.0 \text{ to } 1.0$) and detect laundering typologies:
  - **Rapid Pass-Through**: Hop residence velocity $\le 180\text{s}$.
  - **Peel Chain**: Sequential value ratio forwarding $85\text{--}95\%$.
  - **Fan-Out**: Out-degree branching factor $\ge 3$.
  - **DeFi / Mixer Hopping**: Smart contract pool interaction.

### 4. VASP Attribution Engine (`services/attribution/vasp_engine.py`)
- Matches wallet hashes against known exchange hot wallets, deposit sweeps, and Sepolia testnet VASP labels (Binance, CoinDCX, WazirX, OKX, Kraken).

### 5. PDF Dossier Builder (`services/reporting/dossier_builder.py`)
- Uses ReportLab to generate court-admissible PDF legal dossiers compliant with **Section 94 BNSS** and **Section 63 BSA**.

---

## 🧪 Developer Commands

```bash
# Run backend locally with reload
uvicorn backend.main:app --reload --port 8000

# Run automated backend unit test suite
PYTHONPATH=. pytest backend/tests/ -v
```
