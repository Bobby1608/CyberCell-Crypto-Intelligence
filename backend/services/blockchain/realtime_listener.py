import asyncio
import os
from decimal import Decimal
from typing import Optional
from dotenv import load_dotenv
from web3 import AsyncWeb3, WebSocketProvider

from backend.schemas.events import (
    BlockHeaderSchema,
    LiveAlertSchema,
)
from backend.services.crosschain.bridge_decoder import BridgeDecoder
from backend.services.crosschain.swap_decoder import SwapDecoder

load_dotenv()

SEPOLIA_WS_URL = os.getenv("SEPOLIA_WS_URL")
WATCH_ADDRESS = (os.getenv("WATCH_ADDRESS") or "").lower()


class RealtimeBlockchainListener:
    def __init__(self, ws_url: Optional[str] = None, watch_address: Optional[str] = None):
        self.ws_url = ws_url or SEPOLIA_WS_URL
        self.watch_address = (watch_address or WATCH_ADDRESS).lower()
        self.bridge_decoder = BridgeDecoder()
        self.swap_decoder = SwapDecoder()
        self.is_running = False

    async def start(self):
        if not self.ws_url:
            raise RuntimeError("SEPOLIA_WS_URL is not set in environment variables.")

        print(f"[*] Connecting to WebSocket: {self.ws_url[:35]}...")
        print(f"[*] Surveillance active on Target Address: {self.watch_address or 'ALL'}")

        self.is_running = True

        async with AsyncWeb3(WebSocketProvider(self.ws_url)) as w3:
            subscription_id = await w3.eth.subscribe("newHeads")
            print(f"[+] Subscribed to newHeads (Subscription ID: {subscription_id})")

            try:
                async for response in w3.socket.process_subscriptions():
                    if not self.is_running:
                        break

                    header_raw = response.get("result", {})
                    if not header_raw:
                        continue

                    header = BlockHeaderSchema(**header_raw)
                    print(f"\n--- [Block #{header.number}] Hash: {header.hash[:14]}... ---")

                    # Fetch full block with transactions
                    block = await w3.eth.get_block(header.number, full_transactions=True)
                    await self._process_block_transactions(w3, block)

            except Exception as e:
                print(f"[!] WebSocket Stream Error: {e}")
            finally:
                await w3.eth.unsubscribe(subscription_id)
                print("[*] Unsubscribed from WebSocket stream.")

    async def _process_block_transactions(self, w3: AsyncWeb3, block: dict):
        transactions = block.get("transactions", [])

        for tx in transactions:
            from_addr = (tx.get("from") or "").lower()
            to_addr = (tx.get("to") or "").lower()
            tx_hash = (
                tx.get("hash").hex()
                if hasattr(tx.get("hash"), "hex")
                else str(tx.get("hash"))
            )

            value_wei = int(tx.get("value", 0))
            value_eth = Decimal(value_wei) / Decimal(10**18)

            # Check if transaction touches WATCH_ADDRESS
            if self.watch_address and (from_addr == self.watch_address or to_addr == self.watch_address):
                event_type = "OUTGOING_TRANSFER" if from_addr == self.watch_address else "INCOMING_TRANSFER"
                counterparty = to_addr if event_type == "OUTGOING_TRANSFER" else from_addr

                alert = LiveAlertSchema(
                    event_type=event_type,
                    target_wallet=self.watch_address,
                    counterparty=counterparty,
                    amount_eth=str(value_eth),
                    tx_hash=tx_hash,
                    block_number=block.get("number"),
                )

                print(f"\n🚨 [REAL-TIME ALERT] {alert.event_type} DETECTED!")
                print(f"   Target: {alert.target_wallet}")
                print(f"   Counterparty: {alert.counterparty}")
                print(f"   Amount: {alert.amount_eth} ETH")
                print(f"   TX Hash: {alert.tx_hash}")

    def stop(self):
        self.is_running = False


if __name__ == "__main__":
    listener = RealtimeBlockchainListener()
    try:
        asyncio.run(listener.start())
    except KeyboardInterrupt:
        print("\n[*] Listener shut down by user.")