from decimal import Decimal
from typing import Any

from web3 import Web3


UNISWAP_V2_PAIR_ABI = [
    {
        "anonymous": False,
        "inputs": [
            {
                "indexed": True,
                "name": "sender",
                "type": "address",
            },
            {
                "indexed": False,
                "name": "amount0In",
                "type": "uint256",
            },
            {
                "indexed": False,
                "name": "amount1In",
                "type": "uint256",
            },
            {
                "indexed": False,
                "name": "amount0Out",
                "type": "uint256",
            },
            {
                "indexed": False,
                "name": "amount1Out",
                "type": "uint256",
            },
            {
                "indexed": True,
                "name": "to",
                "type": "address",
            },
        ],
        "name": "Swap",
        "type": "event",
    },
    {
        "inputs": [],
        "name": "token0",
        "outputs": [
            {
                "name": "",
                "type": "address",
            }
        ],
        "stateMutability": "view",
        "type": "function",
    },
    {
        "inputs": [],
        "name": "token1",
        "outputs": [
            {
                "name": "",
                "type": "address",
            }
        ],
        "stateMutability": "view",
        "type": "function",
    },
]


class SwapDecoder:
    """
    Decoder for Uniswap V2-style Swap events.

    Decodes raw Ethereum logs without requiring an RPC connection.

    Extracts:
        - pool_address
        - sender
        - recipient
        - amount_in
        - amount_out
        - tx_hash
    """

    def __init__(self) -> None:
        self.w3 = Web3()

        self.contract = self.w3.eth.contract(
            abi=UNISWAP_V2_PAIR_ABI
        )

        # Uniswap V2 Swap event signature:
        #
        # Swap(
        #   address,
        #   uint256,
        #   uint256,
        #   uint256,
        #   uint256,
        #   address
        # )
        self.swap_event_topic = (
            Web3.keccak(
                text="Swap(address,uint256,uint256,uint256,uint256,address)"
            )
            .hex()
            .lower()
        )

        # Make absolutely sure the topic has 0x.
        if not self.swap_event_topic.startswith("0x"):
            self.swap_event_topic = "0x" + self.swap_event_topic

    @staticmethod
    def _hex_string(value: Any) -> str | None:
        """
        Convert bytes / HexBytes / strings into a normalized hex string.
        """
        if value is None:
            return None

        if isinstance(value, bytes):
            value = value.hex()

        value = str(value)

        if value.startswith("0x"):
            return value.lower()

        return "0x" + value.lower()

    @classmethod
    def _normalize_address(cls, address: Any) -> str | None:
        """
        Normalize an Ethereum address to lowercase with 0x prefix.
        """
        value = cls._hex_string(address)

        if value is None:
            return None

        # Ethereum addresses are exactly 20 bytes.
        if len(value) != 42:
            return None

        return value.lower()

    @classmethod
    def _normalize_tx_hash(cls, tx_hash: Any) -> str | None:
        """
        Normalize a transaction hash to lowercase with 0x prefix.
        """
        value = cls._hex_string(tx_hash)

        if value is None:
            return None

        return value.lower()

    @classmethod
    def _topic_to_address(cls, topic: Any) -> str | None:
        """
        Decode an indexed address from a 32-byte event topic.

        Ethereum ABI encodes an indexed address as:

            12 bytes of zero padding
            20 bytes of address
        """
        value = cls._hex_string(topic)

        if value is None:
            return None

        # Remove 0x.
        raw = value[2:]

        # A topic is exactly 32 bytes = 64 hex characters.
        if len(raw) != 64:
            return None

        # Last 20 bytes contain the address.
        address = "0x" + raw[-40:]

        return address.lower()

    @staticmethod
    def _decode_uint256_values(data: Any) -> list[int] | None:
        """
        Decode the four uint256 values in a Uniswap V2 Swap event.

        Event data layout:

            amount0In
            amount1In
            amount0Out
            amount1Out

        Each value occupies 32 bytes.
        """

        if data is None:
            return None

        if isinstance(data, bytes):
            raw = data.hex()
        else:
            raw = str(data)

        if raw.startswith("0x"):
            raw = raw[2:]

        # Four uint256 values * 32 bytes = 128 bytes
        # = 256 hexadecimal characters.
        if len(raw) != 256:
            return None

        try:
            values = []

            for i in range(4):
                start = i * 64
                end = start + 64

                word = raw[start:end]
                values.append(int(word, 16))

            return values

        except (ValueError, TypeError):
            return None

    def decode_swap_log(
        self,
        log: dict[str, Any],
    ) -> dict[str, Any] | None:
        """
        Decode a raw Uniswap V2 Swap event log.

        Returns None if the supplied log is malformed or is not a
        Uniswap V2 Swap event.
        """

        if not isinstance(log, dict):
            return None

        # --------------------------------------------------------------
        # 1. Validate topics
        # --------------------------------------------------------------

        topics = log.get("topics")

        if not isinstance(topics, (list, tuple)):
            return None

        if len(topics) < 3:
            return None

        # --------------------------------------------------------------
        # 2. Validate Swap event signature
        # --------------------------------------------------------------

        event_topic = self._hex_string(topics[0])

        if event_topic is None:
            return None

        if event_topic.lower() != self.swap_event_topic.lower():
            return None

        # --------------------------------------------------------------
        # 3. Decode sender
        # --------------------------------------------------------------

        sender = self._topic_to_address(topics[1])

        if sender is None:
            return None

        # --------------------------------------------------------------
        # 4. Decode recipient
        # --------------------------------------------------------------

        recipient = self._topic_to_address(topics[2])

        if recipient is None:
            return None

        # --------------------------------------------------------------
        # 5. Decode four uint256 event values
        # --------------------------------------------------------------

        amounts = self._decode_uint256_values(
            log.get("data")
        )

        if amounts is None:
            return None

        amount0_in = amounts[0]
        amount1_in = amounts[1]
        amount0_out = amounts[2]
        amount1_out = amounts[3]

        # --------------------------------------------------------------
        # 6. Determine input/output amounts
        # --------------------------------------------------------------

        if amount0_in > 0:
            amount_in = amount0_in
        else:
            amount_in = amount1_in

        if amount0_out > 0:
            amount_out = amount0_out
        else:
            amount_out = amount1_out

        # A swap must have both an input and an output.
        if amount_in <= 0 or amount_out <= 0:
            return None

        # --------------------------------------------------------------
        # 7. Pool address
        # --------------------------------------------------------------

        pool_address = self._normalize_address(
            log.get("address")
        )

        if pool_address is None:
            return None

        # --------------------------------------------------------------
        # 8. Transaction hash
        # --------------------------------------------------------------

        tx_hash = self._normalize_tx_hash(
            log.get("transactionHash")
        )

        # --------------------------------------------------------------
        # 9. Return normalized result
        # --------------------------------------------------------------

        return {
            "pool_address": pool_address,
            "sender": sender,
            "recipient": recipient,
            "amount_in": str(Decimal(amount_in)),
            "amount_out": str(Decimal(amount_out)),
            "tx_hash": tx_hash,
        }
