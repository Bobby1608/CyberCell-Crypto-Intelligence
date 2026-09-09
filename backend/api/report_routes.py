from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from backend.services.reporting.lea_dossier_generator import LEADossierGenerator
from backend.services.attribution.vasp_engine import VASPEngine
from backend.services.graph.subgraph_extractor import SubgraphExtractor
from backend.services.risk.temporal_analyzer import build_temporal_graph, extract_valid_fund_paths, evaluate_risk
from backend.api.auth import verify_api_key

report_router = APIRouter(prefix="/api/v1/investigation", tags=["Investigation Reports"])
vasp_engine = VASPEngine()

@report_router.get("/{address}/export-report", dependencies=[Depends(verify_api_key)])
async def export_investigation_dossier(address: str, ncrp_ack: str = "2026/NCRP/MH/0048192"):
    clean_addr = address.lower()
    
    # 1. Fetch graph data
    extractor = SubgraphExtractor()
    try:
        edge_records = await extractor.get_downstream_subgraph(clean_addr, max_depth=4)
    finally:
        await extractor.close()
        
    if not edge_records:
        raise HTTPException(status_code=404, detail="No transaction graph found for this address.")
    
    # 2. Extract transactions and terminal node
    transactions = []
    terminal_address = clean_addr
    for record in edge_records:
        tx_hash = record.get("tx_hash")
        if tx_hash:
            tx_hash = tx_hash if tx_hash.startswith("0x") else "0x" + tx_hash
            
        transactions.append({
            "tx_hash": tx_hash,
            "from": record.get("source"),
            "to": record.get("target"),
            "amount": record.get("amount", 0.0),
            "asset": record.get("asset_symbol", "ETH"),
            "timestamp": record.get("timestamp", 0)
        })
        terminal_address = record.get("target")

    # Chronological sort (BUG 5)
    transactions.sort(key=lambda x: x["timestamp"])

    # 3. Compute VASP Attribution
    attribution = vasp_engine.attribute_address(terminal_address)
    
    # 4. Compute Dynamic Risk Score (BUG 1)
    G = build_temporal_graph(edge_records)
    causal_paths = extract_valid_fund_paths(G, clean_addr, max_depth=4)
    risk_report = evaluate_risk(clean_addr, G, causal_paths)
    
    typology_list = []
    if risk_report.typologies.rapid_pass_through:
        typology_list.append("Rapid Pass-Through")
    if risk_report.typologies.peel_chain:
        typology_list.append("Peel-Chain Geometry")
    if risk_report.typologies.fan_out:
        typology_list.append("Fan-Out Dispersion")
    typology_list.extend(risk_report.reasons)
    
    # 5. Generate PDF buffer
    pdf_buffer = LEADossierGenerator.generate_dossier(
        case_id=f"CASE-{clean_addr[:8].upper()}",
        ncrp_ack=ncrp_ack,
        suspect_address=clean_addr,
        risk_score=risk_report.risk_score,
        typologies=typology_list,
        attribution=attribution,
        transactions=transactions
    )
    
    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=LEA_Dossier_{clean_addr[:10]}.pdf"}
    )
