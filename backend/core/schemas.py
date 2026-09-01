from enum import Enum
from decimal import Decimal
from typing import Optional, List
from pydantic import BaseModel

class TxStatus(str, Enum):
    INCLUDED = "INCLUDED"
    PENDING = "PENDING"
    CONFIRMED = "CONFIRMED"

class AssetType(str, Enum):
    NATIVE = "NATIVE"
    ERC20 = "ERC20"

class TransactionRecord(BaseModel):
    tx_hash: str
    block_number: int
    timestamp: int
    from_address: str
    to_address: Optional[str] = None
    amount: Decimal
    raw_amount: str
    asset_type: AssetType
    asset_contract: Optional[str] = None
    asset_symbol: str
    status: TxStatus = TxStatus.INCLUDED

# --- Milestone 5 Models: Laundering Typologies & Risk Reporting ---

class TypologyFlags(BaseModel):
    rapid_pass_through: bool = False
    peel_chain: bool = False
    fan_out: bool = False

class RiskAnalysisReport(BaseModel):
    root_address: str
    paths_detected: int
    max_hop_depth: int
    typologies: TypologyFlags
    risk_score: float  # Bounded between 0.0 and 1.0
    reasons: List[str]
    valid_paths: List[List[str]]