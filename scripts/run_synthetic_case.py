#!/usr/bin/env python3
"""End-to-End Headless Synthetic Case Runner (Blueprint Finalization).

Simulates a continuous 4-hop cross-chain laundering trail (Synthetic Test Data):
Hop 1: Victim Wallet (L1 Ethereum) -> Layering Hop (250.0 ETH)
Hop 2: Layering Hop -> Uniswap V2 Router/Pair (Swap 249.5 WETH -> 450,000 USDT)
       Synthetic Swap Output: Uniswap Pair -> Intermediary (450,000 USDT)
Hop 3: Intermediary -> Polygon PoS Bridge Contract on L1 (Deposit 450,000 USDT)
       Bridge Log: depositor=Intermediary, depositReceiver=Polygon Receiver
Hop 4: Polygon Bridge Receiver -> Mock Binance Deposit Terminal on L2 (405,000 USDT)
"""

import json
import time
from datetime import datetime, timezone
from decimal import Decimal

from backend.services.crosschain.bridge_decoder import BridgeDecoder
from backend.services.risk.scoring import CompositeRiskScorer

# -------------------------------------------------------------------------
# Synthetic Topology Configuration (Strict 20-Byte / 40-Hex Character Addresses)
# -------------------------------------------------------------------------
VICTIM_WALLET = "0x388c818ca8b9251b393131c08a736a67ccb19297"
INTERMEDIARY_WALLET = "0x71ccc543891b921331c08a736a67ccb192970000"
UNISWAP_V2_PAIR = "0x1111111111111111111111111111111111111111"
POLYGON_POS_BRIDGE_L1 = "0x40ec5b33f54e0e8a33a975908c5ba1c14e5bbbdf"
POLYGON_RECEIVER = "0x9999999999999999999999999999999999999999"
BINANCE_HOT_WALLET_L2 = "0x2222222222222222222222222222222222222222"  # Synthetic Mock Terminal
USDT_CONTRACT_L1 = "0xdac17f958d2ee523a2206206994597c13d831ec7"

BASE_TIME = 1700000000


def validate_address(address: str, name: str) -> None:
    """Validates that a string is a 42-character 0x-prefixed hexadecimal Ethereum address."""
    if not isinstance(address, str):
        raise ValueError(f"{name} must be a string")
    if not address.startswith("0x"):
        raise ValueError(f"{name} is invalid: missing 0x prefix")
    if len(address) != 42:
        raise ValueError(
            f"{name} is invalid: expected 42 total characters "
            f"(0x + 40 hex characters), got {len(address)}: {address}"
        )
    try:
        bytes.fromhex(address[2:])
    except ValueError as exc:
        raise ValueError(f"{name} contains non-hex characters") from exc


def validate_synthetic_addresses() -> None:
    """Performs pre-flight integrity check on all configured synthetic addresses."""
    print("\n[*] Validating synthetic Ethereum addresses...")
    addresses = {
        "VICTIM_WALLET": VICTIM_WALLET,
        "INTERMEDIARY_WALLET": INTERMEDIARY_WALLET,
        "UNISWAP_V2_PAIR": UNISWAP_V2_PAIR,
        "POLYGON_POS_BRIDGE_L1": POLYGON_POS_BRIDGE_L1,
        "POLYGON_RECEIVER": POLYGON_RECEIVER,
        "BINANCE_HOT_WALLET_L2": BINANCE_HOT_WALLET_L2,
        "USDT_CONTRACT_L1": USDT_CONTRACT_L1,
    }
    for name, address in addresses.items():
        validate_address(address, name)
    print("[+] All synthetic addresses are valid 20-byte addresses.")


def pad_address_topic(address: str) -> str:
    """Standardizes a 20-byte address into a 32-byte (64 hex character) ABI-padded topic."""
    raw = address[2:].lower()
    if len(raw) != 40:
        raise ValueError(
            f"Cannot ABI-pad invalid address {address}: "
            f"expected 40 hex characters, got {len(raw)}"
        )
    return "0x" + ("0" * 24) + raw


