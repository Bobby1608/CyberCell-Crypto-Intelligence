import re
import os
import json
import time
import orjson
import structlog
import asyncio
from typing import Dict, Any, List
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from sse_starlette.sse import EventSourceResponse

from backend.services.event_bus import event_bus
from backend.services.graph.subgraph_extractor import SubgraphExtractor
from backend.services.risk.temporal_analyzer import (
    build_temporal_graph,
    extract_valid_fund_paths,
    evaluate_risk
)
from backend.services.attribution.vasp_engine import VASPEngine
from backend.api.auth import verify_api_key

router = APIRouter(dependencies=[Depends(verify_api_key)])

class SurveillanceRequest(BaseModel):
    address: str = Field(..., description="40-character hex Ethereum address prefixed with 0x")

def get_watcher():
    """Import and retrieve global watcher instance from main."""
    from backend.main import watcher_instance
    if watcher_instance is None:
        raise HTTPException(status_code=503, detail="Blockchain watcher service is initializing or unavailable.")
    return watcher_instance

@router.get("/health")
async def health_check():
    """
    Returns system connectivity status for Neo4j, RPC URL, and active surveillance addresses.
    """
    try:
        from backend.services.blockchain.async_graph_loader import AsyncNeo4jLoader
        loader = AsyncNeo4jLoader()
        # Verify Neo4j connectivity
        async with loader.driver.session() as session:
            await session.run("RETURN 1")
        neo4j_ok = True
        await loader.close()
    except Exception as exc:
        neo4j_ok = False

    rpc_url = os.getenv("SEPOLIA_WS_URL")
    rpc_ok = bool(rpc_url)

    watcher = get_watcher()
    active_addresses = list(watcher.watch_addresses) if watcher else []

    return {
        "status": "ok" if neo4j_ok else "degraded",
        "neo4j_connected": neo4j_ok,
        "neo4j_status": "connected" if neo4j_ok else "unavailable (Docker container down)",
        "rpc_configured": rpc_ok,
        "active_surveillance_count": len(active_addresses),
        "active_surveillance_addresses": active_addresses
    }

