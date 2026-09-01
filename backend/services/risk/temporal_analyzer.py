from decimal import Decimal
from typing import List, Dict, Any, Tuple
import networkx as nx

from backend.core.schemas import RiskAnalysisReport, TypologyFlags

def build_temporal_graph(edge_records: List[Dict[str, Any]]) -> nx.MultiDiGraph:
    G = nx.MultiDiGraph()
    for rec in edge_records:
        src = rec["source"].lower()
        dst = rec["target"].lower()
        G.add_edge(
            src,
            dst,
            key=rec["tx_hash"],
            source=src,
            target=dst,
            tx_hash=rec["tx_hash"],
            amount=Decimal(str(rec.get("amount") or 0)),
            asset_symbol=rec.get("asset_symbol", "ETH"),
            timestamp=int(rec.get("timestamp") or 0),
            block_number=int(rec.get("block_number") or 0)
        )
    return G

def extract_valid_fund_paths(
    G: nx.MultiDiGraph,
    root_address: str,
    max_depth: int = 4,
    max_skew_seconds: int = 60
) -> List[List[Dict[str, Any]]]:
    """
    Depth-first search enforcing chronological ordering along edges (t_next >= t_prev - max_skew_seconds).
    Returns list of edge-chains representing valid sequential fund movements.
    """
    root = root_address.lower()
    if root not in G:
        return []

    valid_paths: List[List[Dict[str, Any]]] = []

    def dfs(current_node: str, current_path: List[Dict[str, Any]], visited_nodes: set):
        if len(current_path) >= max_depth:
            return

        for _, next_node, _, edge_data in G.out_edges(current_node, data=True, keys=True):
            if next_node in visited_nodes:
                continue

            # Temporal constraint enforcement with clock skew tolerance
            if current_path:
                prev_timestamp = current_path[-1]["timestamp"]
                prev_block = current_path[-1]["block_number"]
                curr_timestamp = edge_data["timestamp"]
                curr_block = edge_data["block_number"]
                
                # Reject path if current tx is in an earlier block AND timestamp is older than allowable skew
                if curr_block < prev_block or (curr_timestamp < (prev_timestamp - max_skew_seconds)):
                    continue  # Violates causal time ordering

            extended_path = current_path + [edge_data]
            valid_paths.append(extended_path)
            dfs(next_node, extended_path, visited_nodes | {next_node})

    dfs(root, [], {root})
    return valid_paths

def evaluate_risk(root_address: str, G: nx.MultiDiGraph, causal_paths: List[List[Dict[str, Any]]]) -> RiskAnalysisReport:
    typologies = TypologyFlags()
    reasons: List[str] = []
    base_score = 0.0

    if not causal_paths:
        return RiskAnalysisReport(
            root_address=root_address,
            paths_detected=0,
            max_hop_depth=0,
            typologies=typologies,
            risk_score=0.0,
            reasons=["No active downstream transfer paths found."],
            valid_paths=[]
        )

    max_depth = max(len(p) for p in causal_paths)
    readable_paths = []

    for path in causal_paths:
        if not path:
            continue
        node_chain = [path[0]["source"]] + [edge["target"] for edge in path]
        readable_paths.append(node_chain)

        # 1. Check Rapid Pass-Through (Delta t <= 300s between hops)
        if len(path) >= 2:
            for i in range(len(path) - 1):
                dt = path[i+1]["timestamp"] - path[i]["timestamp"]
                if 0 <= dt <= 300:
                    typologies.rapid_pass_through = True
                    reasons.append(f"Rapid hop execution detected (Delta t = {dt}s between consecutive transfers).")
                    base_score += 0.35
                    break

        # 2. Check Peel Chain (Forwarding ratio 80% to 95%)
        if len(path) >= 2:
            inflow = path[0]["amount"]
            outflow = path[1]["amount"]
            if inflow > 0:
                ratio = float(outflow / inflow)
                if 0.80 <= ratio <= 0.95:
                    typologies.peel_chain = True
                    reasons.append(f"Peel chain pattern detected with {ratio*100:.1f}% value forwarding.")
                    base_score += 0.30

    # 3. Check Fan-Out Dispersion (Out-degree >= 3 from any single node)
    for node in G.nodes:
        if G.out_degree(node) >= 3:
            typologies.fan_out = True
            reasons.append(f"High fan-out dispersion identified on wallet {node} (Out-degree: {G.out_degree(node)}).")
            base_score += 0.20

    # Add depth multiplier
    if max_depth >= 2:
        base_score += 0.15

    final_score = min(1.0, round(base_score, 2))

    return RiskAnalysisReport(
        root_address=root_address,
        paths_detected=len(causal_paths),
        max_hop_depth=max_depth,
        typologies=typologies,
        risk_score=final_score,
        reasons=list(set(reasons)),
        valid_paths=readable_paths
    )