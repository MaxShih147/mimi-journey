"""Place and geocoding Pydantic schemas."""

from pydantic import BaseModel


class Location(BaseModel):
    """Geographic coordinates."""

    lat: float
    lng: float


class Place(BaseModel):
    """Place information."""

    place_id: str
    name: str
    address: str
    location: Location
    types: list[str] | None = None


class PlacesSearchResponse(BaseModel):
    """Response for place search."""

    places: list[Place]


class GeocodeResult(BaseModel):
    """Geocoding result."""

    location: Location
    formatted_address: str
    place_id: str
