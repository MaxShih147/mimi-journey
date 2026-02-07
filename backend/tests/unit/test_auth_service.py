"""Tests for authentication service."""

import json
from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.core.exceptions import AuthenticationError, ExternalServiceError
from app.services.auth_service import AuthService, SESSION_EXPIRE_SECONDS


@pytest.fixture
def mock_db():
    return AsyncMock()


@pytest.fixture
def mock_session_store():
    store = AsyncMock()
    return store


@pytest.fixture
def service(mock_db, mock_session_store):
    return AuthService(mock_db, mock_session_store)


class TestInitiateOAuth:
    @pytest.mark.asyncio
    async def test_returns_auth_url_state(self, service):
        auth_url, state, code_verifier = await service.initiate_oauth()

        assert auth_url.startswith("https://accounts.google.com/")
        assert len(state) > 0

    @pytest.mark.asyncio
    async def test_stores_state_in_redis(self, service, mock_session_store):
        _, state, _ = await service.initiate_oauth()

        mock_session_store.set.assert_called_once()
        call_args = mock_session_store.set.call_args
        assert call_args[0][0] == f"oauth_state:{state}"
        assert call_args[1]["expire_seconds"] == 600


class TestHandleCallback:
    @pytest.mark.asyncio
    async def test_invalid_state_raises(self, service, mock_session_store):
        mock_session_store.get.return_value = None

        with pytest.raises(AuthenticationError, match="Invalid or expired OAuth state"):
            await service.handle_callback("code", "bad-state")

    @pytest.mark.asyncio
    async def test_deletes_state_after_use(self, service, mock_session_store):
        mock_session_store.get.return_value = {"code_verifier": ""}

        def _mock_exchange(*args, **kwargs):
            return {"access_token": "tok", "expires_in": 3600}

        def _mock_userinfo(*args, **kwargs):
            return {"sub": "g-1", "email": "a@b.com", "name": "User"}

        with patch.object(service, "_exchange_code", new=AsyncMock(side_effect=_mock_exchange)), \
             patch.object(service, "_get_user_info", new=AsyncMock(side_effect=_mock_userinfo)), \
             patch.object(service, "_create_or_update_user", new=AsyncMock(return_value=MagicMock(id="uid"))), \
             patch.object(service, "_create_session", new=AsyncMock(return_value="sess-id")):
            await service.handle_callback("code", "valid-state")

        mock_session_store.delete.assert_called_with("oauth_state:valid-state")


class TestExchangeCode:
    @pytest.mark.asyncio
    async def test_success(self, service):
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "access_token": "at",
            "refresh_token": "rt",
            "expires_in": 3600,
        }

        mock_client = AsyncMock()
        mock_client.post.return_value = mock_response
        mock_client.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client.__aexit__ = AsyncMock(return_value=False)

        with patch("app.services.auth_service.httpx.AsyncClient", return_value=mock_client):
            result = await service._exchange_code("auth-code", "")

        assert result["access_token"] == "at"

    @pytest.mark.asyncio
    async def test_failure_raises(self, service):
        mock_response = MagicMock()
        mock_response.status_code = 400

        mock_client = AsyncMock()
        mock_client.post.return_value = mock_response
        mock_client.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client.__aexit__ = AsyncMock(return_value=False)

        with patch("app.services.auth_service.httpx.AsyncClient", return_value=mock_client):
            with pytest.raises(ExternalServiceError):
                await service._exchange_code("bad-code", "")


class TestGetUserInfo:
    @pytest.mark.asyncio
    async def test_success(self, service):
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "sub": "google-123",
            "email": "user@example.com",
            "name": "Test User",
        }

        mock_client = AsyncMock()
        mock_client.get.return_value = mock_response
        mock_client.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client.__aexit__ = AsyncMock(return_value=False)

        with patch("app.services.auth_service.httpx.AsyncClient", return_value=mock_client):
            result = await service._get_user_info("access-token")

        assert result["sub"] == "google-123"

    @pytest.mark.asyncio
    async def test_failure_raises(self, service):
        mock_response = MagicMock()
        mock_response.status_code = 401

        mock_client = AsyncMock()
        mock_client.get.return_value = mock_response
        mock_client.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client.__aexit__ = AsyncMock(return_value=False)

        with patch("app.services.auth_service.httpx.AsyncClient", return_value=mock_client):
            with pytest.raises(ExternalServiceError):
                await service._get_user_info("bad-token")


class TestRefreshAccessToken:
    @pytest.mark.asyncio
    async def test_no_refresh_token_returns_none(self, service):
        user = MagicMock()
        user.refresh_token = None
        result = await service.refresh_access_token(user)
        assert result is None

    @pytest.mark.asyncio
    async def test_success(self, service):
        user = MagicMock()
        user.refresh_token = "valid-rt"

        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "access_token": "new-at",
            "expires_in": 3600,
        }

        mock_client = AsyncMock()
        mock_client.post.return_value = mock_response
        mock_client.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client.__aexit__ = AsyncMock(return_value=False)

        with patch("app.services.auth_service.httpx.AsyncClient", return_value=mock_client):
            result = await service.refresh_access_token(user)

        assert result["access_token"] == "new-at"

    @pytest.mark.asyncio
    async def test_failure_returns_none(self, service):
        user = MagicMock()
        user.refresh_token = "expired-rt"

        mock_response = MagicMock()
        mock_response.status_code = 401

        mock_client = AsyncMock()
        mock_client.post.return_value = mock_response
        mock_client.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client.__aexit__ = AsyncMock(return_value=False)

        with patch("app.services.auth_service.httpx.AsyncClient", return_value=mock_client):
            result = await service.refresh_access_token(user)

        assert result is None


class TestLogout:
    @pytest.mark.asyncio
    async def test_deletes_session(self, service, mock_session_store):
        await service.logout("session-123")
        mock_session_store.delete.assert_called_once_with("session-123")


class TestGetSessionAccessToken:
    @pytest.mark.asyncio
    async def test_no_session_returns_none(self, service, mock_session_store):
        mock_session_store.get.return_value = None
        result = await service.get_session_access_token("bad-session")
        assert result is None

    @pytest.mark.asyncio
    async def test_valid_token_returned(self, service, mock_session_store):
        future_time = (datetime.now(timezone.utc) + timedelta(hours=1)).isoformat()
        mock_session_store.get.return_value = {
            "user_id": "u1",
            "access_token": "valid-token",
            "expires_at": future_time,
        }
        result = await service.get_session_access_token("good-session")
        assert result == "valid-token"

    @pytest.mark.asyncio
    async def test_no_user_id_returns_none(self, service, mock_session_store):
        mock_session_store.get.return_value = {"access_token": "tok"}
        result = await service.get_session_access_token("sess")
        assert result is None
