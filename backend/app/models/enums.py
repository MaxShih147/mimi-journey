"""Database enum types."""

from enum import Enum


class PlanStatus(str, Enum):
    """Day plan status."""

    DRAFT = "draft"
    CONFIRMED = "confirmed"
    COMPLETED = "completed"


class TransportMode(str, Enum):
    """Transportation mode."""

    WALKING = "walking"
    DRIVING = "driving"
    TRANSIT = "transit"
    BICYCLING = "bicycling"


class StopType(str, Enum):
    """Stop type classification."""

    ORIGIN = "origin"
    DESTINATION = "destination"
    WAYPOINT = "waypoint"
    REST_STOP = "rest_stop"


class StopSource(str, Enum):
    """Source of the stop data."""

    CALENDAR = "calendar"
    MANUAL = "manual"
    DETECTED = "detected"


class TraceStatus(str, Enum):
    """GPS trace session status."""

    ACTIVE = "active"
    PAUSED = "paused"
    COMPLETED = "completed"


class StayPointStatus(str, Enum):
    """Stay point detection status."""

    DETECTED = "detected"
    CONFIRMED = "confirmed"
    IGNORED = "ignored"
