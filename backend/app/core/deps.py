"""FastAPI dependencies."""

from typing import Annotated

from fastapi import Cookie, Depends, HTTPException, status
from redis.asyncio import Redis
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.exceptions import AuthenticationError
from app.core.redis import RedisSessionStore, get_redis


async def get_session_store(
    redis: Annotated[Redis, Depends(get_redis)],
) -> RedisSessionStore:
    """Get Redis session store."""
    return RedisSessionStore(redis)


async def get_current_user_id(
    session_id: Annotated[str | None, Cookie()] = None,
    session_store: Annotated[RedisSessionStore, Depends(get_session_store)] = None,
) -> str:
    """Get current authenticated user ID from session."""
    if not session_id:
        raise AuthenticationError("No session cookie found")

    session_data = await session_store.get(session_id)
    if not session_data:
        raise AuthenticationError("Invalid or expired session")

    user_id = session_data.get("user_id")
    if not user_id:
        raise AuthenticationError("No user in session")

    return user_id


async def get_optional_user_id(
    session_id: Annotated[str | None, Cookie()] = None,
    session_store: Annotated[RedisSessionStore, Depends(get_session_store)] = None,
) -> str | None:
    """Get current user ID if authenticated, None otherwise."""
    if not session_id:
        return None

    session_data = await session_store.get(session_id)
    if not session_data:
        return None

    return session_data.get("user_id")


# Type aliases for dependency injection
DbSession = Annotated[AsyncSession, Depends(get_db)]
RedisClient = Annotated[Redis, Depends(get_redis)]
SessionStore = Annotated[RedisSessionStore, Depends(get_session_store)]
CurrentUserId = Annotated[str, Depends(get_current_user_id)]
OptionalUserId = Annotated[str | None, Depends(get_optional_user_id)]
