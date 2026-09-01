from typing import Any, Dict, Optional

from web3 import Web3


POLYGON_LOCKED_ERC20_ABI = [
    {
        "anonymous": False,
        "inputs": [
            {
                "indexed": True,
                "name": "depositor",
                "type": "address",
            },
            {
                "indexed": True,
                "name": "depositReceiver",
                "type": "address",
            },
            {
                "indexed": True,
                "name": "rootToken",
                "type": "address",
            },
            {
                "indexed": False,
                "name": "amount",
                "type": "uint256",
            },
        ],
        "name": "LockedERC20",
        "type": "event",
    }
]


KNOWN_BRIDGES = {
    "0x40ec5b33f54e0e8a33a975908c5ba1c14e5bbbdf": {
        "bridge_name": "Polygon PoS Bridge",
        "destination_chain": "polygon",
    },
    "0xa0c68c638235ee3e0433604b807109ac7769d37a": {
        "bridge_name": "Polygon PoS Bridge",
        "destination_chain": "polygon",
    },
}


class BridgeDecoder:
    def __init__(self):
        self.w3 = Web3()

        # Event signature:
        # LockedERC20(address,address,address,uint256)
        #
        # Deriving the topic instead of hard-coding it prevents
        # accidental mismatch between the ABI and topic hash.
        self.locked_erc20_topic = (
            self.w3.keccak(
                text="LockedERC20(address,address,address,uint256)"
            )
            .hex()
            .lower()
            .removeprefix("0x")
        )

    def _to_raw_hex(self, value: Any) -> Optional[str]:
        """
        Convert bytes, bytearray, HexBytes, or hex strings
        into lowercase hexadecimal without the 0x prefix.
        """
        if value is None:
            return None

        if isinstance(value, (bytes, bytearray)):
            return bytes(value).hex().lower()

        if hasattr(value, "hex"):
            try:
                result = value.hex()

                if isinstance(result, str):
                    result = result.strip()

                    if result.startswith(("0x", "0X")):
                        result = result[2:]

                    return result.lower()
            except Exception:
                pass

        result = str(value).strip().lower()

        if result.startswith("0x"):
            result = result[2:]

        return result

    def _normalize_address(self, value: Any) -> Optional[str]:
        """
        Normalize an Ethereum address.

        Accepts either:
        - 20-byte address: 40 hex characters
        - ABI-padded address topic: 32 bytes / 64 hex characters

        Returns a lowercase 0x-prefixed address.
        """
        raw_hex = self._to_raw_hex(value)

        if not raw_hex:
            return None

        # Indexed address values in event topics are ABI padded
        # to 32 bytes.
        if len(raw_hex) == 64:
            raw_hex = raw_hex[-40:]

        # Normal Ethereum address.
        elif len(raw_hex) != 40:
            return None

        try:
            bytes.fromhex(raw_hex)
        except ValueError:
            return None

        return "0x" + raw_hex.lower()

    def _normalize_tx_hash(self, value: Any) -> Optional[str]:
        """
        Normalize a transaction hash.

        A transaction hash must contain exactly 32 bytes,
        represented by 64 hexadecimal characters.
        """
        raw_hex = self._to_raw_hex(value)

        if not raw_hex:
            return None

        if len(raw_hex) != 64:
            return None

        try:
            bytes.fromhex(raw_hex)
        except ValueError:
            return None

        return "0x" + raw_hex.lower()

    def decode_bridge_log(
        self,
        log: Dict[str, Any],
    ) -> Optional[Dict[str, Any]]:
        """
        Decode a Polygon PoS Bridge LockedERC20 event log.

        Returns None when the log is invalid or is not from
        a known Polygon PoS Bridge contract.
        """
        try:
            # -----------------------------------------------------
            # Validate input
            # -----------------------------------------------------
            if not isinstance(log, dict):
                return None

            # -----------------------------------------------------
            # Validate topics
            # -----------------------------------------------------
            topics = log.get("topics")

            if not isinstance(topics, (list, tuple)):
                return None

            # LockedERC20 has:
            # topic[0] = event signature
            # topic[1] = depositor
            # topic[2] = depositReceiver
            # topic[3] = rootToken
            if len(topics) != 4:
                return None

            # -----------------------------------------------------
            # Validate event topic
            # -----------------------------------------------------
            topic0 = self._to_raw_hex(topics[0])

            if not topic0:
                return None

            if topic0 != self.locked_erc20_topic:
                return None

            # -----------------------------------------------------
            # Validate bridge contract
            # -----------------------------------------------------
            contract_address = self._normalize_address(
                log.get("address")
            )

            if not contract_address:
                return None

            contract_address = contract_address.lower()

            bridge_meta = KNOWN_BRIDGES.get(contract_address)

            if bridge_meta is None:
                return None

            # -----------------------------------------------------
            # Decode indexed event parameters
            # -----------------------------------------------------
            depositor = self._normalize_address(topics[1])
            deposit_receiver = self._normalize_address(topics[2])
            root_token = self._normalize_address(topics[3])

            if not depositor:
                return None

            if not deposit_receiver:
                return None

            if not root_token:
                return None

            # -----------------------------------------------------
            # Decode amount
            # -----------------------------------------------------
            data_hex = self._to_raw_hex(log.get("data"))

            if not data_hex:
                return None

            # uint256 = exactly 32 bytes.
            if len(data_hex) != 64:
                return None

            try:
                amount_raw = int(data_hex, 16)
            except ValueError:
                return None

            if amount_raw <= 0:
                return None

            # -----------------------------------------------------
            # Decode transaction hash
            # -----------------------------------------------------
            raw_tx_hash = (
                log.get("transactionHash")
                or log.get("transaction_hash")
                or log.get("tx_hash")
                or log.get("hash")
            )

            tx_hash = self._normalize_tx_hash(raw_tx_hash)

            if not tx_hash:
                return None

            # -----------------------------------------------------
            # Return decoded event
            # -----------------------------------------------------
            return {
                "bridge_name": bridge_meta["bridge_name"],
                "destination_chain": bridge_meta["destination_chain"],
                "bridge_contract": contract_address,
                "depositor": depositor,
                "deposit_receiver": deposit_receiver,
                "root_token": root_token,
                "amount": str(amount_raw),
                "tx_hash": tx_hash,
            }

        except (TypeError, ValueError, AttributeError):
            return None