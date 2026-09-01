import os
import time
import asyncio
from decimal import Decimal
from typing import Set, List, Dict, Any
import httpx
from dotenv import load_dotenv

from backend.core.schemas import TransactionRecord, TxStatus, AssetType
from backend.services.blockchain.async_graph_loader import AsyncNeo4jLoader

load_dotenv()

ETHERSCAN_API_KEY = os.getenv("ETHERSCAN_API_KEY", "")
SEPOLIA_ETHERSCAN_URL = "https://api-sepolia.etherscan.io/api"
BLOCKSCOUT_URL = "https://eth-sepolia.blockscout.com/api"

class SepoliaCrawler:
    """
    On-demand multi-hop transaction crawler for Sepolia testnet.
    Recursively fetches on-chain activity for a root suspect and its downstream counterparties,
    persisting all transaction records to Neo4j.
    """
    def __init__(self, api_key: str | None = None):
        self.api_key = api_key or ETHERSCAN_API_KEY
        self.loader = AsyncNeo4jLoader()

    async def _fetch_async(self, client: httpx.AsyncClient, module: str, action: str, address: str) -> List[Dict[str, Any]]:
        # 1. Try Etherscan API if valid key is supplied
        if self.api_key and self.api_key != "YourApiKeyToken":
            params = {
                "module": module,
                "action": action,
                "address": address,
                "startblock": 0,
                "endblock": 99999999,
                "page": 1,
                "offset": 100,
                "sort": "desc",
                "apikey": self.api_key
            }
            try:
                res = await client.get(SEPOLIA_ETHERSCAN_URL, params=params, timeout=6.0)
                if res.status_code == 200:
                    data = res.json()
                    if data.get("status") == "1" and isinstance(data.get("result"), list) and len(data["result"]) > 0:
                        return data["result"]
            except Exception as exc:
                print(f"[CRAWLER] Etherscan request error for {address}: {exc}")

        # 2. Keyless Fallback: Blockscout Sepolia Open API (No API key required)
        params_bs = {
            "module": module,
            "action": action,
            "address": address,
            "sort": "desc"
        }
        try:
            res = await client.get(BLOCKSCOUT_URL, params=params_bs, timeout=6.0)
            if res.status_code == 200:
                data = res.json()
                if isinstance(data.get("result"), list):
                    print(f"[CRAWLER] Blockscout retrieved {len(data['result'])} txs for {address}")
                    return data["result"]
        except Exception as exc:
            print(f"[CRAWLER] Blockscout API error for {address}: {exc}")

        return []

    async def crawl_and_ingest(self, root_address: str, max_depth: int = 2) -> Set[str]:
        root_clean = root_address.strip().lower()
        visited: Set[str] = {root_clean}
        queue: List[tuple[str, int]] = [(root_clean, 0)]
        ingested_count = 0

        print(f"[*] Starting async multi-hop crawling for root suspect: {root_clean}")

        async with httpx.AsyncClient(headers={"User-Agent": "Mozilla/5.0"}, follow_redirects=True) as client:
            while queue:
                curr_addr, depth = queue.pop(0)
                if depth >= max_depth:
                    continue

                # Fetch normal native ETH and ERC20 token transfers concurrently
                results = await asyncio.gather(
                    self._fetch_async(client, "account", "txlist", curr_addr),
                    self._fetch_async(client, "account", "tokentx", curr_addr),
                    return_exceptions=True
                )

                normal_txs = results[0] if isinstance(results[0], list) else []
                token_txs = results[1] if isinstance(results[1], list) else []

                for tx in normal_txs[:50]:
                    val_wei = int(tx.get("value", "0"))
                    if val_wei == 0:
                        continue
                    tx_hash = tx.get("hash", "").lower()
                    tx_from = tx.get("from", "").lower()
                    tx_to = tx.get("to", "").lower()
                    if not tx_hash or not tx_from or not tx_to:
                        continue

                    eth_amount = Decimal(val_wei) / Decimal(10**18)
                    rec = TransactionRecord(
                        tx_hash=tx_hash,
                        block_number=int(tx.get("blockNumber", 0)),
                        timestamp=int(tx.get("timeStamp", 0)),
                        from_address=tx_from,
                        to_address=tx_to,
                        amount=eth_amount,
                        raw_amount=str(val_wei),
                        asset_type=AssetType.NATIVE,
                        asset_symbol="ETH",
                        status=TxStatus.INCLUDED
                    )
                    try:
                        await self.loader.save_transaction_record(rec, publish_event=False)
                        ingested_count += 1
                    except Exception as exc:
                        print(f"[CRAWLER] Failed to save record {tx_hash}: {exc}")

                    other_addr = tx_to if tx_from == curr_addr else tx_from
                    if other_addr and other_addr not in visited:
                        visited.add(other_addr)
                        queue.append((other_addr, depth + 1))

                for tx in token_txs[:50]:
                    val_raw = int(tx.get("value", "0"))
                    if val_raw == 0:
                        continue
                    tx_hash = tx.get("hash", "").lower()
                    tx_from = tx.get("from", "").lower()
                    tx_to = tx.get("to", "").lower()
                    if not tx_hash or not tx_from or not tx_to:
                        continue

                    decimals = int(tx.get("tokenDecimal", 18) or 18)
                    symbol = tx.get("tokenSymbol", "ERC20")
                    contract_addr = tx.get("contractAddress", "").lower()
                    normalized_amount = Decimal(val_raw) / Decimal(10**decimals)

                    rec = TransactionRecord(
                        tx_hash=tx_hash,
                        block_number=int(tx.get("blockNumber", 0)),
                        timestamp=int(tx.get("timeStamp", 0)),
                        from_address=tx_from,
                        to_address=tx_to,
                        amount=normalized_amount,
                        raw_amount=str(val_raw),
                        asset_type=AssetType.ERC20,
                        asset_contract=contract_addr,
                        asset_symbol=symbol,
                        status=TxStatus.INCLUDED
                    )
                    try:
                        await self.loader.save_transaction_record(rec, publish_event=False)
                        ingested_count += 1
                    except Exception as exc:
                        print(f"[CRAWLER] Failed to save token record {tx_hash}: {exc}")

                    if tx_from == curr_addr and tx_to not in visited:
                        visited.add(tx_to)
                        queue.append((tx_to, depth + 1))

        print(f"[+] Async Crawl complete. Visited {len(visited)} wallets, ingested {ingested_count} transactions.")

        # Emit single batch GRAPH_UPDATED completion event
        try:
            from backend.services.event_bus import event_bus, GRAPH_UPDATED
            await event_bus.publish(GRAPH_UPDATED, {
                "root_address": root_clean,
                "ingested_count": ingested_count
            })
        except Exception as exc:
            print(f"[!] Warning publishing batch crawl event: {exc}")

        # Automatically update live watcher surveillance set if running
        try:
            from backend.main import watcher_instance
            if watcher_instance:
                for v in visited:
                    watcher_instance.watch_addresses.add(v)
                print(f"[+] Added {len(visited)} wallets to live WebSocket surveillance set.")
        except Exception as exc:
            print(f"[!] Note updating watcher surveillance: {exc}")

        return visited
