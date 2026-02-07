"""Tests for Pydantic schemas."""

import pytest
from pydantic import ValidationError

from app.schemas.place import GeocodeResult, Location, Place, PlacesSearchResponse
from app.schemas.user import UserCreate, UserResponse, UserUpdate


class TestLocation:
    def test_valid(self):
        loc = Location(lat=25.0339, lng=121.5645)
        assert loc.lat == 25.0339
        assert loc.lng == 121.5645

    def test_missing_field_raises(self):
        with pytest.raises(ValidationError):
            Location(lat=25.0)


class TestPlace:
    def test_valid(self):
        p = Place(
            place_id="abc",
            name="Taipei 101",
            address="No. 7, Section 5",
            location=Location(lat=25.0, lng=121.5),
        )
        assert p.place_id == "abc"
        assert p.types is None

    def test_with_types(self):
        p = Place(
            place_id="abc",
            name="Taipei 101",
            address="addr",
            location=Location(lat=25.0, lng=121.5),
            types=["tourist_attraction"],
        )
        assert p.types == ["tourist_attraction"]


class TestPlacesSearchResponse:
    def test_empty_list(self):
        r = PlacesSearchResponse(places=[])
        assert r.places == []


class TestGeocodeResult:
    def test_valid(self):
        r = GeocodeResult(
            location=Location(lat=25.0, lng=121.5),
            formatted_address="Taipei, Taiwan",
            place_id="xyz",
        )
        assert r.place_id == "xyz"


class TestUserCreate:
    def test_valid(self):
        u = UserCreate(
            email="test@example.com",
            name="Test User",
            google_id="google-123",
        )
        assert u.google_id == "google-123"
        assert u.refresh_token is None

    def test_invalid_email(self):
        with pytest.raises(ValidationError):
            UserCreate(email="not-an-email", name="Test", google_id="g")


class TestUserResponse:
    def test_valid(self):
        u = UserResponse(id="uuid-1", email="a@b.com", name="User")
        assert u.id == "uuid-1"
        assert u.picture_url is None


class TestUserUpdate:
    def test_all_optional(self):
        u = UserUpdate()
        assert u.name is None
        assert u.picture_url is None
        assert u.preferences is None

    def test_partial_update(self):
        u = UserUpdate(name="New Name")
        assert u.name == "New Name"
