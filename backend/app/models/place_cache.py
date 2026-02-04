"""PlaceCache model for geocoding cache."""

from datetime import datetime, timedelta, timezone

from geoalchemy2 import Geometry
from sqlalchemy import String, Text
from sqlalchemy.dialects.postgresql import ARRAY, JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin, UUIDMixin


def default_expires_at() -> datetime:
    """Default expiry time: 30 days from now."""
    return datetime.now(timezone.utc) + timedelta(days=30)


class PlaceCache(Base, UUIDMixin):
    """Cached geocoding results from Google Maps API."""

    __tablename__ = "place_cache"

    place_id: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    address: Mapped[str] = mapped_column(String(512), nullable=False)
    geom: Mapped[str] = mapped_column(
        Geometry(geometry_type="POINT", srid=4326),
        nullable=False,
    )
    types: Mapped[list[str] | None] = mapped_column(ARRAY(String), nullable=True)
    raw_response: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )
    expires_at: Mapped[datetime] = mapped_column(
        nullable=False,
        default=default_expires_at,
        index=True,
    )
