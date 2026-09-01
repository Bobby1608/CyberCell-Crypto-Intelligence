from web3 import Web3

from backend.services.crosschain.bridge_decoder import BridgeDecoder


VALID_BRIDGE_ADDRESS = (
    "0x40ec5b33f54e0e8a33a975908c5ba1c14e5bbbdf"
)

LOCKED_ERC20_TOPIC = (
    Web3.keccak(
        text="LockedERC20(address,address,address,uint256)"
    )
    .hex()
)

DEPOSITOR = (
    "0x388c818ca8b9251b393131c08a736a67ccb19297"
)

# Synthetic test address.
# Exactly 40 hexadecimal characters after 0x.
DEPOSIT_RECEIVER = (
    "0x1111111111111111111111111111111111111111"
)

USDT = (
    "0xdac17f958d2ee523a2206206994597c13d831ec7"
)

TX_HASH = (
    "0x9876543210abcdef9876543210abcdef"
    "9876543210abcdef9876543210abcdef"
)


def make_valid_log(**overrides):
    log = {
        "address": VALID_BRIDGE_ADDRESS,
        "topics": [
            LOCKED_ERC20_TOPIC,

            # depositor
            f"0x{'0' * 24}{DEPOSITOR[2:]}",

            # depositReceiver
            f"0x{'0' * 24}{DEPOSIT_RECEIVER[2:]}",

            # rootToken
            f"0x{'0' * 24}{USDT[2:]}",
        ],

        # 100 USDT with 6 decimals:
        #
        # 100 * 10^6 = 100,000,000
        #
        # 100,000,000 in hexadecimal = 0x5f5e100
        "data": (
            "0x000000000000000000000000000000000000000000000000"
            "0000000005f5e100"
        ),

        "transactionHash": TX_HASH,
    }

    log.update(overrides)

    return log


def test_decode_bridge_log_success():
    decoder = BridgeDecoder()

    decoded = decoder.decode_bridge_log(
        make_valid_log()
    )

    assert decoded is not None

    assert decoded["bridge_name"] == "Polygon PoS Bridge"

    assert decoded["destination_chain"] == "polygon"

    assert (
        decoded["bridge_contract"].lower()
        == VALID_BRIDGE_ADDRESS.lower()
    )

    assert (
        decoded["depositor"].lower()
        == DEPOSITOR.lower()
    )

    assert (
        decoded["deposit_receiver"].lower()
        == DEPOSIT_RECEIVER.lower()
    )

    assert (
        decoded["root_token"].lower()
        == USDT.lower()
    )

    assert decoded["amount"] == "100000000"

    assert decoded["tx_hash"] == TX_HASH


def test_decode_bridge_log_wrong_topic():
    decoder = BridgeDecoder()

    invalid_log = make_valid_log(
        topics=[
            "0x" + "11" * 32,

            f"0x{'0' * 24}{DEPOSITOR[2:]}",

            f"0x{'0' * 24}{DEPOSIT_RECEIVER[2:]}",

            f"0x{'0' * 24}{USDT[2:]}",
        ]
    )

    assert decoder.decode_bridge_log(
        invalid_log
    ) is None


def test_decode_bridge_log_unknown_contract():
    decoder = BridgeDecoder()

    invalid_log = make_valid_log(
        address="0x1111111111111111111111111111111111111111"
    )

    assert decoder.decode_bridge_log(
        invalid_log
    ) is None


def test_decode_bridge_log_missing_topics():
    decoder = BridgeDecoder()

    invalid_log = make_valid_log(
        topics=[]
    )

    assert decoder.decode_bridge_log(
        invalid_log
    ) is None


def test_decode_bridge_log_too_few_topics():
    decoder = BridgeDecoder()

    invalid_log = make_valid_log(
        topics=[
            LOCKED_ERC20_TOPIC,
            f"0x{'0' * 24}{DEPOSITOR[2:]}",
        ]
    )

    assert decoder.decode_bridge_log(
        invalid_log
    ) is None


def test_decode_bridge_log_invalid_depositor_topic():
    decoder = BridgeDecoder()

    invalid_log = make_valid_log(
        topics=[
            LOCKED_ERC20_TOPIC,
            "0x1234",
            f"0x{'0' * 24}{DEPOSIT_RECEIVER[2:]}",
            f"0x{'0' * 24}{USDT[2:]}",
        ]
    )

    assert decoder.decode_bridge_log(
        invalid_log
    ) is None


def test_decode_bridge_log_invalid_receiver_topic():
    decoder = BridgeDecoder()

    invalid_log = make_valid_log(
        topics=[
            LOCKED_ERC20_TOPIC,
            f"0x{'0' * 24}{DEPOSITOR[2:]}",
            "0x1234",
            f"0x{'0' * 24}{USDT[2:]}",
        ]
    )

    assert decoder.decode_bridge_log(
        invalid_log
    ) is None


def test_decode_bridge_log_invalid_root_token_topic():
    decoder = BridgeDecoder()

    invalid_log = make_valid_log(
        topics=[
            LOCKED_ERC20_TOPIC,
            f"0x{'0' * 24}{DEPOSITOR[2:]}",
            f"0x{'0' * 24}{DEPOSIT_RECEIVER[2:]}",
            "0x1234",
        ]
    )

    assert decoder.decode_bridge_log(
        invalid_log
    ) is None


def test_decode_bridge_log_invalid_amount():
    decoder = BridgeDecoder()

    invalid_log = make_valid_log(
        data="0x1234"
    )

    assert decoder.decode_bridge_log(
        invalid_log
    ) is None


def test_decode_bridge_log_zero_amount():
    decoder = BridgeDecoder()

    invalid_log = make_valid_log(
        data="0x" + "00" * 32
    )

    assert decoder.decode_bridge_log(
        invalid_log
    ) is None


def test_decode_bridge_log_invalid_transaction_hash():
    decoder = BridgeDecoder()

    invalid_log = make_valid_log(
        transactionHash="0x1234"
    )

    assert decoder.decode_bridge_log(
        invalid_log
    ) is None


def test_decode_bridge_log_missing_transaction_hash():
    decoder = BridgeDecoder()

    invalid_log = make_valid_log(
        transactionHash=""
    )

    assert decoder.decode_bridge_log(
        invalid_log
    ) is None


def test_decode_bridge_log_accepts_bytes_data():
    decoder = BridgeDecoder()

    valid_amount = bytes.fromhex(
        "000000000000000000000000000000000000000000000000"
        "0000000005f5e100"
    )

    decoded = decoder.decode_bridge_log(
        make_valid_log(
            data=valid_amount
        )
    )

    assert decoded is not None

    assert decoded["amount"] == "100000000"


def test_decode_bridge_log_accepts_bytes_transaction_hash():
    decoder = BridgeDecoder()

    tx_hash_bytes = bytes.fromhex(
        TX_HASH[2:]
    )

    decoded = decoder.decode_bridge_log(
        make_valid_log(
            transactionHash=tx_hash_bytes
        )
    )

    assert decoded is not None

    assert decoded["tx_hash"] == TX_HASH


def test_decode_bridge_log_non_dict_input():
    decoder = BridgeDecoder()

    assert decoder.decode_bridge_log(None) is None

    assert decoder.decode_bridge_log([]) is None

    assert decoder.decode_bridge_log("invalid") is None


def test_decode_bridge_log_missing_address():
    decoder = BridgeDecoder()

    invalid_log = make_valid_log(
        address=""
    )

    assert decoder.decode_bridge_log(
        invalid_log
    ) is None
