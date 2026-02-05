"""Calendar routes."""

from datetime import date
from typing import Annotated, Any

from fastapi import APIRouter, Cookie, Depends, Query
from pydantic import BaseModel

from app.core.deps import CurrentUserId, DbSession, SessionStore
from app.core.exceptions import AuthenticationError
from app.services.auth_service import AuthService
from app.services.calendar_service import CalendarService
from app.services.maps_service import MapsService

router = APIRouter(prefix="/calendar", tags=["calendar"])


class Location(BaseModel):
    """Geographic location."""

    lat: float
    lng: float


class CalendarEvent(BaseModel):
    """Calendar event response."""

    id: str
    title: str
    start_time: str
    end_time: str
    location: str | None = None
    location_geocoded: Location | None = None
    all_day: bool


class CalendarEventsResponse(BaseModel):
    """Calendar events list response."""

    events: list[CalendarEvent]


async def get_access_token(
    session_id: Annotated[str | None, Cookie()] = None,
    db: DbSession = None,
    session_store: SessionStore = None,
) -> str:
    """Get access token from session, refreshing if needed."""
    if not session_id:
        raise AuthenticationError("No session cookie found")

    auth_service = AuthService(db, session_store)
    access_token = await auth_service.get_session_access_token(session_id)

    if not access_token:
        raise AuthenticationError("Invalid or expired session")

    return access_token


AccessToken = Annotated[str, Depends(get_access_token)]


@router.get("/events", response_model=CalendarEventsResponse)
async def get_calendar_events(
    user_id: CurrentUserId,
    access_token: AccessToken,
    db: DbSession,
    date_param: date = Query(..., alias="date"),
) -> CalendarEventsResponse:
    """Get calendar events for a specific date with geocoded locations."""
    calendar_service = CalendarService(access_token)
    events = await calendar_service.get_events_for_date(date_param)

    # Geocode locations for events that have them
    maps_service = MapsService(db)
    geocoded_events = []

    for event in events:
        location = event.get("location")
        if location:
            try:
                geocode_result = await maps_service.geocode(location)
                event["location_geocoded"] = geocode_result["location"]
            except Exception:
                event["location_geocoded"] = None

        geocoded_events.append(CalendarEvent(**event))

    return CalendarEventsResponse(events=geocoded_events)
