import time
import json
import orjson
import pytest
from unittest.mock import MagicMock, AsyncMock, patch
from fastapi.testclient import TestClient

from backend.core.schemas import TransactionRecord, AssetType, TxStatus
from backend.services.graph.subgraph_extractor import SubgraphExtractor
from backend.services.event_bus import event_bus, TX_INCLUDED
from backend.main import app

def test_transaction_record_telemetry_schema():
    """Verify TransactionRecord includes optional telemetry timestamp fields t0_sec and t1_ns."""
    now_ns = time.perf_counter_ns()
    now_sec = int(time.time())
    
    rec = TransactionRecord(
        tx_hash="0xabc123",
        block_number=12345,
        timestamp=now_sec,
        t0_sec=now_sec,
        t1_ns=now_ns,
        from_address="0x1111111111111111111111111111111111111111",
        to_address="0x2222222222222222222222222222222222222222",
        amount=1.5,
        raw_amount="1500000000000000000",
        asset_type=AssetType.NATIVE,
        asset_symbol="ETH",
        status=TxStatus.INCLUDED
    )

    assert rec.t0_sec == now_sec
    assert rec.t1_ns == now_ns

@pytest.mark.asyncio
async def test_subgraph_extractor_fails_clearly_when_neo4j_unavailable():
    """Verify SubgraphExtractor raises clear RuntimeError when Neo4j container/service is unavailable."""
    extractor = SubgraphExtractor()
    with patch.object(extractor.driver, "session", side_effect=Exception("Connection refused")):
        with pytest.raises(RuntimeError) as exc_info:
            await extractor.get_downstream_subgraph("0x1111111111111111111111111111111111111111")
        assert "Neo4j database service is unavailable" in str(exc_info.value)
    await extractor.close()

def test_cors_middleware_headers():
    """Verify CORS headers respond correctly for development origin without wildcard credential errors."""
    client = TestClient(app)
    response = client.options(
        "/api/v1/health",
        headers={
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "GET",
        }
    )
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == "http://localhost:5173"
    assert response.headers.get("access-control-allow-credentials") == "true"
