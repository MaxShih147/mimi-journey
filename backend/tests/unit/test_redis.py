"""Tests for Redis session store."""

import json
from unittest.mock import AsyncMock

import pytest

from app.core.redis import RedisSessionStore


@pytest.fixture
def mock_redis():
    """Create a mock Redis client."""
    r = AsyncMock()
    return r


@pytest.fixture
def session_store(mock_redis):
    return RedisSessionStore(mock_redis)


class TestRedisSessionStore:
    def test_key_generation(self, session_store):
        assert session_store._key("abc") == "session:abc"

    def test_custom_prefix(self, mock_redis):
        store = RedisSessionStore(mock_redis, prefix="custom:")
        assert store._key("abc") == "custom:abc"

    @pytest.mark.asyncio
    async def test_get_returns_parsed_json(self, session_store, mock_redis):
        mock_redis.get.return_value = json.dumps({"user_id": "123"})
        result = await session_store.get("sess-1")
        assert result == {"user_id": "123"}
        mock_redis.get.assert_called_once_with("session:sess-1")

    @pytest.mark.asyncio
    async def test_get_returns_none_when_missing(self, session_store, mock_redis):
        mock_redis.get.return_value = None
        result = await session_store.get("nonexistent")
        assert result is None

    @pytest.mark.asyncio
    async def test_set_stores_json(self, session_store, mock_redis):
        data = {"user_id": "123", "access_token": "tok"}
        await session_store.set("sess-1", data)
        mock_redis.set.assert_called_once_with("session:sess-1", json.dumps(data))

    @pytest.mark.asyncio
    async def test_set_with_expiry(self, session_store, mock_redis):
        await session_store.set("sess-1", {"key": "val"}, expire_seconds=3600)
        mock_redis.expire.assert_called_once_with("session:sess-1", 3600)

    @pytest.mark.asyncio
    async def test_set_without_expiry_does_not_call_expire(self, session_store, mock_redis):
        await session_store.set("sess-1", {"key": "val"})
        mock_redis.expire.assert_not_called()

    @pytest.mark.asyncio
    async def test_delete(self, session_store, mock_redis):
        await session_store.delete("sess-1")
        mock_redis.delete.assert_called_once_with("session:sess-1")

    @pytest.mark.asyncio
    async def test_extend(self, session_store, mock_redis):
        await session_store.extend("sess-1", 7200)
        mock_redis.expire.assert_called_once_with("session:sess-1", 7200)
