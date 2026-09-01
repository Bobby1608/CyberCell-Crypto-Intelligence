"""Deterministic Money Laundering Heuristics & Composite Risk Scoring Engine.

Implements graph-level transaction topology pattern detectors:
- Rapid Pass-Through (Residence time delta_t <= 180s)
- Peel Chain Forwarding (85% <= ratio <= 95%)
- High-Entropy Fan-Out / Fan-In Dispersion
- Mixer & Privacy Protocol Interactivity
"""

from dataclasses import dataclass
from typing import Any

RAPID_PASSTHROUGH_MAX_SECONDS = 180
PEEL_CHAIN_MIN_RATIO = 0.85
PEEL_CHAIN_MAX_RATIO = 0.95
FAN_OUT_MIN_DEGREE = 3
FAN_IN_MIN_DEGREE = 3

KNOWN_MIXER_ADDRESSES = {
    # Tornado Cash Core Routers / Pools
    "0xd90e2f925da726b50c4ed8d0fb90ad053324f31b",
    "0x722122df12d4e14e13ac3b6895a86e84145b6967",
    "0x12d66f87a04a9e220743712ce6d9bb1b5616b8fc",
    "0x47ce0c6ed5b0ce3d3a51fdb1c52dc66a7c3c2936",
    "0x910cbd523d972eb0a6f4cae4618ad62622b39dbf",
    "0xa160cdab225685da1d56aa342ad8841c3b53f291",
}


@dataclass
class HeuristicEvaluationResult:
    score: int
    category: str
    flags: dict[str, bool]
    details: dict[str, Any]


class LaunderingHeuristicsEngine:
    """Evaluates multi-hop transaction topologies against AML heuristic patterns."""

    @staticmethod
    def is_mixer_address(address: str) -> bool:
        """Checks if address matches sanctioned privacy protocol contracts."""
        if not address:
            return False
        return address.lower() in KNOWN_MIXER_ADDRESSES

    @staticmethod
    def detect_rapid_passthrough(
        incoming_timestamp: int | None, outgoing_timestamp: int | None
    ) -> bool:
        """Flags hops where intermediate residence time is <= 180 seconds."""
        if incoming_timestamp is None or outgoing_timestamp is None:
            return False
        delta_t = outgoing_timestamp - incoming_timestamp
        return 0 <= delta_t <= RAPID_PASSTHROUGH_MAX_SECONDS

    @staticmethod
    def detect_peel_chain(
        received_amount: float, forwarded_amount: float
    ) -> tuple[bool, float]:
        """Flags peel chain forwarding where 85% to 95% of incoming value is routed downstream."""
        if received_amount <= 0:
            return False, 0.0
        ratio = forwarded_amount / received_amount
        is_peel = PEEL_CHAIN_MIN_RATIO <= ratio <= PEEL_CHAIN_MAX_RATIO
        return is_peel, round(ratio, 4)

    @staticmethod
    def detect_fan_out(out_degree: int) -> bool:
        """Flags 1-to-many layering dispersion topologies."""
        return out_degree >= FAN_OUT_MIN_DEGREE

    @staticmethod
    def detect_fan_in(in_degree: int) -> bool:
        """Flags many-to-1 terminal integration topologies."""
        return in_degree >= FAN_IN_MIN_DEGREE

    @classmethod
    def evaluate_node_risk(
        cls,
        *,
        address: str,
        in_degree: int = 0,
        out_degree: int = 0,
        incoming_timestamp: int | None = None,
        outgoing_timestamp: int | None = None,
        received_amount: float = 0.0,
        forwarded_amount: float = 0.0,
        direct_mixer_link: bool = False,
    ) -> HeuristicEvaluationResult:
        """Computes composite risk score (0-100) and outputs heuristic audit breakdown."""
        flags: dict[str, bool] = {}
        details: dict[str, Any] = {}

        # 1. Mixer Interaction (+40)
        is_mixer = direct_mixer_link or cls.is_mixer_address(address)
        flags["is_mixer"] = is_mixer
        details["is_mixer"] = is_mixer

        # 2. Peel Chain Forwarding (+30)
        is_peel, ratio = cls.detect_peel_chain(received_amount, forwarded_amount)
        flags["peel_chain"] = is_peel
        details["peel_chain_ratio"] = ratio

        # 3. Rapid Pass-Through (+25)
        is_rapid = cls.detect_rapid_passthrough(incoming_timestamp, outgoing_timestamp)
        flags["rapid_passthrough"] = is_rapid
        if incoming_timestamp and outgoing_timestamp:
            details["residence_time_sec"] = outgoing_timestamp - incoming_timestamp
        else:
            details["residence_time_sec"] = None

        # 4. Fan-Out Dispersion (+20)
        is_fan_out = cls.detect_fan_out(out_degree)
        flags["fan_out"] = is_fan_out
        details["out_degree"] = out_degree

        # 5. Fan-In Consolidation (+15)
        is_fan_in = cls.detect_fan_in(in_degree)
        flags["fan_in"] = is_fan_in
        details["in_degree"] = in_degree

        # Composite Weighted Scoring
        raw_score = 0
        if flags["is_mixer"]:
            raw_score += 40
        if flags["peel_chain"]:
            raw_score += 30
        if flags["rapid_passthrough"]:
            raw_score += 25
        if flags["fan_out"]:
            raw_score += 20
        if flags["fan_in"]:
            raw_score += 15

        final_score = min(100, raw_score)

        if final_score >= 70:
            category = "CRITICAL"
        elif final_score >= 35:
            category = "MEDIUM"
        else:
            category = "CLEAN"

        return HeuristicEvaluationResult(
            score=final_score,
            category=category,
            flags=flags,
            details=details,
        )