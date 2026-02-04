"""Places routes for geocoding and search."""

from typing import Annotated

from fastapi import APIRouter, Depends, Query

from app.core.deps import CurrentUserId, DbSession
from app.schemas.place import GeocodeResult, Place, PlacesSearchResponse
from app.services.maps_service import MapsService

router = APIRouter(prefix="/places", tags=["places"])


def get_maps_service(db: DbSession) -> MapsService:
    """Get maps service instance."""
    return MapsService(db)


MapsServiceDep = Annotated[MapsService, Depends(get_maps_service)]


@router.get("/search", response_model=PlacesSearchResponse)
async def search_places(
    user_id: CurrentUserId,
    maps_service: MapsServiceDep,
    q: str = Query(..., min_length=1, description="Search query"),
    location: str | None = Query(None, description="Center point as 'lat,lng'"),
) -> PlacesSearchResponse:
    """Search for places by text query."""
    places = await maps_service.search_places(q, location)
    return PlacesSearchResponse(
        places=[Place(**p) for p in places]
    )


@router.get("/geocode", response_model=GeocodeResult)
async def geocode_address(
    user_id: CurrentUserId,
    maps_service: MapsServiceDep,
    address: str = Query(..., min_length=1, description="Address to geocode"),
) -> GeocodeResult:
    """Convert address to coordinates."""
    result = await maps_service.geocode(address)
    return GeocodeResult(**result)


@router.get("/reverse-geocode", response_model=Place)
async def reverse_geocode(
    user_id: CurrentUserId,
    maps_service: MapsServiceDep,
    lat: float = Query(..., description="Latitude"),
    lng: float = Query(..., description="Longitude"),
) -> Place:
    """Convert coordinates to address."""
    result = await maps_service.reverse_geocode(lat, lng)
    return Place(**result)
