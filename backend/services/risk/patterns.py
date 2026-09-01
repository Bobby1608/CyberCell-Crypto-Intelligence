from decimal import Decimal, InvalidOperation
from typing import Any

import networkx as nx


def analyze_risk_indicators(
    transactions: list[dict[str, Any]],
    source_wallet: str,
    target_wallet: str,
    vasp_labels: dict[str, str],
    *,
    max_hops: int = 4,
    rapid_seconds: int = 180,
    max_paths: int = 1000,
) -> dict[str, list]:
    """
    Analyze blockchain transaction data for risk indicators.

    Detects:

    1. Address-level paths between source and target.
    2. Rapid movement of the same asset between transactions.
    3. Possible peel-chain behavior.
    4. Exposure to known VASP addresses.

    Parameters
    ----------
    transactions:
        List of normalized blockchain transactions.

        Expected fields include:
            tx_hash
            from_address
            to_address
            timestamp
            asset_amount
            asset_contract
            asset_symbol

    source_wallet:
        Starting wallet address.

    target_wallet:
        Destination wallet address.

    vasp_labels:
        Mapping of wallet addresses to VASP names.

    max_hops:
        Maximum number of edges allowed in a discovered path.

    rapid_seconds:
        Maximum time difference for rapid-movement detection.

    max_paths:
        Maximum number of paths returned.

    Returns
    -------
    dict
        {
            "paths": [...],
            "rapid_movements": [...],
            "possible_peel_chains": [...],
            "vasp_exposure": [...]
        }
    """

    # ------------------------------------------------------------------
    # Validate parameters
    # ------------------------------------------------------------------

    if max_hops < 1:
        raise ValueError("max_hops must be at least 1.")

    if rapid_seconds <= 0:
        raise ValueError("rapid_seconds must be greater than 0.")

    if max_paths <= 0:
        raise ValueError("max_paths must be greater than 0.")

    # ------------------------------------------------------------------
    # Normalize wallet/VASP addresses
    # ------------------------------------------------------------------

    source_wallet = source_wallet.strip().lower()
    target_wallet = target_wallet.strip().lower()

    normalized_vasps = {
        str(address).strip().lower(): name
        for address, name in vasp_labels.items()
        if address
    }

    # ------------------------------------------------------------------
    # Build transaction-level MultiDiGraph
    #
    # MultiDiGraph is important because two wallets can have multiple
    # transactions between them.
    # ------------------------------------------------------------------

    G = nx.MultiDiGraph()

    for tx in transactions:
        from_address = tx.get("from_address")
        to_address = tx.get("to_address")

        if not from_address or not to_address:
            continue

        from_address = str(from_address).strip().lower()
        to_address = str(to_address).strip().lower()

        # --------------------------------------------------------------
        # Parse transaction amount safely
        # --------------------------------------------------------------

        amount_raw = tx.get("asset_amount", "0")

        try:
            if isinstance(amount_raw, Decimal):
                amount = amount_raw
            else:
                amount = Decimal(str(amount_raw))
        except (InvalidOperation, ValueError, TypeError):
            continue

        # --------------------------------------------------------------
        # Parse timestamp safely
        # --------------------------------------------------------------

        try:
            timestamp = int(tx.get("timestamp", 0) or 0)
        except (ValueError, TypeError):
            timestamp = 0

        # --------------------------------------------------------------
        # Transaction hash
        # --------------------------------------------------------------

        tx_hash = tx.get("tx_hash")

        # --------------------------------------------------------------
        # Asset contract
        #
        # Support both:
        #   asset_contract
        #   token_contract
        # --------------------------------------------------------------

        asset_contract = (
            tx.get("asset_contract")
            or tx.get("token_contract")
        )

        if asset_contract:
            asset_contract = str(asset_contract).strip().lower()

        # --------------------------------------------------------------
        # Add transaction edge
        # --------------------------------------------------------------

        G.add_edge(
            from_address,
            to_address,
            key=tx_hash,
            tx_hash=tx_hash,
            timestamp=timestamp,
            amount=amount,
            asset_type=tx.get("asset_type"),
            asset_symbol=tx.get("asset_symbol"),
            asset_contract=asset_contract,
        )

    # ------------------------------------------------------------------
    # Result structure
    # ------------------------------------------------------------------

    results: dict[str, list] = {
        "paths": [],
        "rapid_movements": [],
        "possible_peel_chains": [],
        "vasp_exposure": [],
    }

    # ------------------------------------------------------------------
    # 1. ADDRESS-LEVEL PATH DETECTION
    #
    # We use a normal DiGraph here because paths are address-level,
    # not transaction-level.
    #
    # Example:
    #
    # Source -> A -> Target
    #
    # Multiple transactions between Source and A should not produce
    # duplicate paths.
    # ------------------------------------------------------------------

    path_graph = nx.DiGraph()

    for from_address, to_address in G.edges():
        path_graph.add_edge(from_address, to_address)

    if (
        source_wallet in path_graph
        and target_wallet in path_graph
    ):
        path_count = 0

        try:
            path_iterator = nx.all_simple_paths(
                path_graph,
                source=source_wallet,
                target=target_wallet,
                cutoff=max_hops,
            )

            for path in path_iterator:
                results["paths"].append(path)

                path_count += 1

                if path_count >= max_paths:
                    break

        except nx.NetworkXNoPath:
            pass

    # ------------------------------------------------------------------
    # 2. RAPID MOVEMENT DETECTION
    #
    # Looks for:
    #
    # incoming:
    #     Source -> Intermediate
    #
    # followed quickly by:
    #
    # outgoing:
    #     Intermediate -> Target
    #
    # Conditions:
    #
    # - outgoing transaction occurs after incoming transaction
    # - delta > 0
    # - delta <= rapid_seconds
    # - same asset contract
    # ------------------------------------------------------------------

    for intermediate in G.nodes:

        incoming_transactions = [
            data
            for _, _, data in G.in_edges(
                intermediate,
                data=True,
            )
        ]

        outgoing_transactions = [
            data
            for _, _, data in G.out_edges(
                intermediate,
                data=True,
            )
        ]

        if not incoming_transactions or not outgoing_transactions:
            continue

        for incoming_tx in incoming_transactions:

            incoming_time = incoming_tx.get("timestamp", 0)

            if not incoming_time:
                continue

            for outgoing_tx in outgoing_transactions:

                outgoing_time = outgoing_tx.get("timestamp", 0)

                if not outgoing_time:
                    continue

                # ------------------------------------------------------
                # Transaction must happen chronologically.
                # ------------------------------------------------------

                if outgoing_time <= incoming_time:
                    continue

                delta_seconds = outgoing_time - incoming_time

                # ------------------------------------------------------
                # Check rapid movement threshold.
                # ------------------------------------------------------

                if delta_seconds > rapid_seconds:
                    continue

                # ------------------------------------------------------
                # Only compare the same asset.
                # ------------------------------------------------------

                if (
                    incoming_tx.get("asset_contract")
                    != outgoing_tx.get("asset_contract")
                ):
                    continue

                results["rapid_movements"].append(
                    {
                        "address": intermediate,
                        "incoming_tx": incoming_tx.get("tx_hash"),
                        "outgoing_tx": outgoing_tx.get("tx_hash"),
                        "incoming_amount": str(
                            incoming_tx.get(
                                "amount",
                                Decimal("0"),
                            )
                        ),
                        "outgoing_amount": str(
                            outgoing_tx.get(
                                "amount",
                                Decimal("0"),
                            )
                        ),
                        "delta_seconds": delta_seconds,
                        "asset_symbol": outgoing_tx.get(
                            "asset_symbol"
                        ),
                    }
                )

    # ------------------------------------------------------------------
    # 3. POSSIBLE PEEL-CHAIN DETECTION
    #
    # A simple heuristic:
    #
    # Incoming amount = 100 USDT
    # Outgoing amount = 90 USDT
    #
    # Ratio = 90 / 100 = 0.90
    #
    # If ratio is between 0.85 and 0.95, flag it.
    #
    # IMPORTANT:
    # This is only a heuristic. It does NOT prove illicit activity.
    # ------------------------------------------------------------------

    PEEL_MIN_RATIO = Decimal("0.85")
    PEEL_MAX_RATIO = Decimal("0.95")

    for address in G.nodes:

        incoming_transactions = list(
            G.in_edges(
                address,
                data=True,
            )
        )

        outgoing_transactions = list(
            G.out_edges(
                address,
                data=True,
            )
        )

        if not incoming_transactions or not outgoing_transactions:
            continue

        for _, _, incoming_tx in incoming_transactions:

            incoming_amount = incoming_tx.get(
                "amount",
                Decimal("0"),
            )

            if incoming_amount <= 0:
                continue

            incoming_asset = incoming_tx.get(
                "asset_contract"
            )

            incoming_time = incoming_tx.get(
                "timestamp",
                0,
            )

            for _, _, outgoing_tx in outgoing_transactions:

                outgoing_amount = outgoing_tx.get(
                    "amount",
                    Decimal("0"),
                )

                if outgoing_amount <= 0:
                    continue

                # ------------------------------------------------------
                # Same asset only.
                # ------------------------------------------------------

                outgoing_asset = outgoing_tx.get(
                    "asset_contract"
                )

                if outgoing_asset != incoming_asset:
                    continue

                # ------------------------------------------------------
                # Make sure outgoing transaction is not before incoming.
                # ------------------------------------------------------

                outgoing_time = outgoing_tx.get(
                    "timestamp",
                    0,
                )

                if (
                    incoming_time
                    and outgoing_time
                    and outgoing_time < incoming_time
                ):
                    continue

                # ------------------------------------------------------
                # Calculate forwarding ratio.
                # ------------------------------------------------------

                ratio = outgoing_amount / incoming_amount

                if (
                    PEEL_MIN_RATIO
                    <= ratio
                    <= PEEL_MAX_RATIO
                ):
                    results["possible_peel_chains"].append(
                        {
                            "address": address,
                            "incoming_tx": incoming_tx.get(
                                "tx_hash"
                            ),
                            "outgoing_tx": outgoing_tx.get(
                                "tx_hash"
                            ),
                            "inflow": str(
                                incoming_amount
                            ),
                            "forwarded": str(
                                outgoing_amount
                            ),
                            "ratio": str(ratio),
                            "asset_symbol": outgoing_tx.get(
                                "asset_symbol"
                            ),
                        }
                    )

    # ------------------------------------------------------------------
    # 4. VASP EXPOSURE
    #
    # Check whether any graph node is present in the supplied VASP
    # address-label mapping.
    #
    # IMPORTANT:
    #
    # For MultiDiGraph:
    #
    # G.in_edges(node)
    #
    # returns:
    #
    #     (source, target)
    #
    # while:
    #
    # G.in_edges(node, keys=True)
    #
    # returns:
    #
    #     (source, target, key)
    #
    # We use the two-value form here because transaction keys are not
    # required for unique counterparty calculations.
    # ------------------------------------------------------------------

    for node in G.nodes:

        node_lower = node.lower()

        if node_lower not in normalized_vasps:
            continue

        # --------------------------------------------------------------
        # Unique addresses sending INTO the VASP.
        # --------------------------------------------------------------

        unique_in_sources = {
            source
            for source, _ in G.in_edges(node)
        }

        # --------------------------------------------------------------
        # Unique addresses receiving FROM the VASP.
        # --------------------------------------------------------------

        unique_out_targets = {
            target
            for _, target in G.out_edges(node)
        }

        results["vasp_exposure"].append(
            {
                "address": node,
                "vasp_name": normalized_vasps[node_lower],
                "is_terminal": G.out_degree(node) == 0,
                "in_degree": G.in_degree(node),
                "out_degree": G.out_degree(node),
                "unique_in_sources": len(
                    unique_in_sources
                ),
                "unique_out_targets": len(
                    unique_out_targets
                ),
            }
        )

    return results
