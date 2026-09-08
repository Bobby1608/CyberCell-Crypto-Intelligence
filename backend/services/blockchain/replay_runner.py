import json
import asyncio
from pathlib import Path
from decimal import Decimal
from typing import List, Dict, Any

from backend.core.schemas import TransactionRecord, TxStatus, AssetType
from backend.services.blockchain.async_graph_loader import AsyncNeo4jLoader
from backend.services.graph.subgraph_extractor import SubgraphExtractor
from backend.services.risk.temporal_analyzer import build_temporal_graph, extract_valid_fund_paths, evaluate_risk
from backend.services.event_bus import event_bus, TX_INCLUDED, GRAPH_UPDATED, RISK_EVALUATED

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent.parent
DEFAULT_MOCK_PATH = PROJECT_ROOT / "data" / "mock" / "sepolia_sample_run.json"

class ReplayRunner:
    """
    Offline Demo Replay Engine: Streams mock Sepolia transaction sequences
    through Neo4j persistence and Event Bus SSE dispatch at fixed intervals.
    """
    def __init__(self, mock_file_path: Path | None = None, interval_seconds: float = 3.0):
        self.mock_file_path = mock_file_path or DEFAULT_MOCK_PATH
        self.interval_seconds = interval_seconds
        self.db_loader = AsyncNeo4jLoader()
        self.extractor = SubgraphExtractor()
        self.root_suspect = "0xb1ad40e588959c203617cd55b5cd32cc2795a9ff"
        self.watch_addresses = {self.root_suspect}

    async def start(self):
        print(f"[*] Starting ReplayRunner in REPLAY MODE using dataset: {self.mock_file_path}")
        try:
            await self.db_loader.init_schema()
        except Exception as exc:
            print(f"[REPLAY] Schema init note: {exc}")

        if not self.mock_file_path.exists():
            print(f"[!] Mock dataset not found at {self.mock_file_path}")
            return

        with open(self.mock_file_path, "r", encoding="utf-8") as f:
            records_data = json.load(f)

        print(f"[+] Loaded {len(records_data)} mock transactions for replay.")

        import time
        for item in records_data:
            await asyncio.sleep(self.interval_seconds)
            t1_ns = time.perf_counter_ns()

            rec = TransactionRecord(
                tx_hash=item["tx_hash"],
                block_number=item["block_number"],
                timestamp=item["timestamp"],
                t0_sec=item["timestamp"],
                t1_ns=t1_ns,
                from_address=item["from_address"].lower(),
                to_address=item["to_address"].lower(),
                amount=Decimal(str(item["amount"])),
                raw_amount=str(item["raw_amount"]),
                asset_type=AssetType[item.get("asset_type", "NATIVE")],
                asset_symbol=item.get("asset_symbol", "ETH"),
                status=TxStatus[item.get("status", "INCLUDED")]
            )

            # Persist to Neo4j
            try:
                await self.db_loader.save_transaction_record(rec)
                print(f"[REPLAY] Persisted mock TX {rec.tx_hash[:16]}... ({rec.amount} {rec.asset_symbol})")
            except Exception as exc:
                print(f"[REPLAY] DB Save Error: {exc}")

            # Register monitored wallets
            self.watch_addresses.add(rec.from_address)
            self.watch_addresses.add(rec.to_address)

            # 1. Dispatch TX_INCLUDED
            await event_bus.publish(TX_INCLUDED, {
                "tx_hash": rec.tx_hash,
                "from_address": rec.from_address,
                "to_address": rec.to_address,
                "amount": float(rec.amount),
                "asset_symbol": rec.asset_symbol,
                "block_number": rec.block_number,
                "timestamp": rec.timestamp,
                "t1_ns": t1_ns
            })

            # 2. Dispatch GRAPH_UPDATED
            await event_bus.publish(GRAPH_UPDATED, {
                "tx_hash": rec.tx_hash,
                "from_address": rec.from_address,
                "to_address": rec.to_address,
                "amount": float(rec.amount),
                "asset_symbol": rec.asset_symbol,
                "t1_ns": t1_ns
            })

            # 3. Evaluate Downstream Subgraph Risk
            try:
                edge_records = await self.extractor.get_downstream_subgraph(self.root_suspect, max_depth=4)
                if edge_records:
                    G = build_temporal_graph(edge_records)
                    causal_paths = extract_valid_fund_paths(G, self.root_suspect, max_depth=4)
                    report = evaluate_risk(self.root_suspect, G, causal_paths)

                    typology_dict = report.typologies.model_dump() if hasattr(report.typologies, "model_dump") else report.typologies.dict()

                    await event_bus.publish(RISK_EVALUATED, {
                        "root_address": report.root_address,
                        "paths_detected": report.paths_detected,
                        "max_hop_depth": report.max_hop_depth,
                        "risk_score": report.risk_score,
                        "typologies": typology_dict,
                        "reasons": report.reasons,
                        "valid_paths": report.valid_paths,
                        "t1_ns": t1_ns
                    })
                    print(f"[REPLAY] Evaluated Risk Score: {report.risk_score} | Paths: {report.paths_detected}")
            except Exception as exc:
                print(f"[REPLAY] Risk Evaluation Error: {exc}")

        print("[+] Replay loop completed successfully.")

    async def close(self):
        await self.db_loader.close()
        await self.extractor.close()
