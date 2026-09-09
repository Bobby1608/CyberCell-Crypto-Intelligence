# 🛡️ Real-Time Crypto Fraud Attribution & LEA Forensics System

> **Target Problem Statement ID:** 26183  
> **Organization:** Ministry of Home Affairs (MHA) / Indian Cyber Crime Coordination Centre (I4C)  
> **Theme:** Blockchain & Cybersecurity  

An enterprise-grade, real-time cryptocurrency forensic intelligence platform designed for Law Enforcement Agencies (LEAs) to ingest victim fraud complaints, trace multi-hop layering trails across EVM chains, identify terminal Virtual Asset Service Providers (VASPs/Exchanges), and generate statutory asset-freezing dossiers formatted to align with **Section 94 BNSS** and **Section 63 BSA** documentation requirements.

---

## 🏛️ System Architecture

```
                               +---------------------------------------+
                               |         NCRP / SAHYOG Platform        |
                               +---------------------------------------+
                                                   |
                                                   v (Webhook Intake)
+---------------------------------------------------------------------------------------------------+
| DOCKER CONTAINER NETWORK                                                                          |
|                                                                                                   |
|  +--------------------+        +---------------------+        +--------------------------------+  |
|  |   Nginx Gateway    | -----> |   FastAPI Backend   | -----> |      Neo4j 5.18 Graph DB       |  |
|  |  (Unbuffered SSE)  |        |  Python 3.11 Runtime|        |  (w:Wallet)-[:SENT]->(tx)-...  |  |
|  +--------------------+        +---------------------+        +--------------------------------+  |
|           ^                               |                                                       |
|           | (text/event-stream)           +------------------------>                            |
|           v                               |                                                       |
|  +--------------------+                   v                                                       |
|  | React Flow Canvas  |        +---------------------+                                            |
|  | Dagre Auto-Layout  |        |  NetworkX Risk DAG  |                                            |
|  | Live Monitor Feed  |        |  Heuristics Engine  |                                            |
|  +--------------------+        +---------------------+                                            |
+---------------------------------------------------------------------------------------------------+
```

---

## 📂 Repository Structure

```
.
├── backend/                  # FastAPI 3.11 backend & python microservices (See backend/README.md)
├── frontend/                 # React 18 + Vite + ReactFlow frontend (See frontend/README.md)
├── data/                     # Mock data seeds & Sepolia VASP registries
├── scripts/                  # Synthetic case replay runner scripts
├── docker-compose.yml        # Multi-container orchestration (Nginx, FastAPI, Neo4j)
├── requirements.txt          # Python dependencies
└── .env.example              # Environment variables template
```

---

## ⚡ Key Modules & Technical Specifications

### 1. Ingestion & Multi-Hop Crawling
* **Live Ingestion**: `AsyncWeb3` WebSocket client subscribing to `newHeads` on Sepolia/EVM testnets.
* **On-Demand Recursive Crawler**: `httpx.AsyncClient` pipeline with dual-provider fallback (Etherscan V2 API & Blockscout REST API) resolving transactions down to $k=3$ hops dynamically.
* **Decimal Normalization**: Fixed-precision arithmetic using Python `Decimal` preventing precision loss across ERC-20 tokens (e.g., USDT $10^6$, WETH $10^{18}$).
* **Sub-50ms TTL In-Memory Caching**: Deterministic query hashing preventing upstream rate-limiting.

### 2. Neo4j Property Graph Topology
* Explicit decoupled schema: `(:Wallet)-[:SENT]->(:Transaction)-[:RECEIVED_BY]->(:Wallet)` and `(:Transaction)-[:TRANSFERRED]->(:Token)`.
* Uniqueness constraints on `Wallet.address`, `Transaction.hash`, and `Token.contract`.

### 3. Laundering Typologies & Mathematical Heuristics
The risk engine analyzes in-memory directed graphs to score suspect behavior:

$$\text{Composite Risk Score} = \min\left(1.0, \sum (w_i \cdot I_{\text{detected}})\right)$$

| Typology Indicator | Detection Criteria | Weight ($w_i$) |
| :--- | :--- | :---: |
| **Rapid Pass-Through** | Intermediary hop residence time $\Delta t = t_{\text{out}} - t_{\text{in}} \le 180\text{s}$ | **0.25** |
| **Peel Chain** | Value forwarding ratio $0.85 \le \frac{\text{Forwarded Amount}}{\text{Received Amount}} \le 0.95$ | **0.25** |
| **Fan-Out Dispersion** | Out-degree branching factor $\text{deg}^+(w) \ge 3$ (Structuring) | **0.20** |
| **DeFi / Bridge Hopping** | Direct interaction with Uniswap pools or cross-chain bridge contracts | **0.20** |
| **VASP Terminal Cashout** | Terminal node matches verified exchange hot/deposit wallet | **0.10** |

* **Risk Categories**: `CLEAN / LOW` ($<0.25$), `MEDIUM` ($0.25\text{--}0.49$), `HIGH` ($0.50\text{--}0.69$), `CRITICAL` ($\ge 0.70$).

### 4. VASP Attribution & Legal Freezing Engine
* **Two-Tier Attribution**: Signature matching and deposit-sweep heuristics targeting major exchanges (Binance, CoinDCX, WazirX, OKX, Kraken).
* **Statutory Compliance**:
  * **Section 94 BNSS (Bharatiya Nagarik Suraksha Sanhita, 2023)**: Automated drafting of debit-freeze directives and KYC requisition orders.
  * **Section 63 BSA (Bharatiya Sakshya Adhiniyam, 2023)**: Cryptographic hash auditing and chain-of-custody preservation for secondary electronic evidence admissibility.

---

## 🚀 Quickstart & Deployment

### Prerequisites
* Docker Engine 24+ & Docker Compose v2.20+
* Node.js 20+ (for local frontend dev)
* Python 3.11+ (for local backend dev)

### Environment Configuration
Copy the example configuration file:
```bash
cp .env.example .env
```

Fill in your API credentials:
```env
SEPOLIA_WS_URL=wss://eth-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_KEY
ETHERSCAN_API_KEY=YOUR_ETHERSCAN_KEY
NEO4J_URI=bolt://neo4j:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=cryptoforensics2026
```

### Run Full Stack (Docker Compose)

```bash
# Build and launch all services in background
docker compose up --build -d

# Verify container health
docker compose ps
```

* **Frontend UI**: `http://localhost` (or `http://localhost:5173`)
* **FastAPI Docs**: `http://localhost:8000/docs`
* **Neo4j Console**: `http://localhost:7474`

---

## 🧪 Running Automated Tests

```bash
# Run backend pytest suite
PYTHONPATH=. pytest backend/tests/ -v
```

---

## 📜 Open-Source Attributions & Acknowledgments

* **[FastAPI](https://fastapi.tiangolo.com/) & [Starlette](https://www.starlette.io/)**: Asynchronous API gateway and real-time Server-Sent Events dispatching.
* **[Neo4j](https://neo4j.com/) & [neo4j-python-driver](https://github.com/neo4j/neo4j-python-driver)**: Graph database engine and transaction routing.
* **[NetworkX](https://networkx.org/)**: Directed acyclic graph (DAG) causal traversal algorithms.
* **[Web3.py](https://github.com/ethereum/web3.py)**: EVM RPC interaction & log decoding.
* **[React Flow (@xyflow/react)](https://reactflow.dev/)**: Interactive node-graph canvas visualization.
* **[ReportLab](https://www.reportlab.com/)**: Dynamic server-side PDF document generation.
