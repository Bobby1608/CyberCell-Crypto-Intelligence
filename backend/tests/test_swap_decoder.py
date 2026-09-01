from decimal import Decimal

from web3 import Web3

from backend.services.crosschain.swap_decoder import SwapDecoder


def test_swap_decoder_initialization():
    decoder = SwapDecoder()

    assert decoder.contract is not None
    assert decoder.w3 is not None


def test_decode_swap_log_amount0_in():
    decoder = SwapDecoder()

    # Generate the correct Uniswap V2 Swap event topic.
    swap_topic = Web3.keccak(
        text="Swap(address,uint256,uint256,uint256,uint256,address)"
    ).hex()

    mock_log = {
        "address": "0xB4e16d0168e52d35cacd2c6185344259b2aad059",

        "topics": [
            # Swap event signature
            swap_topic,

            # sender = 0x7a250d5630b4cf539739df2c5acb4c659f2488d4
            "0x0000000000000000000000007a250d5630b4cf539739df2c5acb4c659f2488d4",

            # recipient = 0xd8da6bf26964af9d7eed9e03e53415d37aa96045
            "0x000000000000000000000000d8da6bf26964af9d7eed9e03e53415d37aa96045",
        ],

        "data": (
            # amount0In = 1.0 * 10^18
            "0000000000000000000000000000000000000000000000000de0b6b3a7640000"

            # amount1In = 0
            "0000000000000000000000000000000000000000000000000000000000000000"

            # amount0Out = 0
            "0000000000000000000000000000000000000000000000000000000000000000"

            # amount1Out = 0.5 * 10^18
            "00000000000000000000000000000000000000000000000006f05b59d3b20000"
        ),

        "transactionHash": (
            "0x1234567890abcdef1234567890abcdef"
            "1234567890abcdef1234567890abcdef"
        ),
    }

    result = decoder.decode_swap_log(mock_log)

    assert result is not None

    assert (
        result["pool_address"]
        == "0xb4e16d0168e52d35cacd2c6185344259b2aad059"
    )

    assert (
        result["sender"]
        == "0x7a250d5630b4cf539739df2c5acb4c659f2488d4"
    )

    assert (
        result["recipient"]
        == "0xd8da6bf26964af9d7eed9e03e53415d37aa96045"
    )

    assert Decimal(result["amount_in"]) == Decimal("1000000000000000000")
    assert Decimal(result["amount_out"]) == Decimal("500000000000000000")

    assert (
        result["tx_hash"]
        == "0x1234567890abcdef1234567890abcdef"
           "1234567890abcdef1234567890abcdef"
    )


def test_decode_swap_log_invalid_log():
    decoder = SwapDecoder()

    invalid_log = {
        "address": "0xB4e16d0168e52d35cacd2c6185344259b2aad059",

        "topics": [
            "0x0000000000000000000000000000000000000000000000000000000000000000"
        ],

        "data": "0x1234",
    }

    result = decoder.decode_swap_log(invalid_log)

    assert result is None