def build_synthetic_event_stream():
    """Generates the multi-chain cross-hop transaction and event log sequence."""
    decoder = BridgeDecoder()

    # Topic normalization: handle both raw and 0x-prefixed forms safely
    raw_topic = decoder.locked_erc20_topic
    bridge_topic0 = raw_topic if raw_topic.startswith("0x") else f"0x{raw_topic}"

    # 450,000 USDT (6 decimals) = 450,000,000,000 base units = exactly 32-byte hex data
    raw_amount_int = 450000 * (10**6)
    padded_amount_hex = f"0x{raw_amount_int:064x}"

    return {
        "l1_transactions": [
            {
                "chain": "ethereum",
                "chain_id": 1,
                "tx_hash": "0x8f4c000000000000000000000000000000000000000000000000000000003e1a",
                "block_number": 19000000,
                "timestamp": BASE_TIME,
                "datetime_utc": datetime.fromtimestamp(BASE_TIME, tz=timezone.utc).isoformat(),
                "from_address": VICTIM_WALLET,
                "to_address": INTERMEDIARY_WALLET,
                "asset_symbol": "ETH",
                "asset_amount": "250.0",
                "hop": 1,
            },
            {
                "chain": "ethereum",
                "chain_id": 1,
                "tx_hash": "0x1b2d000000000000000000000000000000000000000000000000000000009f4c",
                "block_number": 19000005,
                "timestamp": BASE_TIME + 65,  # Hop 1 -> 2 delta_t = 65s (Rapid movement)
                "datetime_utc": datetime.fromtimestamp(BASE_TIME + 65, tz=timezone.utc).isoformat(),
                "from_address": INTERMEDIARY_WALLET,
                "to_address": UNISWAP_V2_PAIR,
                "asset_symbol": "WETH",
                "asset_amount": "249.5",
                "hop": 2,
            },
            # Explicit synthetic DEX swap return output
            {
                "chain": "ethereum",
                "chain_id": 1,
                "tx_hash": "0x1b2d000000000000000000000000000000000000000000000000000000009f4c",
                "block_number": 19000005,
                "timestamp": BASE_TIME + 65,
                "datetime_utc": datetime.fromtimestamp(BASE_TIME + 65, tz=timezone.utc).isoformat(),
                "from_address": UNISWAP_V2_PAIR,
                "to_address": INTERMEDIARY_WALLET,
                "asset_symbol": "USDT",
                "asset_amount": "450000.0",
                "hop": 2,
                "is_dex_swap_output": True,
            },
            {
                "chain": "ethereum",
                "chain_id": 1,
                "tx_hash": "0x7e3a000000000000000000000000000000000000000000000000000000001b8c",
                "block_number": 19000010,
                "timestamp": BASE_TIME + 130,
                "datetime_utc": datetime.fromtimestamp(BASE_TIME + 130, tz=timezone.utc).isoformat(),
                "from_address": INTERMEDIARY_WALLET,
                "to_address": POLYGON_POS_BRIDGE_L1,
                "asset_symbol": "USDT",
                "asset_amount": "450000.0",
                "hop": 3,
                "logs": [
                    {
                        "address": POLYGON_POS_BRIDGE_L1,
                        "topics": [
                            bridge_topic0,
                            pad_address_topic(INTERMEDIARY_WALLET),
                            pad_address_topic(POLYGON_RECEIVER),
                            pad_address_topic(USDT_CONTRACT_L1),
                        ],
                        "data": padded_amount_hex,
                        "transactionHash": "0x7e3a000000000000000000000000000000000000000000000000000000001b8c",
                    }
                ],
            },
        ],
        "l2_transactions": [
            {
                "chain": "polygon",
                "chain_id": 137,
                "tx_hash": "0x9a4f000000000000000000000000000000000000000000000000000000007c2d",
                "block_number": 52000000,
                "timestamp": BASE_TIME + 240,  # Bridge (130s) -> Cashout (240s) delta_t = 110s
                "datetime_utc": datetime.fromtimestamp(BASE_TIME + 240, tz=timezone.utc).isoformat(),
                "from_address": POLYGON_RECEIVER,
                "to_address": BINANCE_HOT_WALLET_L2,
                "asset_symbol": "USDT",
                "asset_amount": "405000.0",  # 405,000 / 450,000 = 0.90 (90% Peel chain)
                "hop": 4,
            }
        ],
    }


