import os
import time
from decimal import Decimal, InvalidOperation
from datetime import datetime, timezone
from typing import Any

import requests
from dotenv import load_dotenv

from backend.core.cache import TraceCache, trace_cache
from backend.services.crosschain.bridge_decoder import BridgeDecoder

load_dotenv()

ETHERSCAN_API_KEY = os.getenv("ETHERSCAN_API_KEY")
ETHERSCAN_URL = "https://api.etherscan.io/v2/api"

if not ETHERSCAN_API_KEY:
    raise RuntimeError("ETHERSCAN_API_KEY is not set in environment variables.")


class EtherscanClient:
    """
    Production-grade API client for Etherscan V2 unified multi-chain integration,
    supporting Ethereum (chainid=1), Polygon (chainid=137), dynamic chain overrides,
    and Redis cache integration.
    """

    def __init__(
        self,
        api_key: str,
        chain_id: int = 1,
        rate_limit_delay: float = 0.25,
        cache: TraceCache | None = None,
    ):
        self.api_key = api_key
        self.chain_id = chain_id
        self.rate_limit_delay = rate_limit_delay
        self.cache = cache or trace_cache
        self.session = requests.Session()

    def _request(self, params: dict[str, Any], chain_id: int | None = None) -> dict[str, Any]:
        """
        Execute HTTP request to Etherscan V2 endpoint with caching and chain_id override.
        """
        active_chain_id = chain_id if chain_id is not None else self.chain_id
        
        # Build cache key for cacheable actions
        action = params.get("action", "")
        address = params.get("address", "")
        start_block = params.get("startblock", 0)
        end_block = params.get("endblock", 99999999)

        cache_key = None
        if address and action in ("txlist", "tokentx"):
            cache_key = self.cache.build_cache_key(
                chain_id=active_chain_id,
                wallet_address=address,
                start_block=int(start_block),
                end_block=int(end_block),
                action=action,
            )
            cached_response = self.cache.get_cached_trace(cache_key)
            if cached_response is not None:
                return cached_response

        payload = {
            "chainid": active_chain_id,
            "apikey": self.api_key,
            **params,
        }

        try:
            response = self.session.get(ETHERSCAN_URL, params=payload, timeout=15)
            response.raise_for_status()
            data = response.json()
        except requests.RequestException as exc:
            raise RuntimeError(f"Network communication failed with Etherscan: {exc}") from exc
        except ValueError as exc:
            raise RuntimeError("Failed to decode valid JSON response from Etherscan.") from exc

        # Cache successful responses
        if cache_key and data.get("status") == "1":
            self.cache.set_cached_trace(cache_key, data)

        time.sleep(self.rate_limit_delay)
        return data

    def get_block_number_by_time(
        self,
        timestamp: int,
        closest: str = "after",
        chain_id: int | None = None,
    ) -> int:
        data = self._request(
            {
                "module": "block",
                "action": "getblocknobytime",
                "timestamp": timestamp,
                "closest": closest,
            },
            chain_id=chain_id,
        )

        status = data.get("status")
        result = data.get("result")

        if status != "1" or not str(result).isdigit():
            return 0

        return int(result)

    def get_transaction_logs(
        self,
        tx_hash: str,
        chain_id: int | None = None,
    ) -> list[dict[str, Any]]:
        tx_hash = tx_hash.strip().lower()
        data = self._request(
            {
                "module": "proxy",
                "action": "eth_getTransactionReceipt",
                "txhash": tx_hash,
            },
            chain_id=chain_id,
        )

        result = data.get("result")
        if not isinstance(result, dict):
            return []

        return result.get("logs", [])

    def get_normal_transactions(
        self,
        target_wallet: str,
        start_block: int = 0,
        end_block: int = 99999999,
        page_size: int = 100,
        max_pages: int | None = None,
        chain_id: int | None = None,
    ) -> list[dict[str, Any]]:
        target_wallet = target_wallet.strip().lower()
        if not target_wallet.startswith("0x") or len(target_wallet) != 42:
            raise ValueError(f"Invalid Ethereum address format: {target_wallet}")

        active_chain_id = chain_id if chain_id is not None else self.chain_id
        chain_name = "polygon" if active_chain_id == 137 else "ethereum"
        native_symbol = "POL" if active_chain_id == 137 else "ETH"

        transactions: list[dict[str, Any]] = []
        page = 1

        while True:
            data = self._request(
                {
                    "module": "account",
                    "action": "txlist",
                    "address": target_wallet,
                    "startblock": start_block,
                    "endblock": end_block,
                    "page": page,
                    "offset": page_size,
                    "sort": "asc",
                },
                chain_id=active_chain_id,
            )

            status = data.get("status")
            message = data.get("message")
            result = data.get("result")

            if status != "1":
                if isinstance(result, str) and ("No transactions" in result or "No records" in result):
                    break
                raise RuntimeError(f"Etherscan API error: {message} / {result}")

            if not isinstance(result, list) or not result:
                break

            for tx in result:
                try:
                    value_wei = Decimal(str(tx.get("value", "0")))
                except (InvalidOperation, TypeError):
                    value_wei = Decimal(0)

                gas_used = int(tx.get("gasUsed", "0"))
                gas_price = int(tx.get("gasPrice", "0"))

                value_eth = (value_wei / Decimal(10**18)).normalize()
                gas_cost_eth = (Decimal(gas_used * gas_price) / Decimal(10**18)).normalize()

                timestamp = int(tx.get("timeStamp", "0"))
                datetime_utc = (
                    datetime.fromtimestamp(timestamp, tz=timezone.utc).isoformat()
                    if timestamp
                    else None
                )

                transactions.append(
                    {
                        "chain": chain_name,
                        "chain_id": active_chain_id,
                        "tx_hash": tx.get("hash"),
                        "block_number": int(tx.get("blockNumber", "0")),
                        "timestamp": timestamp,
                        "datetime_utc": datetime_utc,
                        "from_address": tx.get("from", "").lower(),
                        "to_address": tx.get("to", "").lower(),
                        "asset_type": native_symbol,
                        "asset_symbol": native_symbol,
                        "asset_amount": str(value_eth),
                        "gas_cost_native": str(gas_cost_eth),
                        "is_error": tx.get("isError") == "1",
                        "nonce": int(tx.get("nonce", "0")),
                        "raw_data": tx,
                    }
                )

            if len(result) < page_size:
                break

            page += 1
            if max_pages is not None and page > max_pages:
                break

        return transactions

    def get_erc20_transfers(
        self,
        target_wallet: str,
        start_block: int = 0,
        end_block: int = 99999999,
        page_size: int = 100,
        max_pages: int | None = None,
        chain_id: int | None = None,
    ) -> list[dict[str, Any]]:
        target_wallet = target_wallet.strip().lower()
        if not target_wallet.startswith("0x") or len(target_wallet) != 42:
            raise ValueError(f"Invalid Ethereum address format: {target_wallet}")

        active_chain_id = chain_id if chain_id is not None else self.chain_id
        chain_name = "polygon" if active_chain_id == 137 else "ethereum"

        transfers: list[dict[str, Any]] = []
        page = 1

        while True:
            data = self._request(
                {
                    "module": "account",
                    "action": "tokentx",
                    "address": target_wallet,
                    "startblock": start_block,
                    "endblock": end_block,
                    "page": page,
                    "offset": page_size,
                    "sort": "asc",
                },
                chain_id=active_chain_id,
            )

            status = data.get("status")
            message = data.get("message")
            result = data.get("result")

            if status != "1":
                if isinstance(result, str) and ("No transactions" in result or "No records" in result):
                    break
                raise RuntimeError(f"Etherscan Token API error: {message} / {result}")

            if not isinstance(result, list) or not result:
                break

            for tx in result:
                try:
                    raw_val = Decimal(str(tx.get("value", 0)))
                except (InvalidOperation, TypeError):
                    raw_val = Decimal(0)

                raw_dec = tx.get("tokenDecimal")
                try:
                    token_decimals = (
                        int(raw_dec)
                        if raw_dec is not None and str(raw_dec).strip().isdigit() and int(raw_dec) > 0
                        else 18
                    )
                except (ValueError, TypeError):
                    token_decimals = 18

                token_decimals = max(0, min(token_decimals, 77))
                scaled_amount = (raw_val / (Decimal(10) ** token_decimals)).normalize()

                token_symbol = tx.get("tokenSymbol")
                token_symbol = (
                    token_symbol.strip() if token_symbol and token_symbol.strip() else "TOKEN"
                )

                token_name = tx.get("tokenName")
                token_name = (
                    token_name.strip() if token_name and token_name.strip() else "Unknown Token"
                )

                timestamp = int(tx.get("timeStamp", "0"))
                datetime_utc = (
                    datetime.fromtimestamp(timestamp, tz=timezone.utc).isoformat()
                    if timestamp
                    else None
                )

                transfers.append(
                    {
                        "chain": chain_name,
                        "chain_id": active_chain_id,
                        "tx_hash": tx.get("hash"),
                        "block_number": int(tx.get("blockNumber", "0")),
                        "timestamp": timestamp,
                        "datetime_utc": datetime_utc,
                        "from_address": tx.get("from", "").lower(),
                        "to_address": tx.get("to", "").lower(),
                        "asset_type": "ERC20",
                        "asset_contract": tx.get("contractAddress", "").lower(),
                        "asset_symbol": token_symbol,
                        "asset_name": token_name,
                        "asset_amount": str(scaled_amount),
                        "raw_data": tx,
                    }
                )

            if len(result) < page_size:
                break

            page += 1
            if max_pages is not None and page > max_pages:
                break

        return transfers


