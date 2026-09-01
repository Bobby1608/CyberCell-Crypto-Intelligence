from decimal import Decimal
import pytest
from backend.services.risk.scoring import CompositeRiskScorer


def test_mock_investigation_peel_and_rapid_movement():
    """Verify mock investigation with peel chain (0.25) + rapid movement (0.25) => score >= 0.50 and HIGH/CRITICAL."""
    result = CompositeRiskScorer.evaluate(
        delta_time_sec=45,          # <= 180s -> triggers rapid movement (0.25)
        received_amount=250.0,
        forwarded_amount=225.0,     # 225/250 = 0.90 -> triggers peel chain (0.25)
        out_degree=2,               # < 5 -> no fan-out
        has_bridge_or_mixer_hop=False,
        is_direct_vasp_cashout=False,
    )

    assert result.detected_indicators["rapid_movement"] is True
    assert result.detected_indicators["peel_chain"] is True
    assert result.normalized_score >= 0.50
    assert result.category in ("HIGH", "CRITICAL")
    assert result.normalized_score == 0.50
    assert result.category == "HIGH"


def test_critical_composite_scenario():
    """Verify rapid movement (0.25) + peel chain (0.25) + bridge/mixer (0.20) + VASP (0.10) => 0.80 CRITICAL."""
    result = CompositeRiskScorer.evaluate(
        delta_time_sec=120,
        received_amount=100.0,
        forwarded_amount=92.0,      # 92% peel
        out_degree=1,
        has_bridge_or_mixer_hop=True,
        is_direct_vasp_cashout=True,
    )

    assert result.normalized_score == 0.80
    assert result.category == "CRITICAL"


def test_clean_low_risk_scenario():
    """Verify clean transaction trail yields LOW risk."""
    result = CompositeRiskScorer.evaluate(
        delta_time_sec=3600,        # 1 hour
        received_amount=100.0,
        forwarded_amount=20.0,      # 20%
        out_degree=1,
        has_bridge_or_mixer_hop=False,
        is_direct_vasp_cashout=False,
    )

    assert result.normalized_score == 0.0
    assert result.category == "LOW"


def test_missing_optional_parameters_does_not_crash():
    """Ensure safe execution when inputs are None."""
    result = CompositeRiskScorer.evaluate(
        delta_time_sec=None,
        received_amount=None,
        forwarded_amount=None,
    )

    assert result.normalized_score == 0.0
    assert result.category == "LOW"