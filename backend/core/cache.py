"""Redis In-Memory Trace Caching Manager.

Provides connection pooling, JSON serialization, idempotency key generation,
and safe fallback if Redis is unreachable.
"""

import json
import logging
import os
from typing import Any

import redis

logger = logging.getLogger(__name__)

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
DEFAULT_CACHE_TTL = 86400  # 24 hours


class TraceCache:
    """Manages Redis connection pooling and trace payload caching."""

    def __init__(self, redis_url: str = REDIS_URL):
        try:
            self.pool = redis.ConnectionPool.from_url(
                redis_url,
                decode_responses=True,
                socket_timeout=2.0,
                socket_connect_timeout=2.0,
            )
            self.client = redis.Redis(connection_pool=self.pool)
        except Exception as exc:
            logger.warning("Redis initialization failed. Running in bypass mode: %s", exc)
            self.client = None

    @staticmethod
    def build_cache_key(
        chain_id: int,
        wallet_address: str,
        start_block: int,
        end_block: int,
        action: str = "txlist",
    ) -> str:
        """Constructs an idempotent cache key for trace queries."""
        clean_addr = wallet_address.strip().lower()
        return f"tx:{chain_id}:{clean_addr}:{start_block}:{end_block}:{action}"

    def get_cached_trace(self, key: str) -> dict[str, Any] | list[dict[str, Any]] | None:
        """Retrieves and deserializes JSON payload from Redis."""
        if not self.client:
            return None

        try:
            cached_val = self.client.get(key)
            if cached_val is not None:
                return json.loads(cached_val)
        except (redis.RedisError, json.JSONDecodeError) as exc:
            logger.warning("Redis read error for key %s: %s", key, exc)
            return None

        return None

    def set_cached_trace(
        self,
        key: str,
        data: Any,
        ttl: int = DEFAULT_CACHE_TTL,
    ) -> bool:
        """Serializes and stores data in Redis with a TTL."""
        if not self.client:
            return False

        try:
            serialized = json.dumps(data)
            self.client.set(key, serialized, ex=ttl)
            return True
        except (redis.RedisError, TypeError) as exc:
            logger.warning("Redis write error for key %s: %s", key, exc)
            return False


# Global cache instance
trace_cache = TraceCache()