from unittest.mock import MagicMock

import pytest

from backend.services.blockchain.ingestor import (
    EtherscanClient,
    trace_crosschain_trail,
)
from backend.services.crosschain.bridge_decoder import BridgeDecoder


VALID_BRIDGE_ADDRESS = (
    "0x40ec5b33f54e0e8a33a975908c5ba1c14e5bbbdf"
)

TARGET_WALLET = (
    "0x388c818ca8b9251b393131c08a736a67ccb19297"
)

RECEIVER_WALLET = (
    "0x1111111111111111111111111111111111111111"
)

USDC = (
    "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"
)

ETHEREUM_TX_HASH = (
    "0x1111111111111111111111111111111111111111111111111111111111111111"
)

POLYGON_TX_HASH = (
    "0x2222222222222222222222222222222222222222222222222222222222222222"
)

BINANCE_DEPOSIT_ADDRESS = (
    "0x2222222222222222222222222222222222222222"
)


@pytest.fixture
def mock_bridge_log():
    decoder = BridgeDecoder()

    # BridgeDecoder stores the topic without 0x.
    correct_topic0 = "0x" + decoder.locked_erc20_topic

    return {
        "address": VALID_BRIDGE_ADDRESS,
        "topics": [
            correct_topic0,

            # depositor
            f"0x{'0' * 24}{TARGET_WALLET[2:]}",

            # depositReceiver
            f"0x{'0' * 24}{RECEIVER_WALLET[2:]}",

            # rootToken
            f"0x{'0' * 24}{USDC[2:]}",
        ],

        # 100 USDC with 6 decimals = 100,000,000
        "data": (
            "0x000000000000000000000000000000000000000000000000"
            "0000000005f5e100"
        ),

        "transactionHash": ETHEREUM_TX_HASH,
    }


def test_trace_crosschain_trail_coordinates_l1_to_l2(
    mock_bridge_log,
):
    client = EtherscanClient(
        api_key="TEST_KEY"
    )

    target_wallet = TARGET_WALLET
    receiver_wallet = RECEIVER_WALLET

    # ---------------------------------------------------------
    # Mock normal transactions
    # ---------------------------------------------------------
    client.get_normal_transactions = MagicMock(
        return_value=[]
    )

    # ---------------------------------------------------------
    # Mock ERC20 transfers
    # ---------------------------------------------------------
    client.get_erc20_transfers = MagicMock(
        side_effect=lambda wallet, **kwargs: (
            [
                {
                    "chain": "ethereum",
                    "chain_id": 1,
                    "tx_hash": ETHEREUM_TX_HASH,
                    "timestamp": 1700000000,
                    "from_address": target_wallet,
                    "to_address": VALID_BRIDGE_ADDRESS,
                    "asset_symbol": "USDC",
                    "asset_amount": "100.0",
                }
            ]
            if kwargs.get("chain_id") == 1
            else [
                {
                    "chain": "polygon",
                    "chain_id": 137,
                    "tx_hash": POLYGON_TX_HASH,
                    "timestamp": 1700000100,
                    "from_address": receiver_wallet,
                    "to_address": BINANCE_DEPOSIT_ADDRESS,
                    "asset_symbol": "USDC",
                    "asset_amount": "100.0",
                }
            ]
        )
    )

    # ---------------------------------------------------------
    # Mock transaction logs
    # ---------------------------------------------------------
    client.get_transaction_logs = MagicMock(
        return_value=[mock_bridge_log]
    )

    # ---------------------------------------------------------
    # Mock timestamp -> block lookup
    # ---------------------------------------------------------
    client.get_block_number_by_time = MagicMock(
        return_value=50000000
    )

    # ---------------------------------------------------------
    # Execute
    # ---------------------------------------------------------
    trail = trace_crosschain_trail(
        target_wallet,
        client,
    )

    # ---------------------------------------------------------
    # Assertions
    # ---------------------------------------------------------
    chains_found = {
        tx["chain"]
        for tx in trail
    }

    assert "ethereum" in chains_found
    assert "polygon" in chains_found

    assert len(trail) == 2

    polygon_tx = next(
        tx
        for tx in trail
        if tx["chain"] == "polygon"
    )

    assert (
        polygon_tx["from_address"]
        == receiver_wallet
    )

    assert polygon_tx["chain_id"] == 137


def test_chain_id_override_in_request():
    client = EtherscanClient(
        api_key="TEST_KEY",
        chain_id=1,
    )

    client.session.get = MagicMock()

    mock_resp = MagicMock()

    mock_resp.json.return_value = {
        "status": "1",
        "message": "OK",
        "result": [],
    }

    client.session.get.return_value = mock_resp

    client._request(
        {
            "module": "account",
            "action": "txlist",
        },
        chain_id=137,
    )

    called_params = (
        client.session.get.call_args[1]["params"]
    )

    assert called_params["chainid"] == 137