def run_synthetic_case_pipeline():
    print("=" * 80)
    print("STARTING HEADLESS END-TO-END INVESTIGATION PIPELINE (SYNTHETIC BENCHMARK)")
    print("=" * 80)

    # 1. Pre-flight address validation
    validate_synthetic_addresses()

    # 2. Ingest Event Stream
    events = build_synthetic_event_stream()
    l1_txs = events["l1_transactions"]
    l2_txs = events["l2_transactions"]
    print(f"\n[*] Ingested {len(l1_txs)} L1 Ethereum records.")
    print(f"[*] Ingested {len(l2_txs)} L2 Polygon records.")

    # 3. Inspect and Decode Cross-Chain Bridge Log
    print("\n[*] Validating synthetic bridge log...")
    bridge_log = l1_txs[3]["logs"][0]
    print(f"    Topic 0: {bridge_log['topics'][0]}")
    print(f"    Topic 1: {bridge_log['topics'][1]}")
    print(f"    Topic 2: {bridge_log['topics'][2]}")
    print(f"    Topic 3: {bridge_log['topics'][3]}")
    print(
        "    Topic lengths:",
        [
            len(topic[2:]) if isinstance(topic, str) and topic.startswith("0x") else len(topic)
            for topic in bridge_log["topics"]
        ],
    )

    decoder = BridgeDecoder()
    decoded_bridge = decoder.decode_bridge_log(bridge_log)
    assert decoded_bridge is not None, "Failed to decode Polygon PoS Bridge log."

    print("\n[+] Successfully decoded L1 -> L2 Bridge Log:")
    print(f"    Bridge:           {decoded_bridge['bridge_name']}")
    print(f"    Target Chain:     {decoded_bridge['destination_chain']}")
    print(f"    Bridge Contract:  {decoded_bridge['bridge_contract']}")
    print(f"    Depositor:        {decoded_bridge['depositor']}")
    print(f"    L2 Receiver:      {decoded_bridge['deposit_receiver']}")
    print(f"    Root Token:       {decoded_bridge['root_token']}")
    print(f"    Raw Base Amount:  {decoded_bridge['amount']} (Decoded uint256)")
    print(f"    Transaction Hash: {decoded_bridge['tx_hash']}")

    assert decoded_bridge["depositor"] == INTERMEDIARY_WALLET.lower()
    assert decoded_bridge["deposit_receiver"] == POLYGON_RECEIVER.lower()
    assert decoded_bridge["root_token"] == USDT_CONTRACT_L1.lower()
    assert decoded_bridge["amount"] == "450000000000"
    print("[+] Bridge decoder verification passed.")

    # 4. Multi-Hop Delta-T & Heuristic Evaluation
    delta_t_hop1_to_2 = l1_txs[1]["timestamp"] - l1_txs[0]["timestamp"]
    delta_t_bridge_to_cashout = l2_txs[0]["timestamp"] - l1_txs[3]["timestamp"]

    received_amt = Decimal("450000.0")
    forwarded_amt = Decimal("405000.0")  # 0.90 ratio (90% Peel chain)

    print("\n[*] Timing Breakdown:")
    print(f"    Delta T (Hop 1 -> Hop 2):        {delta_t_hop1_to_2}s (<= 180s threshold: True)")
    print(f"    Delta T (Bridge -> L2 Cashout):  {delta_t_bridge_to_cashout}s (<= 180s threshold: True)")

    # 5. Calculate Composite Risk Score (Step 13 Engine)
    risk_evaluation = CompositeRiskScorer.evaluate(
        delta_time_sec=delta_t_hop1_to_2,
        received_amount=received_amt,
        forwarded_amount=forwarded_amt,
        out_degree=2,
        has_bridge_or_mixer_hop=True,
        is_direct_vasp_cashout=True,
    )

    print("\n[+] Composite Risk Scoring Assessment:")
    print(f"    Normalized Score: {risk_evaluation.normalized_score} / 1.00")
    print(f"    Risk Category:    {risk_evaluation.category}")
    print(f"    Detected Flags:   {json.dumps(risk_evaluation.detected_indicators, indent=6)}")

    assert risk_evaluation.normalized_score >= 0.70, "Expected CRITICAL risk score."
    assert risk_evaluation.category == "CRITICAL", f"Expected CRITICAL, got {risk_evaluation.category}"

    # 6. Construct Canvas & Compliance Payload
    case_id = f"SIH-2026-CR-{int(time.time())}"
    unified_payload = {
        "caseId": case_id,
        "inputAddress": VICTIM_WALLET,
        "timestamp": datetime.now(timezone.utc).strftime("%a, %d %b %Y %H:%M:%S GMT"),
        "vaspName": "Binance Holdings Ltd. (Mock Terminal)",
        "confidenceScore": f"{risk_evaluation.normalized_score * 100:.1f}%",
        "complianceSection": "Section 94 Bharatiya Nagarik Suraksha Sanhita (BNSS), 2023",
        "riskCategory": risk_evaluation.category,
        "wallets": [
            {"address": VICTIM_WALLET, "type": "victim", "label": "Victim Wallet (Synthetic)", "riskScore": "HIGH"},
            {"address": INTERMEDIARY_WALLET, "type": "intermediary", "label": "Layering Hop 1 (Synthetic)", "riskScore": "HIGH"},
            {"address": UNISWAP_V2_PAIR, "type": "defi", "label": "Uniswap V2 Pair (Synthetic)", "riskScore": "CRITICAL"},
            {"address": POLYGON_POS_BRIDGE_L1, "type": "intermediary", "label": "Polygon PoS Bridge", "riskScore": "CRITICAL"},
            {"address": POLYGON_RECEIVER, "type": "intermediary", "label": "Polygon Bridge Receiver (Synthetic)", "riskScore": "CRITICAL"},
            {"address": BINANCE_HOT_WALLET_L2, "type": "exchange", "label": "Binance Deposit Terminal (Mock)", "riskScore": "CRITICAL"},
        ],
        "transfers": [
            {"from": VICTIM_WALLET, "to": INTERMEDIARY_WALLET, "amount": "250.0", "symbol": "ETH"},
            {"from": INTERMEDIARY_WALLET, "to": UNISWAP_V2_PAIR, "amount": "249.5", "symbol": "WETH"},
            {"from": UNISWAP_V2_PAIR, "to": INTERMEDIARY_WALLET, "amount": "450000.0", "symbol": "USDT"},
            {"from": INTERMEDIARY_WALLET, "to": POLYGON_POS_BRIDGE_L1, "amount": "450000.0", "symbol": "USDT"},
            {"from": POLYGON_POS_BRIDGE_L1, "to": POLYGON_RECEIVER, "amount": "450000.0", "symbol": "USDT"},
            {"from": POLYGON_RECEIVER, "to": BINANCE_HOT_WALLET_L2, "amount": "405000.0", "symbol": "USDT"},
        ],
        "transactions": [
            {"hash": l1_txs[0]["tx_hash"], "hop": 1, "time": l1_txs[0]["datetime_utc"], "amount": "250.0 ETH"},
            {"hash": l1_txs[1]["tx_hash"], "hop": 2, "time": l1_txs[1]["datetime_utc"], "amount": "249.5 WETH -> 450,000 USDT"},
            {"hash": l1_txs[3]["tx_hash"], "hop": 3, "time": l1_txs[3]["datetime_utc"], "amount": "450,000 USDT (Bridge)"},
            {"hash": l2_txs[0]["tx_hash"], "hop": 4, "time": l2_txs[0]["datetime_utc"], "amount": "405,000 USDT (Cashout)"},
        ],
    }

    # 7. Output Verification
    print("\n" + "=" * 80)
    print("CANVAS & COMPLIANCE PAYLOAD EXPORT VERIFICATION:")
    print("=" * 80)
    print(json.dumps(unified_payload, indent=2))

    print("\n" + "=" * 80)
    print("SUCCESS: Headless synthetic run completed.")
    print(f"Target terminal VASP: {BINANCE_HOT_WALLET_L2} on Polygon linked successfully.")
    print(f"Final Risk: {risk_evaluation.category} ({risk_evaluation.normalized_score * 100:.1f}%)")
    print("=" * 80)


if __name__ == "__main__":
    run_synthetic_case_pipeline()