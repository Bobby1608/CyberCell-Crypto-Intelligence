import time
import asyncio
from typing import AsyncGenerator, Dict, Any, Set

TX_INCLUDED = "TX_INCLUDED"
GRAPH_UPDATED = "GRAPH_UPDATED"
RISK_EVALUATED = "RISK_EVALUATED"
SURVEILLANCE_ADDED = "SURVEILLANCE_ADDED"
NCRP_COMPLAINT_INGESTED = "NCRP_COMPLAINT_INGESTED"

VALID_EVENTS = {TX_INCLUDED, GRAPH_UPDATED, RISK_EVALUATED, SURVEILLANCE_ADDED, NCRP_COMPLAINT_INGESTED}

class EventBus:
    """
    Decoupled In-Memory Event Bus for real-time event distribution via asyncio.Queue subscribers.
    """
    def __init__(self):
        self._subscribers: Set[asyncio.Queue] = set()

    async def publish(self, event_type: str, data: Dict[str, Any]) -> None:
        """
        Pushes formatted event payload non-blocking to all active subscriber queues.
        """
        if event_type not in VALID_EVENTS:
            raise ValueError(f"Invalid event type: {event_type}. Must be one of {VALID_EVENTS}")

        payload = {
            "event": event_type,
            "data": data,
            "timestamp": time.time()
        }

        # Dispatch non-blocking to all active queues
        dead_queues = set()
        for queue in list(self._subscribers):
            try:
                queue.put_nowait(payload)
            except asyncio.QueueFull:
                # Remove stale or overflowing queues
                dead_queues.add(queue)
            except Exception as exc:
                print(f"[EVENT BUS] Warning dispatching event to subscriber: {exc}")
                dead_queues.add(queue)

        for dq in dead_queues:
            self._subscribers.discard(dq)

    async def subscribe(self) -> AsyncGenerator[Dict[str, Any], None]:
        """
        Yields incoming event payloads as an AsyncGenerator for SSE endpoints.
        """
        queue: asyncio.Queue = asyncio.Queue(maxsize=200)
        self._subscribers.add(queue)
        try:
            while True:
                payload = await queue.get()
                yield payload
        except asyncio.CancelledError:
            pass
        finally:
            self._subscribers.discard(queue)

# Global singleton event bus instance
event_bus = EventBus()
