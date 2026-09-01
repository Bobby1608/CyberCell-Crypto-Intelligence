
from decimal import Decimal

from backend.services.risk.patterns import analyze_risk_indicators


def test_path_detection():
    transactions = [
        {
            "tx_hash": "0x111",
            "from_address": "0xSource",
            "to_address": "0xIntermediate",
            "timestamp": 1000,
            "asset_amount": Decimal("100.00"),
            "asset_contract": "0xUSDT",
            "asset_symbol": "USDT",
        },
        {
            "tx_hash": "0x222",
            "from_address": "0xIntermediate",
            "to_address": "0xTarget",
            "timestamp": 1050,
            "asset_amount": Decimal("90.00"),
            "asset_contract": "0xUSDT",
            "asset_symbol": "USDT",
        },
    ]

    results = analyze_risk_indicators(
        transactions=transactions,
        source_wallet="0xSource",
        target_wallet="0xTarget",
        vasp_labels={},
    )

    assert ["0xsource", "0xintermediate", "0xtarget"] in results["paths"]


def test_rapid_movement_detection():
    transactions = [
        {
            "tx_hash": "0x111",
            "from_address": "0xSource",
            "to_address": "0xIntermediate",
            "timestamp": 1000,
            "asset_amount": Decimal("100.00"),
            "asset_contract": "0xUSDT",
            "asset_symbol": "USDT",
        },
        {
            "tx_hash": "0x222",
            "from_address": "0xIntermediate",
            "to_address": "0xTarget",
            "timestamp": 1050,
            "asset_amount": Decimal("90.00"),
            "asset_contract": "0xUSDT",
            "asset_symbol": "USDT",
        },
    ]

    results = analyze_risk_indicators(
        transactions=transactions,
        source_wallet="0xSource",
        target_wallet="0xTarget",
        vasp_labels={},
        rapid_seconds=180,
    )

    assert len(results["rapid_movements"]) == 1

    rapid = results["rapid_movements"][0]

    assert rapid["address"] == "0xintermediate"
    assert rapid["delta_seconds"] == 50
    assert rapid["incoming_tx"] == "0x111"
    assert rapid["outgoing_tx"] == "0x222"
    assert rapid["asset_symbol"] == "USDT"


def test_no_rapid_movement_over_threshold():
    transactions = [
        {
            "tx_hash": "0x111",
            "from_address": "0xSource",
            "to_address": "0xIntermediate",
            "timestamp": 1000,
            "asset_amount": Decimal("100.00"),
            "asset_contract": "0xUSDT",
            "asset_symbol": "USDT",
        },
        {
            "tx_hash": "0x222",
            "from_address": "0xIntermediate",
            "to_address": "0xTarget",
            "timestamp": 1300,
            "asset_amount": Decimal("90.00"),
            "asset_contract": "0xUSDT",
            "asset_symbol": "USDT",
        },
    ]

    results = analyze_risk_indicators(
        transactions=transactions,
        source_wallet="0xSource",
        target_wallet="0xTarget",
        vasp_labels={},
        rapid_seconds=180,
    )

    assert results["rapid_movements"] == []


def test_rapid_movement_at_threshold():
    transactions = [
        {
            "tx_hash": "0x111",
            "from_address": "0xSource",
            "to_address": "0xIntermediate",
            "timestamp": 1000,
            "asset_amount": Decimal("100.00"),
            "asset_contract": "0xUSDT",
            "asset_symbol": "USDT",
        },
        {
            "tx_hash": "0x222",
            "from_address": "0xIntermediate",
            "to_address": "0xTarget",
            "timestamp": 1180,
            "asset_amount": Decimal("90.00"),
            "asset_contract": "0xUSDT",
            "asset_symbol": "USDT",
        },
    ]

    results = analyze_risk_indicators(
        transactions=transactions,
        source_wallet="0xSource",
        target_wallet="0xTarget",
        vasp_labels={},
        rapid_seconds=180,
    )

    assert len(results["rapid_movements"]) == 1
    assert results["rapid_movements"][0]["delta_seconds"] == 180


def test_rapid_movement_just_over_threshold():
    transactions = [
        {
            "tx_hash": "0x111",
            "from_address": "0xSource",
            "to_address": "0xIntermediate",
            "timestamp": 1000,
            "asset_amount": Decimal("100.00"),
            "asset_contract": "0xUSDT",
            "asset_symbol": "USDT",
        },
        {
            "tx_hash": "0x222",
            "from_address": "0xIntermediate",
            "to_address": "0xTarget",
            "timestamp": 1181,
            "asset_amount": Decimal("90.00"),
            "asset_contract": "0xUSDT",
            "asset_symbol": "USDT",
        },
    ]

    results = analyze_risk_indicators(
        transactions=transactions,
        source_wallet="0xSource",
        target_wallet="0xTarget",
        vasp_labels={},
        rapid_seconds=180,
    )

    assert results["rapid_movements"] == []


