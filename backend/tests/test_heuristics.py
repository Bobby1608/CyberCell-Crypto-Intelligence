import pytest
from backend.services.blockchain.heuristics import (
    LaunderingHeuristicsEngine,
    RAPID_PASSTHROUGH_MAX_SECONDS,
    PEEL_CHAIN_MIN_RATIO,
    PEEL_CHAIN_MAX_RATIO,
)


def test_rapid_passthrough_exact_boundaries():
    assert LaunderingHeuristicsEngine.detect_rapid_passthrough(1000, 1000 + RAPID_PASSTHROUGH_MAX_SECONDS) is True
    assert LaunderingHeuristicsEngine.detect_rapid_passthrough(1000, 1015) is True
    assert LaunderingHeuristicsEngine.detect_rapid_passthrough(1000, 1000 + RAPID_PASSTHROUGH_MAX_SECONDS + 1) is False
    assert LaunderingHeuristicsEngine.detect_rapid_passthrough(2000, 1000) is False
    assert LaunderingHeuristicsEngine.detect_rapid_passthrough(None, 1000) is False


def test_peel_chain_ratio_boundaries():
    received = 100.0
    is_peel, r1 = LaunderingHeuristicsEngine.detect_peel_chain(received, received * PEEL_CHAIN_MIN_RATIO)
    assert is_peel is True
    assert r1 == 0.85

    is_peel, r2 = LaunderingHeuristicsEngine.detect_peel_chain(received, received * PEEL_CHAIN_MAX_RATIO)
    assert is_peel is True
    assert r2 == 0.95

    is_peel, r3 = LaunderingHeuristicsEngine.detect_peel_chain(received, 80.0)
    assert is_peel is False
    assert r3 == 0.80

    is_peel, r4 = LaunderingHeuristicsEngine.detect_peel_chain(received, 98.0)
    assert is_peel is False
    assert r4 == 0.98


def test_composite_risk_scoring_matrix():
    res_clean = LaunderingHeuristicsEngine.evaluate_node_risk(
        address="0x1111111111111111111111111111111111111111",
        in_degree=1,
        out_degree=1,
        received_amount=100.0,
        forwarded_amount=20.0,
    )
    assert res_clean.score == 0
    assert res_clean.category == "CLEAN"

    res_crit = LaunderingHeuristicsEngine.evaluate_node_risk(
        address="0xd90e2f925da726b50c4ed8d0fb90ad053324f31b",
        incoming_timestamp=1700000000,
        outgoing_timestamp=1700000045,
        received_amount=100.0,
        forwarded_amount=92.0,
        out_degree=4,
    )
    assert res_crit.flags["is_mixer"] is True
    assert res_crit.flags["rapid_passthrough"] is True
    assert res_crit.flags["peel_chain"] is True
    assert res_crit.flags["fan_out"] is True
    assert res_crit.score == 100
    assert res_crit.category == "CRITICAL"