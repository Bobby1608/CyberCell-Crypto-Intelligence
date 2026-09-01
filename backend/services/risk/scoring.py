"""Deterministic Laundering Heuristics & Normalized Composite Risk Scoring.

Formula:
    Risk Score = min(1.0, sum(w_i * I_detected))

Weights:
    - Rapid Movement (w1 = 0.25): delta_t <= 180s between consecutive hops
    - Peel Chain (w2 = 0.25): Forwarding ratio between 85% and 95% (0.85 <= R <= 0.95)
    - Fan-Out Dispersion (w3 = 0.20): Out-degree >= 5
    - Bridge / Mixer / DEX Hop (w4 = 0.20): Traversal through mixer, DEX pool, or bridge
    - Direct VASP Cashout (w5 = 0.10): Terminal node attributed to known exchange/VASP
"""

from dataclasses import dataclass, field
from decimal import Decimal, ROUND_HALF_UP
from typing import Any

# Heuristic weight allocations
WEIGHT_RAPID_MOVEMENT = Decimal("0.25")
WEIGHT_PEEL_CHAIN = Decimal("0.25")
WEIGHT_FAN_OUT = Decimal("0.20")
WEIGHT_BRIDGE_OR_MIXER = Decimal("0.20")
WEIGHT_DIRECT_VASP = Decimal("0.10")

# Thresholds
RAPID_MOVEMENT_MAX_SEC = 180
PEEL_CHAIN_MIN_RATIO = Decimal("0.85")
PEEL_CHAIN_MAX_RATIO = Decimal("0.95")
FAN_OUT_MIN_OUT_DEGREE = 5


@dataclass
class RiskScoringResult:
    normalized_score: float
    category: str
    detected_indicators: dict[str, bool]
    weights_applied: dict[str, float]
    breakdown: dict[str, Any] = field(default_factory=dict)


class CompositeRiskScorer:
    """Calculates normalized multi-factor risk scores and categorical severity."""

    @staticmethod
    def calculate_peel_ratio(received_amount: float | Decimal, forwarded_amount: float | Decimal) -> Decimal:
        rec = Decimal(str(received_amount)) if received_amount is not None else Decimal("0")
        fwd = Decimal(str(forwarded_amount)) if forwarded_amount is not None else Decimal("0")
        if rec <= Decimal("0"):
            return Decimal("0")
        return (fwd / rec).quantize(Decimal("0.0001"), rounding=ROUND_HALF_UP)

    @classmethod
    def evaluate(
        cls,
        *,
        delta_time_sec: int | None = None,
        received_amount: float | Decimal | None = None,
        forwarded_amount: float | Decimal | None = None,
        out_degree: int = 0,
        has_bridge_or_mixer_hop: bool = False,
        is_direct_vasp_cashout: bool = False,
        extra_flags: dict[str, bool] | None = None,
    ) -> RiskScoringResult:
        """Evaluates investigation inputs and returns normalized score with categorization."""
        extra_flags = extra_flags or {}
        detected: dict[str, bool] = {}
        applied_weights: dict[str, float] = {}

        # 1. Rapid Movement (w1 = 0.25)
        is_rapid = (
            extra_flags.get("rapid_movement", False)
            or (delta_time_sec is not None and 0 <= delta_time_sec <= RAPID_MOVEMENT_MAX_SEC)
        )
        detected["rapid_movement"] = is_rapid
        if is_rapid:
            applied_weights["rapid_movement"] = float(WEIGHT_RAPID_MOVEMENT)

        # 2. Peel Chain (w2 = 0.25)
        peel_ratio = cls.calculate_peel_ratio(
            received_amount if received_amount is not None else 0,
            forwarded_amount if forwarded_amount is not None else 0,
        )
        is_peel = (
            extra_flags.get("peel_chain", False)
            or (PEEL_CHAIN_MIN_RATIO <= peel_ratio <= PEEL_CHAIN_MAX_RATIO)
        )
        detected["peel_chain"] = is_peel
        if is_peel:
            applied_weights["peel_chain"] = float(WEIGHT_PEEL_CHAIN)

        # 3. Fan-Out Dispersion (w3 = 0.20)
        is_fan_out = (
            extra_flags.get("fan_out", False)
            or out_degree >= FAN_OUT_MIN_OUT_DEGREE
        )
        detected["fan_out"] = is_fan_out
        if is_fan_out:
            applied_weights["fan_out"] = float(WEIGHT_FAN_OUT)

        # 4. Bridge / Mixer / DEX Hop (w4 = 0.20)
        is_bridge_mixer = (
            extra_flags.get("bridge_or_mixer", False)
            or has_bridge_or_mixer_hop
        )
        detected["bridge_or_mixer"] = is_bridge_mixer
        if is_bridge_mixer:
            applied_weights["bridge_or_mixer"] = float(WEIGHT_BRIDGE_OR_MIXER)

        # 5. Direct VASP Cashout (w5 = 0.10)
        is_vasp = (
            extra_flags.get("direct_vasp_cashout", False)
            or is_direct_vasp_cashout
        )
        detected["direct_vasp_cashout"] = is_vasp
        if is_vasp:
            applied_weights["direct_vasp_cashout"] = float(WEIGHT_DIRECT_VASP)

        # Compute Normalized Sum
        total_score_dec = sum(
            [Decimal(str(w)) for w in applied_weights.values()],
            Decimal("0.0")
        )
        normalized_dec = min(Decimal("1.0"), total_score_dec).quantize(
            Decimal("0.01"), rounding=ROUND_HALF_UP
        )
        normalized_score = float(normalized_dec)

        # Assign Categorical Badges
        if normalized_score >= 0.70:
            category = "CRITICAL"
        elif normalized_score >= 0.50:
            category = "HIGH"
        elif normalized_score >= 0.25:
            category = "MEDIUM"
        else:
            category = "LOW"

        return RiskScoringResult(
            normalized_score=normalized_score,
            category=category,
            detected_indicators=detected,
            weights_applied=applied_weights,
            breakdown={
                "peel_ratio": float(peel_ratio),
                "delta_time_sec": delta_time_sec,
                "out_degree": out_degree,
            },
        )