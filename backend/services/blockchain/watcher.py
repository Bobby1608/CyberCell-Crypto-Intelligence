import os
import asyncio
import time
from decimal import Decimal
from typing import Set, Dict, Tuple, Optional, Callable, List
from web3 import AsyncWeb3, WebSocketProvider
from eth_abi import decode
from dotenv import load_dotenv
import redis.asyncio as redis

from backend.core.schemas import TransactionRecord, TxStatus, AssetType
from backend.services.blockchain.async_graph_loader import AsyncNeo4jLoader
from backend.services.graph.subgraph_extractor import SubgraphExtractor
from backend.services.risk.temporal_analyzer import build_temporal_graph, extract_valid_fund_paths, evaluate_risk

load_dotenv()

ERC20_TRANSFER_TOPIC = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"

ERC20_METADATA_ABI = [
    {"constant": True, "inputs": [], "name": "decimals", "outputs": [{"name": "", "type": "uint8"}], "type": "function", "stateMutability": "view"},
    {"constant": True, "inputs": [], "name": "symbol", "outputs": [{"name": "", "type": "string"}], "type": "function", "stateMutability": "view"}
]

def clean_address_from_topic(topic_bytes) -> str:
    topic_hex = topic_bytes.hex() if isinstance(topic_bytes, (bytes, bytearray)) else str(topic_bytes)
    return ("0x" + topic_hex[-40:]).lower()

