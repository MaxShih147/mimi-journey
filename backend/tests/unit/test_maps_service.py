"""Tests for Google Maps API service."""

from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.core.exceptions import ExternalServiceError, NotFoundError
from app.services.maps_service import MapsService


@pytest.fixture
def mock_db():
    return AsyncMock()


@pytest.fixture
def service(mock_db):
    with patch("app.services.maps_service.settings") as mock_settings:
        mock_settings.GOOGLE_MAPS_API_KEY = "test-api-key"
        svc = MapsService(mock_db)
    return svc


def _mock_http_client(response_data, status_code=200):
    """Helper to create a mock httpx client."""
    mock_response = MagicMock()
    mock_response.status_code = status_code
    mock_response.json.return_value = response_data

    mock_client = AsyncMock()
    mock_client.get.return_value = mock_response
    mock_client.__aenter__ = AsyncMock(return_value=mock_client)
    mock_client.__aexit__ = AsyncMock(return_value=False)
    return mock_client


class TestGeocode:
    @pytest.mark.asyncio
    async def test_success(self, service):
        response_data = {
            "status": "OK",
            "results": [{
                "geometry": {"location": {"lat": 25.0339, "lng": 121.5645}},
                "formatted_address": "Taipei 101, Taiwan",
                "place_id": "ChIJxyz",
            }],
        }
        mock_client = _mock_http_client(response_data)

        with patch("app.services.maps_service.httpx.AsyncClient", return_value=mock_client):
            result = await service.geocode("Taipei 101")

        assert result["location"]["lat"] == 25.0339
        assert result["location"]["lng"] == 121.5645
        assert result["place_id"] == "ChIJxyz"
        assert result["formatted_address"] == "Taipei 101, Taiwan"

    @pytest.mark.asyncio
    async def test_zero_results_raises_not_found(self, service):
        mock_client = _mock_http_client({"status": "ZERO_RESULTS", "results": []})

        with patch("app.services.maps_service.httpx.AsyncClient", return_value=mock_client):
            with pytest.raises(NotFoundError):
                await service.geocode("nonexistent place xyz")

    @pytest.mark.asyncio
    async def test_api_error_raises_external_service_error(self, service):
        mock_client = _mock_http_client({"status": "REQUEST_DENIED"})

        with patch("app.services.maps_service.httpx.AsyncClient", return_value=mock_client):
            with pytest.raises(ExternalServiceError):
                await service.geocode("Taipei")

    @pytest.mark.asyncio
    async def test_http_error_raises_external_service_error(self, service):
        mock_client = _mock_http_client({}, status_code=500)

        with patch("app.services.maps_service.httpx.AsyncClient", return_value=mock_client):
            with pytest.raises(ExternalServiceError):
                await service.geocode("Taipei")


class TestReverseGeocode:
    @pytest.mark.asyncio
    async def test_success(self, service):
        response_data = {
            "status": "OK",
            "results": [{
                "place_id": "ChIJabc",
                "formatted_address": "No. 7, Section 5, Xinyi Rd",
                "address_components": [{"long_name": "Xinyi District"}],
                "types": ["political", "sublocality"],
            }],
        }
        mock_client = _mock_http_client(response_data)

        with patch("app.services.maps_service.httpx.AsyncClient", return_value=mock_client):
            result = await service.reverse_geocode(25.0339, 121.5645)

        assert result["place_id"] == "ChIJabc"
        assert result["location"]["lat"] == 25.0339
        assert "types" in result

    @pytest.mark.asyncio
    async def test_zero_results_raises_not_found(self, service):
        mock_client = _mock_http_client({"status": "ZERO_RESULTS", "results": []})

        with patch("app.services.maps_service.httpx.AsyncClient", return_value=mock_client):
            with pytest.raises(NotFoundError):
                await service.reverse_geocode(0.0, 0.0)


class TestSearchPlaces:
    @pytest.mark.asyncio
    async def test_success(self, service):
        response_data = {
            "status": "OK",
            "results": [
                {
                    "place_id": "p1",
                    "name": "Place A",
                    "formatted_address": "Addr A",
                    "geometry": {"location": {"lat": 25.0, "lng": 121.5}},
                    "types": ["restaurant"],
                },
                {
                    "place_id": "p2",
                    "name": "Place B",
                    "formatted_address": "Addr B",
                    "geometry": {"location": {"lat": 25.1, "lng": 121.6}},
                    "types": ["cafe"],
                },
            ],
        }
        mock_client = _mock_http_client(response_data)

        with patch("app.services.maps_service.httpx.AsyncClient", return_value=mock_client):
            result = await service.search_places("restaurant Taipei")

        assert len(result) == 2
        assert result[0]["name"] == "Place A"
        assert result[1]["place_id"] == "p2"

    @pytest.mark.asyncio
    async def test_zero_results_returns_empty(self, service):
        mock_client = _mock_http_client({"status": "ZERO_RESULTS", "results": []})

        with patch("app.services.maps_service.httpx.AsyncClient", return_value=mock_client):
            result = await service.search_places("asdfghjkl")

        assert result == []

    @pytest.mark.asyncio
    async def test_limits_to_10_results(self, service):
        results = [
            {
                "place_id": f"p{i}",
                "name": f"Place {i}",
                "formatted_address": f"Addr {i}",
                "geometry": {"location": {"lat": 25.0 + i * 0.01, "lng": 121.5}},
                "types": [],
            }
            for i in range(15)
        ]
        mock_client = _mock_http_client({"status": "OK", "results": results})

        with patch("app.services.maps_service.httpx.AsyncClient", return_value=mock_client):
            result = await service.search_places("places")

        assert len(result) == 10

    @pytest.mark.asyncio
    async def test_with_location_param(self, service):
        mock_client = _mock_http_client({"status": "OK", "results": []})

        with patch("app.services.maps_service.httpx.AsyncClient", return_value=mock_client):
            await service.search_places("coffee", location="25.0,121.5")

        call_args = mock_client.get.call_args
        params = call_args.kwargs.get("params", call_args[1].get("params", {}))
        assert params["location"] == "25.0,121.5"
        assert params["radius"] == "50000"