def trace_crosschain_trail(
    target_wallet: str,
    client: EtherscanClient,
    bridge_decoder: BridgeDecoder | None = None,
    max_pages: int = 1,
) -> list[dict[str, Any]]:
    decoder = bridge_decoder or BridgeDecoder()
    target_wallet = target_wallet.strip().lower()

    # 1. Fetch L1 Ethereum Activity
    l1_normal = client.get_normal_transactions(target_wallet, max_pages=max_pages, chain_id=1)
    l1_tokens = client.get_erc20_transfers(target_wallet, max_pages=max_pages, chain_id=1)
    unified_trail: list[dict[str, Any]] = l1_normal + l1_tokens

    # 2. Inspect transactions for Bridge Deposits
    discovered_receivers: set[tuple[str, int]] = set()

    for tx in l1_tokens:
        tx_hash = tx.get("tx_hash")
        if not tx_hash:
            continue

        raw_logs = client.get_transaction_logs(tx_hash, chain_id=1)
        for log in raw_logs:
            decoded = decoder.decode_bridge_log(log)
            if decoded:
                receiver = decoded.get("deposit_receiver")
                timestamp = tx.get("timestamp") or int(time.time())
                if receiver:
                    discovered_receivers.add((receiver.lower(), timestamp))

    # 3. Follow L2 Forward Hook into Polygon (ChainID = 137)
    for receiver, bridge_timestamp in discovered_receivers:
        start_block_l2 = client.get_block_number_by_time(
            timestamp=bridge_timestamp, closest="after", chain_id=137
        )

        l2_normal = client.get_normal_transactions(
            receiver, start_block=start_block_l2, max_pages=max_pages, chain_id=137
        )
        l2_tokens = client.get_erc20_transfers(
            receiver, start_block=start_block_l2, max_pages=max_pages, chain_id=137
        )

        unified_trail.extend(l2_normal)
        unified_trail.extend(l2_tokens)

    return unified_trail