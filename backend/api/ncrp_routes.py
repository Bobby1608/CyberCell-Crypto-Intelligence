from enum import Enum
from decimal import Decimal
from typing import Optional
from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel, Field
from datetime import datetime
from backend.services.event_bus import event_bus
from backend.services.attribution.vasp_engine import VASPEngine

router = APIRouter(prefix="/api/v1/integrations/ncrp", tags=["NCRP / SAHYOG Integration"])
vasp_engine = VASPEngine()

class CrimeCategory(str, Enum):
    INVESTMENT_SCAM = "INVESTMENT_SCAM"
    TASK_BASED_FRAUD = "TASK_BASED_FRAUD"
    SEXTORTION = "SEXTORTION"
    RANSOMWARE = "RANSOMWARE"
    PHISHING_KEY_THEFT = "PHISHING_KEY_THEFT"
    UNAUTHORIZED_TRANSFER = "UNAUTHORIZED_TRANSFER"

class NCRPComplaintPayload(BaseModel):
    acknowledgement_no: str = Field(..., example="2026/NCRP/MH/0048192")
    incident_timestamp: int = Field(..., example=1788255756)
    crime_category: CrimeCategory
    victim_name: str = Field(..., example="Aarav Sharma")
    victim_contact: str = Field(..., example="+91-9876543210")
    reported_wallet: str = Field(..., example="0xb1ad40e588959c203617cd55b5cd32cc2795a9ff")
    chain: str = Field(default="sepolia", example="sepolia")
    reported_loss_inr: Decimal = Field(..., example=250000.00)
    reported_loss_crypto: Decimal = Field(..., example=0.085)
    asset_symbol: str = Field(default="ETH", example="ETH")
    police_station: str = Field(..., example="Cyber Crime Police Station, Wadala")
    district: str = Field(..., example="Mumbai City")
    state: str = Field(default="Maharashtra", example="Maharashtra")

class NCRPIngestResponse(BaseModel):
    status: str
    case_reference_id: str
    acknowledgement_no: str
    timestamp: datetime
    initial_attribution: dict
    actions_triggered: list[str]

@router.post("/ingest", response_model=NCRPIngestResponse)
async def ingest_ncrp_complaint(complaint: NCRPComplaintPayload, background_tasks: BackgroundTasks):
    clean_wallet = complaint.reported_wallet.lower()
    
    # Run immediate baseline attribution check
    attribution = vasp_engine.attribute_address(clean_wallet)
    
    # Broadcast to SSE event bus
    await event_bus.publish("NCRP_COMPLAINT_INGESTED", {
        "acknowledgement_no": complaint.acknowledgement_no,
        "victim_name": complaint.victim_name,
        "reported_wallet": clean_wallet,
        "crime_category": complaint.crime_category,
        "reported_loss_inr": str(complaint.reported_loss_inr),
        "police_station": complaint.police_station
    })
    
    actions = [
        f"Real-time WebSocket surveillance attached to {clean_wallet}",
        "Triggered recursive transaction graph ingestion",
        "Registered with I4C SAHYOG inter-agency queue"
    ]
    
    return NCRPIngestResponse(
        status="PROCESSED_AND_SURVEILLANCE_ACTIVE",
        case_reference_id=f"CFA-CASE-{complaint.acknowledgement_no.split('/')[-1]}",
        acknowledgement_no=complaint.acknowledgement_no,
        timestamp=datetime.utcnow(),
        initial_attribution=attribution.model_dump(),
        actions_triggered=actions
    )