def test_peel_chain_detection():
    transactions = [
        {
            "tx_hash": "0x111",
            "from_address": "0xSource",
            "to_address": "0xIntermediate",
            "timestamp": 1000,
            "asset_amount": Decimal("100.00"),
            "asset_contract": "0xUSDT",
            "asset_symbol": "USDT",
        },
        {
            "tx_hash": "0x222",
            "from_address": "0xIntermediate",
            "to_address": "0xTarget",
            "timestamp": 1050,
            "asset_amount": Decimal("90.00"),
            "asset_contract": "0xUSDT",
            "asset_symbol": "USDT",
        },
    ]

    results = analyze_risk_indicators(
        transactions=transactions,
        source_wallet="0xSource",
        target_wallet="0xTarget",
        vasp_labels={},
    )

    assert len(results["possible_peel_chains"]) == 1

    peel = results["possible_peel_chains"][0]

    assert peel["address"] == "0xintermediate"
    assert peel["incoming_tx"] == "0x111"
    assert peel["outgoing_tx"] == "0x222"
    assert peel["inflow"] == "100.00"
    assert peel["forwarded"] == "90.00"
    assert peel["ratio"] == "0.9"


def test_peel_chain_ratio_boundaries():
    test_cases = [
        (Decimal("85.00"), True),
        (Decimal("95.00"), True),
        (Decimal("84.99"), False),
        (Decimal("95.01"), False),
    ]

    for out_amount, should_detect in test_cases:
        transactions = [
            {
                "tx_hash": "0x111",
                "from_address": "0xSource",
                "to_address": "0xIntermediate",
                "timestamp": 1000,
                "asset_amount": Decimal("100.00"),
                "asset_contract": "0xUSDT",
                "asset_symbol": "USDT",
            },
            {
                "tx_hash": "0x222",
                "from_address": "0xIntermediate",
                "to_address": "0xTarget",
                "timestamp": 1050,
                "asset_amount": out_amount,
                "asset_contract": "0xUSDT",
                "asset_symbol": "USDT",
            },
        ]

        results = analyze_risk_indicators(
            transactions=transactions,
            source_wallet="0xSource",
            target_wallet="0xTarget",
            vasp_labels={},
        )

        if should_detect:
            assert len(results["possible_peel_chains"]) == 1
        else:
            assert results["possible_peel_chains"] == []


def test_different_asset_not_peel_chain():
    transactions = [
        {
            "tx_hash": "0x111",
            "from_address": "0xSource",
            "to_address": "0xIntermediate",
            "timestamp": 1000,
            "asset_amount": Decimal("100.00"),
            "asset_contract": "0xUSDT",
            "asset_symbol": "USDT",
        },
        {
            "tx_hash": "0x222",
            "from_address": "0xIntermediate",
            "to_address": "0xTarget",
            "timestamp": 1050,
            "asset_amount": Decimal("90.00"),
            "asset_contract": "0xUSDC",
            "asset_symbol": "USDC",
        },
    ]

    results = analyze_risk_indicators(
        transactions=transactions,
        source_wallet="0xSource",
        target_wallet="0xTarget",
        vasp_labels={},
    )

    assert results["possible_peel_chains"] == []


def test_multiple_transactions_between_same_addresses():
    transactions = [
        {
            "tx_hash": "0x111",
            "from_address": "0xSource",
            "to_address": "0xIntermediate",
            "timestamp": 1000,
            "asset_amount": Decimal("100.00"),
            "asset_contract": "0xUSDT",
            "asset_symbol": "USDT",
        },
        {
            "tx_hash": "0x112",
            "from_address": "0xSource",
            "to_address": "0xIntermediate",
            "timestamp": 1010,
            "asset_amount": Decimal("50.00"),
            "asset_contract": "0xUSDT",
            "asset_symbol": "USDT",
        },
        {
            "tx_hash": "0x222",
            "from_address": "0xIntermediate",
            "to_address": "0xTarget",
            "timestamp": 1050,
            "asset_amount": Decimal("90.00"),
            "asset_contract": "0xUSDT",
            "asset_symbol": "USDT",
        },
    ]

    results = analyze_risk_indicators(
        transactions=transactions,
        source_wallet="0xSource",
        target_wallet="0xTarget",
        vasp_labels={},
    )

    assert ["0xsource", "0xintermediate", "0xtarget"] in results["paths"]


def test_vasp_exposure():
    transactions = [
        {
            "tx_hash": "0x333",
            "from_address": "0xTarget",
            "to_address": "0xBinanceVASP",
            "timestamp": 1100,
            "asset_amount": Decimal("90.00"),
            "asset_contract": "0xUSDT",
            "asset_symbol": "USDT",
        },
    ]

    vasp_labels = {
        "0xBinanceVASP": "Binance",
    }

    results = analyze_risk_indicators(
        transactions=transactions,
        source_wallet="0xSource",
        target_wallet="0xTarget",
        vasp_labels=vasp_labels,
    )

    assert len(results["vasp_exposure"]) == 1

    vasp = results["vasp_exposure"][0]

    assert vasp["address"] == "0xbinancevasp"
    assert vasp["vasp_name"] == "Binance"
    assert vasp["is_terminal"] is True
    assert vasp["in_degree"] == 1
    assert vasp["out_degree"] == 0
    assert vasp["unique_in_sources"] == 1
    assert vasp["unique_out_targets"] == 0