@router.get("/investigation/{address}")
async def investigate_wallet(address: str, crawl: bool = False):
    """
    Returns the downstream graph snapshot (nodes & edges) and NetworkX temporal risk analysis report.
    """
    clean_addr = address.strip().lower()
    if not re.match(r"^0x[a-fA-F0-9]{36,42}$", clean_addr):
        raise HTTPException(
            status_code=400,
            detail="Invalid Ethereum address. Must be a hex string prefixed with 0x."
        )

    try:
        # 1. Trigger On-Demand Multi-Hop Crawling & Ingestion ONLY if requested
        if crawl:
            try:
                from backend.services.blockchain.crawler import SepoliaCrawler
                crawler = SepoliaCrawler()
                await crawler.crawl_and_ingest(clean_addr, max_depth=2)
            except Exception as exc:
                print(f"[!] Warning running on-demand Sepolia crawler: {exc}")

        # 2. Register addresses into live WebSocket surveillance
        watcher = None
        try:
            from backend.main import watcher_instance
            watcher = watcher_instance
            if watcher:
                watcher.watch_addresses.add(clean_addr)
        except Exception:
            pass

        # 3. Extract complete downstream subgraph from Neo4j
        extractor = SubgraphExtractor()
        edge_records = await extractor.get_downstream_subgraph(clean_addr, max_depth=4)
        await extractor.close()

        if watcher:
            for rec in edge_records:
                if rec.get("source"):
                    watcher.watch_addresses.add(rec["source"].lower())
                if rec.get("target"):
                    watcher.watch_addresses.add(rec["target"].lower())

        G = build_temporal_graph(edge_records)
        causal_paths = extract_valid_fund_paths(G, clean_addr, max_depth=4)
        report = evaluate_risk(clean_addr, G, causal_paths)

        # Transform NetworkX multi-graph into nodes & edges payload
        nodes = []
        node_set = set(G.nodes()) | {clean_addr}
        
        vasp_engine = VASPEngine()
        vasp_attribution = None

        for n in node_set:
            attribution = vasp_engine.attribute_address(n)
            
            # Record global VASP attribution for the dashboard if found
            if attribution.is_vasp and not vasp_attribution:
                vasp_attribution = attribution
                
            nodes.append({
                "id": n,
                "label": "Investigated Wallet" if n == clean_addr else "Hop Node",
                "type": "exchange" if attribution.is_vasp else ("suspect" if n == clean_addr else "intermediary"),
                "is_vasp": attribution.is_vasp,
                "vasp_name": attribution.vasp_name
            })
            
        if not vasp_attribution:
            vasp_attribution = vasp_engine.attribute_terminal_path(G, clean_addr)

        edges = []
        for u, v, k, d in G.edges(data=True, keys=True):
            edges.append({
                "from": u,
                "to": v,
                "tx_hash": d.get("tx_hash"),
                "amount": str(d.get("amount", 0)),
                "asset_symbol": d.get("asset_symbol", "ETH"),
                "timestamp": d.get("timestamp"),
                "block_number": d.get("block_number")
            })

        report_dict = {
            "root_address": report.root_address,
            "paths_detected": report.paths_detected,
            "max_hop_depth": report.max_hop_depth,
            "risk_score": report.risk_score,
            "typologies": report.typologies.model_dump() if hasattr(report.typologies, "model_dump") else report.typologies.dict(),
            "reasons": report.reasons,
            "valid_paths": report.valid_paths,
            "vasp_attribution": vasp_attribution.model_dump() if hasattr(vasp_attribution, "model_dump") else vasp_attribution.dict()
        }

        return {
            "inputAddress": clean_addr,
            "graph": {
                "nodes": nodes,
                "edges": edges
            },
            "riskReport": report_dict
        }
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to fetch investigation graph: {str(exc)}")

@router.post("/surveillance/add")
async def add_surveillance_address(req: SurveillanceRequest):
    """
    Dynamically registers a target address into the live blockchain watcher surveillance set.
    """
    clean_addr = req.address.strip().lower()
    if not re.match(r"^0x[a-fA-F0-9]{36,42}$", clean_addr):
        raise HTTPException(
            status_code=400,
            detail="Invalid Ethereum address. Must be a hex string prefixed with 0x."
        )

    watcher = get_watcher()
    await watcher.add_surveillance(clean_addr)

    return {
        "status": "success",
        "message": f"Address {clean_addr} added to active surveillance set.",
        "address": clean_addr,
        "total_monitored": len(watcher.watch_addresses)
    }

@router.get("/stream/events")
async def stream_events():
    """
    SSE Endpoint streaming real-time event payloads (TX_INCLUDED, GRAPH_UPDATED, RISK_EVALUATED, SURVEILLANCE_ADDED).
    """
    async def sse_generator():
        logger = structlog.get_logger()
        async for payload in event_bus.subscribe():
            event_type = payload["event"]
            event_data = payload["data"]

            t5_ns = time.perf_counter_ns()
            t1_ns = event_data.get("t1_ns") or t5_ns

            backend_delta_ms = (t5_ns - t1_ns) / 1_000_000
            event_data["telemetry"] = {
                "t1_ns": t1_ns,
                "t5_ns": t5_ns,
                "backend_latency_ms": round(backend_delta_ms, 2)
            }

            logger.info(
                "sse_dispatch_telemetry",
                event_type=event_type,
                backend_latency_ms=round(backend_delta_ms, 2),
                t5_ns=t5_ns,
                t1_ns=t1_ns
            )

            yield {
                "event": event_type,
                "data": orjson.dumps(event_data).decode("utf-8"),
                "id": str(int(payload["timestamp"] * 1000))
            }

    return EventSourceResponse(sse_generator())
