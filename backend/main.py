import os
import asyncio
import structlog
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

structlog.configure(
    processors=[
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.JSONRenderer()
    ]
)

from backend.api.routes import router as api_router
from backend.api.ncrp_routes import router as ncrp_router
from backend.api.report_routes import report_router
from backend.services.blockchain.watcher import BlockchainWatcher

load_dotenv()

watcher_instance: BlockchainWatcher | None = None
watcher_task: asyncio.Task = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    FastAPI Lifespan Context Manager handling clean startup & shutdown of background blockchain workers.
    Routes between live WebSocket watcher and offline ReplayRunner based on APP_MODE environment variable.
    """
    global watcher_instance, watcher_task
    
    ws_url = os.getenv("SEPOLIA_WS_URL")
    wallet_a = os.getenv("ROOT_SUSPECT_ADDRESS", "0xb1ad40e588959c203617cd55b5cd32cc2795a9ff")
    wallet_b = os.getenv("HOP_1_ADDRESS", "0x8ee589da48e2a3a51030f60a4bb51241bb18a07")

    print("[*] Starting Real-Time Forensics Engine...")

    if ws_url:
        print("[+] Initializing Live Sepolia WebSocket Watcher...")
        watcher_instance = BlockchainWatcher(
            ws_url=ws_url,
            watch_addresses=[wallet_a, wallet_b],
            root_suspect_address=wallet_a
        )
        watcher_task = asyncio.create_task(watcher_instance.start())
    else:
        print("[!] SEPOLIA_WS_URL not set in environment. Live watcher worker paused.")

    yield

    print("[*] Shutting down Forensics Engine...")
    if watcher_task and not watcher_task.done():
        watcher_task.cancel()
        try:
            await watcher_task
        except asyncio.CancelledError:
            print("[+] Worker task cancelled successfully.")

    if watcher_instance:
        if hasattr(watcher_instance, "close"):
            await watcher_instance.close()
        elif hasattr(watcher_instance, "db_loader"):
            await watcher_instance.db_loader.close()
            await watcher_instance.extractor.close()
        print("[+] Closed Neo4j database connections.")

app = FastAPI(
    title="Real-Time Crypto Forensics & Risk Engine API",
    version="1.0.0",
    description="Event-Driven Blockchain Forensics & Real-Time SSE Threat Intelligence Engine",
    lifespan=lifespan
)

# CORS Configuration for Frontend UI (React / Vite)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ],
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API Router under /api/v1
app.include_router(api_router, prefix="/api/v1")
app.include_router(ncrp_router)
app.include_router(report_router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)