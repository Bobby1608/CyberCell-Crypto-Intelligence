from decimal import Decimal
from typing import Any, Optional
from pydantic import BaseModel, ConfigDict, Field, field_validator


class BlockHeaderSchema(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    number: int
    hash: str
    parent_hash: str = Field(alias="parentHash")
    timestamp: int

    @field_validator("number", "timestamp", mode="before")
    @classmethod
    def parse_hex_integers(cls, v: Any) -> int:
        if isinstance(v, str) and v.startswith("0x"):
            return int(v, 16)
        return int(v)

    @field_validator("hash", "parent_hash", mode="before")
    @classmethod
    def parse_hex_strings(cls, v: Any) -> str:
        if hasattr(v, "hex"):
            return "0x" + v.hex().lower().removeprefix("0x")
        return str(v).lower()


class LiveTransactionSchema(BaseModel):
    tx_hash: str
    block_number: int
    from_address: str
    to_address: Optional[str] = None
    value_wei: int
    value_eth: Decimal
    gas_price_gwei: Optional[Decimal] = None

    @field_validator("from_address", "to_address", mode="before")
    @classmethod
    def normalize_address(cls, v: Any) -> Optional[str]:
        if not v:
            return None
        s = str(v).lower().strip()
        return s if s.startswith("0x") else "0x" + s

    @field_validator("tx_hash", mode="before")
    @classmethod
    def normalize_tx_hash(cls, v: Any) -> str:
        if hasattr(v, "hex"):
            return "0x" + v.hex().lower().removeprefix("0x")
        s = str(v).lower().strip()
        return s if s.startswith("0x") else "0x" + s


class LiveAlertSchema(BaseModel):
    event_type: str  # "INCOMING_TRANSFER", "OUTGOING_TRANSFER", "BRIDGE_DEPOSIT"
    target_wallet: str
    counterparty: Optional[str]
    amount_eth: str
    tx_hash: str
    block_number: int