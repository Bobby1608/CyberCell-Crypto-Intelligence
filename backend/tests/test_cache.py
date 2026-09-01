import time
from unittest.mock import MagicMock
import pytest

from backend.core.cache import TraceCache
from backend.services.blockchain.ingestor import EtherscanClient


def test_cache_set_and_get():
    cache = TraceCache()
    if not cache.client:
        pytest.skip("Redis server is not running")

    key = "tx:1:0x388c818ca8b9251b393131c08a736a67ccb19297:0:99999999:tokentx"
    test_data = {"status": "1", "message": "OK", "result": [{"hash": "0xabc"}]}

    # Set cache with short TTL
    cache.set_cached_trace(key, test_data, ttl=60)

    # Retrieve
    retrieved = cache.get_cached_trace(key)
    assert retrieved == test_data

    # Cleanup
    cache.client.delete(key)


def test_etherscan_client_caching_latency_benchmark():
    cache = TraceCache()
    if not cache.client:
        pytest.skip("Redis server is not running")

    client = EtherscanClient(api_key="TEST_KEY", cache=cache, rate_limit_delay=0.0)
    wallet = "0x388c818ca8b9251b393131c08a736a67ccb19297"

    # Setup mocked HTTP call with simulated 0.5s network delay
    mock_payload = {
        "status": "1",
        "message": "OK",
        "result": [
            {
                "hash": "0x1111111111111111111111111111111111111111111111111111111111111111",
                "blockNumber": "1000",
                "timeStamp": "1700000000",
                "from": wallet,
                "to": "0x40ec5b33f54e0e8a33a975908c5ba1c14e5bbbdf",
                "value": "100000000",
                "tokenDecimal": "6",
                "tokenSymbol": "USDC",
                "tokenName": "USD Coin",
                "contractAddress": "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
            }
        ],
    }

    def slow_network_call(*args, **kwargs):
        time.sleep(0.3)
        mock_resp = MagicMock()
        mock_resp.json.return_value = mock_payload
        return mock_resp

    client.session.get = MagicMock(side_effect=slow_network_call)

    # Clear possible existing key
    cache_key = cache.build_cache_key(
        chain_id=1, wallet_address=wallet, start_block=0, end_block=99999999, action="tokentx"
    )
    cache.client.delete(cache_key)

    # Call 1: Cache Miss (Triggers network request)
    t0 = time.perf_counter()
    txs_1 = client.get_erc20_transfers(wallet, max_pages=1)
    t1 = time.perf_counter()
    miss_time_ms = (t1 - t0) * 1000

    # Call 2: Cache Hit (Reads directly from Redis in < 50ms)
    t2 = time.perf_counter()
    txs_2 = client.get_erc20_transfers(wallet, max_pages=1)
    t3 = time.perf_counter()
    hit_time_ms = (t3 - t2) * 1000

    # Assertions
    assert len(txs_1) == 1
    assert len(txs_2) == 1
    assert txs_1 == txs_2
    assert miss_time_ms >= 300  # Network call took >= 300ms
    assert hit_time_ms < 50     # Cache hit resolves in < 50ms

    # Cleanup
    cache.client.delete(cache_key)