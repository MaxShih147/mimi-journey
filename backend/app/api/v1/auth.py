"""Authentication routes."""

from typing import Annotated

from fastapi import APIRouter, Cookie, Depends, Response, status
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.deps import CurrentUserId, DbSession, SessionStore
from app.core.exceptions import AuthenticationError, NotFoundError
from app.core.redis import RedisSessionStore
from app.schemas.user import UserResponse
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["auth"])


def get_auth_service(
    db: DbSession,
    session_store: SessionStore,
) -> AuthService:
    """Get auth service instance."""
    return AuthService(db, session_store)


AuthServiceDep = Annotated[AuthService, Depends(get_auth_service)]


@router.get("/google/login")
async def google_login(auth_service: AuthServiceDep) -> RedirectResponse:
    """Initiate Google OAuth login flow."""
    auth_url, state, _ = await auth_service.initiate_oauth()
    return RedirectResponse(url=auth_url, status_code=status.HTTP_302_FOUND)


@router.get("/google/callback")
async def google_callback(
    code: str,
    state: str,
    auth_service: AuthServiceDep,
) -> RedirectResponse:
    """Handle Google OAuth callback."""
    user, session_id = await auth_service.handle_callback(code, state)

    # Redirect to frontend with session cookie
    response = RedirectResponse(
        url=settings.FRONTEND_URL,
        status_code=status.HTTP_302_FOUND,
    )
    response.set_cookie(
        key="session_id",
        value=session_id,
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite="lax",
        max_age=7 * 24 * 60 * 60,  # 7 days
    )
    return response


@router.get("/me", response_model=UserResponse)
async def get_current_user(
    user_id: CurrentUserId,
    auth_service: AuthServiceDep,
) -> UserResponse:
    """Get current authenticated user."""
    user = await auth_service.get_user_by_id(user_id)
    if not user:
        raise NotFoundError("User", user_id)

    return UserResponse(
        id=str(user.id),
        email=user.email,
        name=user.name,
        picture_url=user.picture_url,
    )


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(
    session_id: Annotated[str | None, Cookie()] = None,
    session_store: SessionStore = None,
) -> Response:
    """Log out current user."""
    if session_id:
        await session_store.delete(session_id)

    response = Response(status_code=status.HTTP_204_NO_CONTENT)
    response.delete_cookie("session_id")
    return response
