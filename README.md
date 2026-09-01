# 🛡️ Real-Time Crypto Fraud Attribution & LEA Forensics System

> **Target Problem Statement ID:** 26183  
> **Organization:** Ministry of Home Affairs (MHA) / Indian Cyber Crime Coordination Centre (I4C)  
> **Theme:** Blockchain & Cybersecurity  

An enterprise-grade, real-time cryptocurrency forensic intelligence platform designed for Law Enforcement Agencies (LEAs) to ingest victim fraud complaints, trace multi-hop layering trails across EVM chains, identify terminal Virtual Asset Service Providers (VASPs/Exchanges), and generate statutory asset-freezing dossiers under **Section 94 BNSS** and **Section 63 BSA**.

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
|           | (text/event-stream)           +------------------------> +-------------------------+  |
|           v                               |                          |  Redis 7.2 Cache (TTL)  |  |
|  +--------------------+                   v                          +-------------------------+  |
|  | React Flow Canvas  |        +---------------------+                                            |
|  | Dagre Auto-Layout  |        |  NetworkX Risk DAG  |                                            |
|  | Live Monitor Feed  |        |  Heuristics Engine  |                                            |
|  +--------------------+        +---------------------+                                            |
+---------------------------------------------------------------------------------------------------+
```

---

## ⚡ Key Modules & Technical Specifications

### 1. Ingestion & Multi-Hop Crawling
* **Live Ingestion**: `AsyncWeb3` WebSocket client subscribing to `newHeads` on Sepolia/EVM testnets.
* **On-Demand Recursive Crawler**: `httpx.AsyncClient` pipeline with dual-provider fallback (Etherscan V2 API & Blockscout REST API) resolving transactions down to $k=3$ hops dynamically.
* **Decimal Normalization**: Fixed-precision arithmetic using Python `Decimal` preventing precision loss across ERC-20 tokens (e.g., USDT $10^6$, WETH $10^{18}$).
* **Sub-50ms Redis Caching**: Deterministic query hashing (`tx:{chain_id}:{address}:{start}:{end}:{action}`) preventing upstream rate-limiting.

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
* **Two-Tier Attribution**: Exact signature matching and deposit-sweep heuristics targeting major exchanges (Binance, WazirX, CoinDCX, OKX, Kraken).
* **Nodal Officer Directory**: Automated resolution of verified legal/nodal compliance desks.
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
REDIS_URL=redis://redis:6379/0
APP_MODE=live
```

### Run Full Stack (Docker Compose)

```bash
# Build and launch all services in background
docker compose up --build -d

# Verify container health
docker compose ps
```

* **Frontend UI**: `http://localhost` (or `http://localhost:3000`)
* **FastAPI Docs**: `http://localhost:8000/docs`
* **Neo4j Console**: `http://localhost:7474`

### Offline Demo Replay Mode

For environments without reliable testnet internet connectivity:

```bash
APP_MODE=replay docker compose up -d backend
```

---

## 🧪 Running Automated Tests

```bash
# Run backend pytest suite
PYTHONPATH=. pytest backend/tests/ -v
```

---

## 📜 Open-Source Attributions & Acknowledgments

This platform is built upon open-source software and public intelligence datasets:

* **[FastAPI](https://fastapi.tiangolo.com/) & [Starlette](https://www.starlette.io/)**: Asynchronous API gateway and real-time Server-Sent Events dispatching.
* **[Neo4j](https://neo4j.com/) & [neo4j-python-driver](https://github.com/neo4j/neo4j-python-driver)**: Graph database engine and transaction routing.
* **[NetworkX](https://networkx.org/)**: Directed acyclic graph (DAG) causal traversal and temporal path discovery algorithms.
* **[Web3.py](https://github.com/ethereum/web3.py)**: EVM RPC interaction, contract ABI log decoding, and cryptographic Keccak hashing.
* **[React Flow (@xyflow/react)](https://reactflow.dev/)**: Interactive node-graph canvas visualization.
* **[@dagrejs/dagre](https://github.com/dagrejs/dagre)**: Deterministic directed graph layout engine.
* **[ReportLab](https://www.reportlab.com/)**: Dynamic server-side PDF document generation.
* **[dawsbot/eth-labels](https://github.com/dawsbot/eth-labels)**: Base VASP, CEX, and DeFi smart contract attribution dataset.
* **[OpenZeppelin Contracts](https://github.com/OpenZeppelin/openzeppelin-contracts) & [Uniswap V2 Core](https://github.com/Uniswap/v2-core)**: Standard ERC-20 and DEX pair interface definitions.
