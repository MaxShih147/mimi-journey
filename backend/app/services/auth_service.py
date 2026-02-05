"""Authentication service with Google OAuth."""

from datetime import datetime, timedelta, timezone
from typing import Any

import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.exceptions import AuthenticationError, ExternalServiceError
from app.core.redis import RedisSessionStore
from app.core.security import (
    build_google_auth_url,
    generate_code_challenge,
    generate_code_verifier,
    generate_session_id,
    generate_state,
)
from app.models.user import User

# Google OAuth endpoints
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo"

# Session configuration
SESSION_EXPIRE_SECONDS = 7 * 24 * 60 * 60  # 7 days
OAUTH_STATE_EXPIRE_SECONDS = 600  # 10 minutes


class AuthService:
    """Service for handling Google OAuth authentication."""

    def __init__(self, db: AsyncSession, session_store: RedisSessionStore) -> None:
        self.db = db
        self.session_store = session_store

    async def initiate_oauth(self) -> tuple[str, str, str]:
        """
        Initiate OAuth flow and return auth URL with state.

        Returns:
            Tuple of (auth_url, state, code_verifier)
        """
        state = generate_state()

        scopes = [
            "openid",
            "email",
            "profile",
            "https://www.googleapis.com/auth/calendar.readonly",
        ]

        # Build simple OAuth URL without PKCE
        from urllib.parse import urlencode
        params = {
            "client_id": settings.GOOGLE_CLIENT_ID,
            "redirect_uri": settings.GOOGLE_REDIRECT_URI,
            "response_type": "code",
            "scope": " ".join(scopes),
            "state": state,
            "access_type": "offline",
            "prompt": "consent",
        }
        auth_url = f"https://accounts.google.com/o/oauth2/v2/auth?{urlencode(params)}"

        # Store state in Redis (no code_verifier needed without PKCE)
        await self.session_store.set(
            f"oauth_state:{state}",
            {"code_verifier": ""},
            expire_seconds=OAUTH_STATE_EXPIRE_SECONDS,
        )

        return auth_url, state, ""

    async def handle_callback(self, code: str, state: str) -> tuple[User, str]:
        """
        Handle OAuth callback and create/update user.

        Args:
            code: Authorization code from Google
            state: State token to verify

        Returns:
            Tuple of (user, session_id)
        """
        # Verify state and get code_verifier
        state_data = await self.session_store.get(f"oauth_state:{state}")
        if not state_data:
            raise AuthenticationError("Invalid or expired OAuth state")

        code_verifier = state_data.get("code_verifier", "")

        # Delete state after use
        await self.session_store.delete(f"oauth_state:{state}")

        # Exchange code for tokens
        tokens = await self._exchange_code(code, code_verifier)

        # Get user info from Google
        user_info = await self._get_user_info(tokens["access_token"])

        # Create or update user in database
        user = await self._create_or_update_user(user_info, tokens)

        # Create session
        session_id = await self._create_session(user, tokens)

        return user, session_id

    async def _exchange_code(self, code: str, code_verifier: str) -> dict[str, Any]:
        """Exchange authorization code for tokens."""
        async with httpx.AsyncClient() as client:
            data = {
                "client_id": settings.GOOGLE_CLIENT_ID,
                "client_secret": settings.GOOGLE_CLIENT_SECRET,
                "code": code,
                "grant_type": "authorization_code",
                "redirect_uri": settings.GOOGLE_REDIRECT_URI,
            }
            # Only include code_verifier if using PKCE
            if code_verifier:
                data["code_verifier"] = code_verifier

            response = await client.post(GOOGLE_TOKEN_URL, data=data)

            if response.status_code != 200:
                raise ExternalServiceError("Google OAuth", "Failed to exchange authorization code")

            return response.json()

    async def _get_user_info(self, access_token: str) -> dict[str, Any]:
        """Get user info from Google."""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                GOOGLE_USERINFO_URL,
                headers={"Authorization": f"Bearer {access_token}"},
            )

            if response.status_code != 200:
                raise ExternalServiceError("Google OAuth", "Failed to get user info")

            return response.json()

    async def _create_or_update_user(
        self, user_info: dict[str, Any], tokens: dict[str, Any]
    ) -> User:
        """Create or update user in database."""
        google_id = user_info["sub"]

        # Check for existing user
        stmt = select(User).where(User.google_id == google_id)
        result = await self.db.execute(stmt)
        user = result.scalar_one_or_none()

        if user:
            # Update existing user
            user.email = user_info.get("email", user.email)
            user.name = user_info.get("name", user.name)
            user.picture_url = user_info.get("picture")
            if tokens.get("refresh_token"):
                user.refresh_token = tokens["refresh_token"]
            if tokens.get("expires_in"):
                user.token_expires_at = datetime.now(timezone.utc) + timedelta(
                    seconds=tokens["expires_in"]
                )
        else:
            # Create new user
            user = User(
                google_id=google_id,
                email=user_info["email"],
                name=user_info.get("name", user_info["email"]),
                picture_url=user_info.get("picture"),
                refresh_token=tokens.get("refresh_token"),
                token_expires_at=datetime.now(timezone.utc)
                + timedelta(seconds=tokens.get("expires_in", 3600)),
            )
            self.db.add(user)

        await self.db.flush()
        return user

    async def _create_session(self, user: User, tokens: dict[str, Any]) -> str:
        """Create a new session for the user."""
        session_id = generate_session_id()

        session_data = {
            "user_id": str(user.id),
            "access_token": tokens["access_token"],
            "token_type": tokens.get("token_type", "Bearer"),
            "expires_at": (
                datetime.now(timezone.utc) + timedelta(seconds=tokens.get("expires_in", 3600))
            ).isoformat(),
        }

        await self.session_store.set(
            session_id, session_data, expire_seconds=SESSION_EXPIRE_SECONDS
        )

        return session_id

    async def get_user_by_id(self, user_id: str) -> User | None:
        """Get user by ID."""
        stmt = select(User).where(User.id == user_id)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def refresh_access_token(self, user: User) -> dict[str, Any] | None:
        """Refresh the access token for a user."""
        if not user.refresh_token:
            return None

        async with httpx.AsyncClient() as client:
            response = await client.post(
                GOOGLE_TOKEN_URL,
                data={
                    "client_id": settings.GOOGLE_CLIENT_ID,
                    "client_secret": settings.GOOGLE_CLIENT_SECRET,
                    "refresh_token": user.refresh_token,
                    "grant_type": "refresh_token",
                },
            )

            if response.status_code != 200:
                return None

            tokens = response.json()

            # Update token expiry
            user.token_expires_at = datetime.now(timezone.utc) + timedelta(
                seconds=tokens.get("expires_in", 3600)
            )
            await self.db.flush()

            return tokens

    async def logout(self, session_id: str) -> None:
        """Delete user session."""
        await self.session_store.delete(session_id)

    async def get_session_access_token(self, session_id: str) -> str | None:
        """Get access token from session, refreshing if needed."""
        session_data = await self.session_store.get(session_id)
        if not session_data:
            return None

        user_id = session_data.get("user_id")
        if not user_id:
            return None

        # Check if token is expired or about to expire
        expires_at_str = session_data.get("expires_at")
        if expires_at_str:
            expires_at = datetime.fromisoformat(expires_at_str)
            if expires_at < datetime.now(timezone.utc) + timedelta(minutes=5):
                # Token is expired or about to expire, refresh it
                user = await self.get_user_by_id(user_id)
                if user:
                    new_tokens = await self.refresh_access_token(user)
                    if new_tokens:
                        # Update session with new token
                        session_data["access_token"] = new_tokens["access_token"]
                        session_data["expires_at"] = (
                            datetime.now(timezone.utc)
                            + timedelta(seconds=new_tokens.get("expires_in", 3600))
                        ).isoformat()
                        await self.session_store.set(
                            session_id, session_data, expire_seconds=SESSION_EXPIRE_SECONDS
                        )
                        return new_tokens["access_token"]
                return None

        return session_data.get("access_token")
