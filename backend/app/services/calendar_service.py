"""Google Calendar integration service."""

from datetime import date, datetime, timedelta, timezone
from typing import Any

import httpx

from app.core.exceptions import ExternalServiceError

# Google Calendar API endpoint
GOOGLE_CALENDAR_API = "https://www.googleapis.com/calendar/v3"


class CalendarService:
    """Service for interacting with Google Calendar API."""

    def __init__(self, access_token: str) -> None:
        self.access_token = access_token

    async def get_events_for_date(self, target_date: date) -> list[dict[str, Any]]:
        """
        Get calendar events for a specific date.

        Args:
            target_date: The date to fetch events for

        Returns:
            List of calendar events
        """
        # Convert date to datetime range in UTC
        start_of_day = datetime.combine(target_date, datetime.min.time())
        end_of_day = start_of_day + timedelta(days=1)

        # Format as RFC3339
        time_min = start_of_day.isoformat() + "Z"
        time_max = end_of_day.isoformat() + "Z"

        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{GOOGLE_CALENDAR_API}/calendars/primary/events",
                headers={"Authorization": f"Bearer {self.access_token}"},
                params={
                    "timeMin": time_min,
                    "timeMax": time_max,
                    "singleEvents": "true",
                    "orderBy": "startTime",
                    "maxResults": 50,
                },
            )

            if response.status_code == 401:
                raise ExternalServiceError("Google Calendar", "Access token expired")

            if response.status_code != 200:
                raise ExternalServiceError(
                    "Google Calendar", f"Failed to fetch events: {response.status_code}"
                )

            data = response.json()
            return self._transform_events(data.get("items", []))

    def _transform_events(self, raw_events: list[dict[str, Any]]) -> list[dict[str, Any]]:
        """Transform Google Calendar events to our format."""
        events = []
        for item in raw_events:
            event = self._transform_event(item)
            if event:
                events.append(event)
        return events

    def _transform_event(self, item: dict[str, Any]) -> dict[str, Any] | None:
        """Transform a single Google Calendar event."""
        # Skip cancelled events
        if item.get("status") == "cancelled":
            return None

        event_id = item.get("id")
        title = item.get("summary", "Untitled Event")
        location = item.get("location")

        # Parse start/end times
        start = item.get("start", {})
        end = item.get("end", {})

        # Check if all-day event
        all_day = "date" in start

        if all_day:
            start_time = start.get("date")
            end_time = end.get("date")
        else:
            start_time = start.get("dateTime")
            end_time = end.get("dateTime")

        return {
            "id": event_id,
            "title": title,
            "start_time": start_time,
            "end_time": end_time,
            "location": location,
            "location_geocoded": None,  # Will be populated by maps service
            "all_day": all_day,
        }
