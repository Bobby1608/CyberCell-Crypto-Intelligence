import time
import json
import asyncio
import os
from typing import AsyncGenerator, Dict, Any, Set
import redis.asyncio as redis

TX_INCLUDED = "TX_INCLUDED"
GRAPH_UPDATED = "GRAPH_UPDATED"
RISK_EVALUATED = "RISK_EVALUATED"
SURVEILLANCE_ADDED = "SURVEILLANCE_ADDED"
NCRP_COMPLAINT_INGESTED = "NCRP_COMPLAINT_INGESTED"

VALID_EVENTS = {TX_INCLUDED, GRAPH_UPDATED, RISK_EVALUATED, SURVEILLANCE_ADDED, NCRP_COMPLAINT_INGESTED}

class EventBus:
    """
    Decoupled Redis-backed Event Bus for real-time event distribution.
    """
    def __init__(self):
        redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
        self.redis = redis.from_url(redis_url, decode_responses=True)
        self.channel = "forensics:events"

    async def publish(self, event_type: str, data: Dict[str, Any]) -> None:
        """
        Pushes formatted event payload to Redis Pub/Sub channel.
        """
        if event_type not in VALID_EVENTS:
            raise ValueError(f"Invalid event type: {event_type}. Must be one of {VALID_EVENTS}")

        payload = {
            "event": event_type,
            "data": data,
            "timestamp": time.time()
        }

        try:
            await self.redis.publish(self.channel, json.dumps(payload))
        except Exception as exc:
            print(f"[EVENT BUS] Warning dispatching event to Redis: {exc}")

    async def subscribe(self) -> AsyncGenerator[Dict[str, Any], None]:
        """
        Yields incoming event payloads as an AsyncGenerator for SSE endpoints.
        """
        pubsub = self.redis.pubsub()
        await pubsub.subscribe(self.channel)
        
        try:
            async for message in pubsub.listen():
                if message['type'] == 'message':
                    yield json.loads(message['data'])
        except asyncio.CancelledError:
            pass
        finally:
            await pubsub.unsubscribe(self.channel)
            await pubsub.close()

# Global singleton event bus instance
event_bus = EventBus()