class BlockchainWatcher:
    def __init__(
        self,
        ws_url: str,
        watch_addresses: List[str],
        root_suspect_address: str,
        on_transaction: Optional[Callable[[TransactionRecord], None]] = None
    ):
        self.ws_url = ws_url
        self.watch_addresses: Set[str] = {a.lower() for a in watch_addresses}
        self.root_suspect = root_suspect_address.lower()
        self.on_transaction = on_transaction
        self.token_metadata_cache: Dict[str, Tuple[int, str]] = {}
        redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
        self.redis = redis.from_url(redis_url, decode_responses=True)
        self.db_loader = AsyncNeo4jLoader()
        self.extractor = SubgraphExtractor()
        self._background_tasks: Set[asyncio.Task] = set()

    async def _get_token_metadata(self, w3: AsyncWeb3, contract_address: str) -> Tuple[int, str]:
        contract_lower = contract_address.lower()
        if contract_lower in self.token_metadata_cache:
            return self.token_metadata_cache[contract_lower]

        try:
            checksum_addr = AsyncWeb3.to_checksum_address(contract_address)
            contract = w3.eth.contract(address=checksum_addr, abi=ERC20_METADATA_ABI)
            decimals = await contract.functions.decimals().call()
            symbol = await contract.functions.symbol().call()
            self.token_metadata_cache[contract_lower] = (int(decimals), str(symbol))
            return int(decimals), str(symbol)
        except Exception:
            return 18, "ERC20"

    async def _is_duplicate(self, tx_hash: str) -> bool:
        try:
            # SETNX returns True if key was set (new), False if it already existed
            is_new = await self.redis.set(f"dedup:{tx_hash}", 1, nx=True, ex=86400)
            return not is_new
        except Exception as e:
            print(f"[!] Redis dedup error: {e}")
            return False

    async def add_surveillance(self, address: str):
        addr_clean = address.strip().lower()
        self.watch_addresses.add(addr_clean)
        try:
            await self.redis.sadd(f"watchlist:{self.root_suspect}", addr_clean)
        except Exception as e:
            print(f"[!] Redis sadd error: {e}")
        print(f"[+] Added address to surveillance: {addr_clean}")
        try:
            from backend.services.event_bus import event_bus, SURVEILLANCE_ADDED
            await event_bus.publish(SURVEILLANCE_ADDED, {"address": addr_clean})
        except Exception as exc:
            print(f"[!] Warning publishing SURVEILLANCE_ADDED: {exc}")

    async def _run_risk_analysis(self):
        """Background task: query subgraph, run causal NetworkX traversal, and evaluate heuristics."""
        try:
            edge_records = await self.extractor.get_downstream_subgraph(self.root_suspect, max_depth=4)
            if not edge_records:
                return

            def _compute_risk_sync(records, root):
                from backend.services.risk.temporal_analyzer import build_temporal_graph, extract_valid_fund_paths, evaluate_risk
                G = build_temporal_graph(records)
                causal_paths = extract_valid_fund_paths(G, root, max_depth=4)
                return evaluate_risk(root, G, causal_paths)

            report = await asyncio.to_thread(_compute_risk_sync, edge_records, self.root_suspect)

            print("\n" + "="*50)
            print(f"[RISK ENGINE] Evaluated Paths from {self.root_suspect}")
            print(f"Paths: {report.paths_detected} | Max Depth: {report.max_hop_depth} | Score: {report.risk_score}")
            print(f"Typologies: Rapid: {report.typologies.rapid_pass_through} | Peel: {report.typologies.peel_chain} | Fan-Out: {report.typologies.fan_out}")
            for r in report.reasons:
                print(f" ➔ {r}")
            print("="*50 + "\n")

            # Hook into Event Bus
            try:
                from backend.services.event_bus import event_bus, RISK_EVALUATED
                from backend.services.attribution.vasp_engine import VASPEngine
                typology_dict = report.typologies.model_dump() if hasattr(report.typologies, "model_dump") else report.typologies.dict()

                # Run VASP attribution for the root suspect so the SSE event carries it
                try:
                    vasp_engine = VASPEngine()
                    vasp_result = vasp_engine.attribute_terminal_path(G, self.root_suspect)
                    vasp_dict = vasp_result.model_dump() if hasattr(vasp_result, "model_dump") else vasp_result.dict()
                except Exception as vasp_exc:
                    print(f"[!] VASP attribution skipped in SSE event: {vasp_exc}")
                    vasp_dict = None

                await event_bus.publish(RISK_EVALUATED, {
                    "root_address": report.root_address,
                    "paths_detected": report.paths_detected,
                    "max_hop_depth": report.max_hop_depth,
                    "risk_score": report.risk_score,
                    "typologies": typology_dict,
                    "reasons": report.reasons,
                    "valid_paths": report.valid_paths,
                    "vasp_attribution": vasp_dict
                })
            except Exception as exc:
                print(f"[!] Warning publishing RISK_EVALUATED event: {exc}")
        except Exception as e:
            print(f"[!] Risk analysis error: {e}")

    async def start(self):
        print("[*] Rehydrating watch list from Redis...")
        try:
            # Seed initial addresses to Redis
            for addr in self.watch_addresses:
                await self.redis.sadd(f"watchlist:{self.root_suspect}", addr)
            # Rehydrate from Redis
            saved_addresses = await self.redis.smembers(f"watchlist:{self.root_suspect}")
            if saved_addresses:
                self.watch_addresses.update(saved_addresses)
        except Exception as e:
            print(f"[!] Redis watchlist error: {e}")

        print("[*] Initializing Neo4j Schema...")
        try:
            await self.db_loader.init_schema()
        except Exception as e:
            print(f"[!] DB Schema init warning: {e}")

        print("[*] Connecting to Sepolia WebSocket...")
        async with AsyncWeb3(WebSocketProvider(self.ws_url, websocket_kwargs={"max_size": 10_485_760})) as w3:
            print(f"[+] Connected. Monitored set: {list(self.watch_addresses)}")
            await w3.eth.subscribe("newHeads")
            
            async for payload in w3.socket.process_subscriptions():
                t1_ns = time.perf_counter_ns()
                header = payload.get("result")
                if not header or not header.get("hash"):
                    continue
                    
                block_hash = header.get("hash")
                block = await w3.eth.get_block(block_hash, full_transactions=True)
                block_num = block.get("number")
                block_time = block.get("timestamp")
                
                print(f"[~] Block {block_num} received ({len(block.get('transactions', []))} native TXs)")
                
                # --- 1. Process Native ETH Transactions ---
                for tx in block.get("transactions", []):
                    if tx.get("value", 0) == 0:
                        continue

                    tx_hash_raw = tx.get("hash")
                    if not tx_hash_raw:
                        continue
                    if hasattr(tx_hash_raw, "hex"):
                        tx_hash = tx_hash_raw.hex()
                    elif isinstance(tx_hash_raw, bytes):
                        tx_hash = tx_hash_raw.hex()
                    else:
                        tx_hash = str(tx_hash_raw)
                    tx_hash = tx_hash.lower()

                    tx_from = (tx.get("from") or "").lower()
                    tx_to = (tx.get("to") or "").lower()
                    
                    if tx_from in self.watch_addresses or tx_to in self.watch_addresses:
                        if await self._is_duplicate(tx_hash):
                            continue
                            
                        wei_amount = tx.get("value", 0)
                        eth_amount = Decimal(wei_amount) / Decimal(10**18)
                        
                        record = TransactionRecord(
                            tx_hash=tx_hash,
                            block_number=block_num,
                            timestamp=block_time,
                            t0_sec=block_time,
                            t1_ns=t1_ns,
                            from_address=tx_from,
                            to_address=tx_to,
                            amount=eth_amount,
                            raw_amount=str(wei_amount),
                            asset_type=AssetType.NATIVE,
                            asset_symbol="ETH",
                            status=TxStatus.INCLUDED
                        )
                        await self._dispatch(record)

                # --- 2. Process ERC-20 Token Transfers ---
                try:
                    if self.watch_addresses:
                        # Pad watched addresses to 32-byte topics for targeted RPC filtering
                        addr_topics = ["0x000000000000000000000000" + a[2:].lower() for a in self.watch_addresses if len(a) == 42]
                        
                        logs_from = await w3.eth.get_logs({
                            "blockHash": block_hash,
                            "topics": [ERC20_TRANSFER_TOPIC, addr_topics]
                        })
                        logs_to = await w3.eth.get_logs({
                            "blockHash": block_hash,
                            "topics": [ERC20_TRANSFER_TOPIC, None, addr_topics]
                        })
                        
                        # Merge and deduplicate matching log objects
                        seen_log_keys = set()
                        logs = []
                        for l in list(logs_from) + list(logs_to):
                            key = (l.get("transactionHash"), l.get("logIndex"))
                            if key not in seen_log_keys:
                                seen_log_keys.add(key)
                                logs.append(l)

                        for log in logs:
                            topics = log.get("topics", [])
                            if len(topics) < 3:
                                continue
                            
                            log_from = clean_address_from_topic(topics[1])
                            log_to = clean_address_from_topic(topics[2])
                            
                            if log_from in self.watch_addresses or log_to in self.watch_addresses:
                                tx_hash_raw = log.get("transactionHash")
                                if not tx_hash_raw:
                                    continue
                                if hasattr(tx_hash_raw, "hex"):
                                    tx_hash = tx_hash_raw.hex()
                                elif isinstance(tx_hash_raw, bytes):
                                    tx_hash = tx_hash_raw.hex()
                                else:
                                    tx_hash = str(tx_hash_raw)
                                tx_hash = tx_hash.lower()

                                if await self._is_duplicate(tx_hash):
                                    continue

                                raw_data = log.get("data")
                                if isinstance(raw_data, str):
                                    raw_data = bytes.fromhex(raw_data.replace("0x", ""))
                                if not raw_data:
                                    continue
                                
                                try:
                                    decoded_value = decode(["uint256"], raw_data)[0]
                                except Exception:
                                    continue

                                if decoded_value == 0:
                                    continue

                                contract_addr = log.get("address", "").lower()
                                
                                decimals, symbol = await self._get_token_metadata(w3, contract_addr)
                                normalized_amount = Decimal(decoded_value) / Decimal(10**decimals)
                                
                                record = TransactionRecord(
                                    tx_hash=tx_hash,
                                    block_number=block_num,
                                    timestamp=block_time,
                                    t0_sec=block_time,
                                    t1_ns=t1_ns,
                                    from_address=log_from,
                                    to_address=log_to,
                                    amount=normalized_amount,
                                    raw_amount=str(decoded_value),
                                    asset_type=AssetType.ERC20,
                                    asset_contract=contract_addr,
                                    asset_symbol=symbol,
                                    status=TxStatus.INCLUDED
                                )
                                await self._dispatch(record)
                except Exception as e:
                    print(f"[!] Error checking block logs: {e}")

    async def _dispatch(self, record: TransactionRecord):
        try:
            await self.db_loader.save_transaction_record(record)
        except Exception as e:
            print(f"[!] Failed to save record to Neo4j: {e}")

        # Hook into Event Bus: Publish TX_INCLUDED
        try:
            from backend.services.event_bus import event_bus, TX_INCLUDED
            await event_bus.publish(TX_INCLUDED, {
                "tx_hash": record.tx_hash,
                "from_address": record.from_address,
                "to_address": record.to_address,
                "amount": float(record.amount),
                "asset_symbol": record.asset_symbol or "ETH",
                "block_number": record.block_number,
                "timestamp": record.timestamp,
                "t1_ns": record.t1_ns
            })
        except Exception as exc:
            print(f"[!] Warning publishing TX_INCLUDED: {exc}")

        # Dynamically add counterparties to watched set for real-time downstream hop monitoring
        if record.from_address:
            addr = record.from_address.lower()
            self.watch_addresses.add(addr)
            try:
                await self.redis.sadd(f"watchlist:{self.root_suspect}", addr)
            except:
                pass
        if record.to_address:
            addr = record.to_address.lower()
            self.watch_addresses.add(addr)
            try:
                await self.redis.sadd(f"watchlist:{self.root_suspect}", addr)
            except:
                pass

        print(f"\n[+] Detected & Persisted: {record.tx_hash[:16]}... ({record.amount} {record.asset_symbol})")
        print(f"[+] Active watch set dynamically expanded ({len(self.watch_addresses)} addresses monitored)")

        # Trigger background risk traversal with strong task reference
        task = asyncio.create_task(self._run_risk_analysis())
        self._background_tasks.add(task)
        task.add_done_callback(self._background_tasks.discard)

if __name__ == "__main__":
    url = os.getenv("SEPOLIA_WS_URL")
    # Define your testnet wallet chain
    wallet_a = "0xb1ad40e588959c203617cd55b5cd32cc2795a9ff"  # Root suspect
    wallet_b = "0x8ee589da48e2a3a51030f60a4bb51241bb18a07"  # Hop 1
    
    if not url:
        raise ValueError("Set SEPOLIA_WS_URL in .env")
        
    watcher = BlockchainWatcher(
        ws_url=url,
        watch_addresses=[wallet_a, wallet_b],
        root_suspect_address=wallet_a
    )
    try:
        asyncio.run(watcher.start())
    except KeyboardInterrupt:
        print("\n[!] Watcher stopped.")