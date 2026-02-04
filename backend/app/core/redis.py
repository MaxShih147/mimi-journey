"""Redis connection management."""

from typing import AsyncGenerator

import redis.asyncio as redis
from redis.asyncio import Redis

from app.core.config import settings

# Global Redis pool
_redis_pool: Redis | None = None


async def get_redis_pool() -> Redis:
    """Get or create Redis connection pool."""
    global _redis_pool
    if _redis_pool is None:
        _redis_pool = redis.from_url(
            str(settings.REDIS_URL),
            encoding="utf-8",
            decode_responses=True,
        )
    return _redis_pool


async def close_redis_pool() -> None:
    """Close Redis connection pool."""
    global _redis_pool
    if _redis_pool is not None:
        await _redis_pool.close()
        _redis_pool = None


async def get_redis() -> AsyncGenerator[Redis, None]:
    """Dependency to get Redis connection."""
    pool = await get_redis_pool()
    yield pool


class RedisSessionStore:
    """Redis-based session storage."""

    def __init__(self, redis_client: Redis, prefix: str = "session:") -> None:
        self.redis = redis_client
        self.prefix = prefix

    def _key(self, session_id: str) -> str:
        """Generate Redis key for session."""
        return f"{self.prefix}{session_id}"

    async def get(self, session_id: str) -> dict | None:
        """Get session data."""
        import json

        data = await self.redis.get(self._key(session_id))
        if data:
            return json.loads(data)
        return None

    async def set(
        self,
        session_id: str,
        data: dict,
        expire_seconds: int | None = None,
    ) -> None:
        """Set session data."""
        import json

        key = self._key(session_id)
        await self.redis.set(key, json.dumps(data))
        if expire_seconds:
            await self.redis.expire(key, expire_seconds)

    async def delete(self, session_id: str) -> None:
        """Delete session."""
        await self.redis.delete(self._key(session_id))

    async def extend(self, session_id: str, expire_seconds: int) -> None:
        """Extend session expiry."""
        await self.redis.expire(self._key(session_id), expire_seconds)
