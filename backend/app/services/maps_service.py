"""Google Maps API service for geocoding and directions."""

from datetime import datetime, timedelta, timezone
from typing import Any

import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.exceptions import ExternalServiceError, NotFoundError
from app.models.place_cache import PlaceCache

# Google Maps API endpoints
GEOCODE_URL = "https://maps.googleapis.com/maps/api/geocode/json"
PLACES_SEARCH_URL = "https://maps.googleapis.com/maps/api/place/textsearch/json"
PLACE_DETAILS_URL = "https://maps.googleapis.com/maps/api/place/details/json"


class MapsService:
    """Service for Google Maps API interactions."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.api_key = settings.GOOGLE_MAPS_API_KEY

    async def geocode(self, address: str) -> dict[str, Any]:
        """
        Geocode an address to coordinates.

        Args:
            address: The address to geocode

        Returns:
            Dict with location, formatted_address, and place_id
        """
        async with httpx.AsyncClient() as client:
            response = await client.get(
                GEOCODE_URL,
                params={
                    "address": address,
                    "key": self.api_key,
                },
            )

            if response.status_code != 200:
                raise ExternalServiceError("Google Maps", "Geocoding request failed")

            data = response.json()

            if data.get("status") != "OK":
                if data.get("status") == "ZERO_RESULTS":
                    raise NotFoundError("Address", address)
                raise ExternalServiceError("Google Maps", f"Geocoding error: {data.get('status')}")

            result = data["results"][0]
            location = result["geometry"]["location"]

            return {
                "location": {"lat": location["lat"], "lng": location["lng"]},
                "formatted_address": result["formatted_address"],
                "place_id": result["place_id"],
            }

    async def reverse_geocode(self, lat: float, lng: float) -> dict[str, Any]:
        """
        Reverse geocode coordinates to an address.

        Args:
            lat: Latitude
            lng: Longitude

        Returns:
            Place information
        """
        async with httpx.AsyncClient() as client:
            response = await client.get(
                GEOCODE_URL,
                params={
                    "latlng": f"{lat},{lng}",
                    "key": self.api_key,
                },
            )

            if response.status_code != 200:
                raise ExternalServiceError("Google Maps", "Reverse geocoding request failed")

            data = response.json()

            if data.get("status") != "OK":
                if data.get("status") == "ZERO_RESULTS":
                    raise NotFoundError("Location", f"{lat},{lng}")
                raise ExternalServiceError(
                    "Google Maps", f"Reverse geocoding error: {data.get('status')}"
                )

            result = data["results"][0]

            return {
                "place_id": result["place_id"],
                "name": result.get("address_components", [{}])[0].get(
                    "long_name", result["formatted_address"]
                ),
                "address": result["formatted_address"],
                "location": {"lat": lat, "lng": lng},
                "types": result.get("types", []),
            }

    async def search_places(
        self, query: str, location: str | None = None
    ) -> list[dict[str, Any]]:
        """
        Search for places by text query.

        Args:
            query: Search query
            location: Optional center point as "lat,lng"

        Returns:
            List of places
        """
        params: dict[str, str] = {
            "query": query,
            "key": self.api_key,
        }
        if location:
            params["location"] = location
            params["radius"] = "50000"  # 50km radius

        async with httpx.AsyncClient() as client:
            response = await client.get(PLACES_SEARCH_URL, params=params)

            if response.status_code != 200:
                raise ExternalServiceError("Google Maps", "Place search request failed")

            data = response.json()

            if data.get("status") not in ("OK", "ZERO_RESULTS"):
                raise ExternalServiceError(
                    "Google Maps", f"Place search error: {data.get('status')}"
                )

            places = []
            for result in data.get("results", [])[:10]:  # Limit to 10 results
                location_data = result.get("geometry", {}).get("location", {})
                places.append({
                    "place_id": result["place_id"],
                    "name": result["name"],
                    "address": result.get("formatted_address", ""),
                    "location": {
                        "lat": location_data.get("lat"),
                        "lng": location_data.get("lng"),
                    },
                    "types": result.get("types", []),
                })

            return places

    async def get_cached_place(self, place_id: str) -> PlaceCache | None:
        """Get place from cache if not expired."""
        stmt = select(PlaceCache).where(
            PlaceCache.place_id == place_id,
            PlaceCache.expires_at > datetime.now(timezone.utc),
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def cache_place(
        self,
        place_id: str,
        name: str,
        address: str,
        lat: float,
        lng: float,
        types: list[str] | None = None,
        raw_response: dict | None = None,
    ) -> PlaceCache:
        """Cache a place for future lookups."""
        from geoalchemy2.functions import ST_MakePoint

        place = PlaceCache(
            place_id=place_id,
            name=name,
            address=address,
            geom=f"SRID=4326;POINT({lng} {lat})",
            types=types,
            raw_response=raw_response,
            expires_at=datetime.now(timezone.utc) + timedelta(days=30),
        )
        self.db.add(place)
        await self.db.flush()
        return place
