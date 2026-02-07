"""Tests for Google Calendar integration service."""

from datetime import date
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.core.exceptions import ExternalServiceError
from app.services.calendar_service import CalendarService


@pytest.fixture
def service():
    return CalendarService(access_token="test-token")


class TestTransformEvent:
    def test_timed_event(self, service):
        raw = {
            "id": "event-1",
            "summary": "Meeting",
            "location": "Taipei 101",
            "start": {"dateTime": "2026-02-08T10:00:00+08:00"},
            "end": {"dateTime": "2026-02-08T11:00:00+08:00"},
        }
        result = service._transform_event(raw)
        assert result["id"] == "event-1"
        assert result["title"] == "Meeting"
        assert result["location"] == "Taipei 101"
        assert result["all_day"] is False
        assert result["location_geocoded"] is None

    def test_all_day_event(self, service):
        raw = {
            "id": "event-2",
            "summary": "Holiday",
            "start": {"date": "2026-02-08"},
            "end": {"date": "2026-02-09"},
        }
        result = service._transform_event(raw)
        assert result["all_day"] is True
        assert result["start_time"] == "2026-02-08"

    def test_cancelled_event_returns_none(self, service):
        raw = {"id": "event-3", "status": "cancelled"}
        assert service._transform_event(raw) is None

    def test_no_summary_defaults_to_untitled(self, service):
        raw = {
            "id": "event-4",
            "start": {"dateTime": "2026-02-08T10:00:00Z"},
            "end": {"dateTime": "2026-02-08T11:00:00Z"},
        }
        result = service._transform_event(raw)
        assert result["title"] == "Untitled Event"

    def test_no_location(self, service):
        raw = {
            "id": "event-5",
            "summary": "Call",
            "start": {"dateTime": "2026-02-08T10:00:00Z"},
            "end": {"dateTime": "2026-02-08T11:00:00Z"},
        }
        result = service._transform_event(raw)
        assert result["location"] is None


class TestTransformEvents:
    def test_filters_cancelled(self, service):
        raw = [
            {"id": "1", "summary": "A", "start": {"dateTime": "2026-02-08T10:00:00Z"}, "end": {"dateTime": "2026-02-08T11:00:00Z"}},
            {"id": "2", "status": "cancelled"},
            {"id": "3", "summary": "B", "start": {"dateTime": "2026-02-08T12:00:00Z"}, "end": {"dateTime": "2026-02-08T13:00:00Z"}},
        ]
        result = service._transform_events(raw)
        assert len(result) == 2
        assert result[0]["id"] == "1"
        assert result[1]["id"] == "3"

    def test_empty_list(self, service):
        assert service._transform_events([]) == []


class TestGetEventsForDate:
    @pytest.mark.asyncio
    async def test_success(self, service):
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "items": [
                {
                    "id": "ev1",
                    "summary": "Test",
                    "start": {"dateTime": "2026-02-08T09:00:00Z"},
                    "end": {"dateTime": "2026-02-08T10:00:00Z"},
                    "location": "Office",
                }
            ]
        }

        mock_client = AsyncMock()
        mock_client.get.return_value = mock_response
        mock_client.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client.__aexit__ = AsyncMock(return_value=False)

        with patch("app.services.calendar_service.httpx.AsyncClient", return_value=mock_client):
            events = await service.get_events_for_date(date(2026, 2, 8))

        assert len(events) == 1
        assert events[0]["title"] == "Test"

    @pytest.mark.asyncio
    async def test_401_raises_external_service_error(self, service):
        mock_response = AsyncMock()
        mock_response.status_code = 401

        mock_client = AsyncMock()
        mock_client.get.return_value = mock_response
        mock_client.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client.__aexit__ = AsyncMock(return_value=False)

        with patch("app.services.calendar_service.httpx.AsyncClient", return_value=mock_client):
            with pytest.raises(ExternalServiceError):
                await service.get_events_for_date(date(2026, 2, 8))

    @pytest.mark.asyncio
    async def test_500_raises_external_service_error(self, service):
        mock_response = AsyncMock()
        mock_response.status_code = 500

        mock_client = AsyncMock()
        mock_client.get.return_value = mock_response
        mock_client.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client.__aexit__ = AsyncMock(return_value=False)

        with patch("app.services.calendar_service.httpx.AsyncClient", return_value=mock_client):
            with pytest.raises(ExternalServiceError):
                await service.get_events_for_date(date(2026, 2, 8))
