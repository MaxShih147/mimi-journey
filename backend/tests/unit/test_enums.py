"""Tests for database enum types."""

from app.models.enums import (
    PlanStatus,
    StayPointStatus,
    StopSource,
    StopType,
    TraceStatus,
    TransportMode,
)


class TestPlanStatus:
    def test_values(self):
        assert PlanStatus.DRAFT == "draft"
        assert PlanStatus.CONFIRMED == "confirmed"
        assert PlanStatus.COMPLETED == "completed"

    def test_is_str(self):
        assert isinstance(PlanStatus.DRAFT, str)


class TestTransportMode:
    def test_values(self):
        assert TransportMode.WALKING == "walking"
        assert TransportMode.DRIVING == "driving"
        assert TransportMode.TRANSIT == "transit"
        assert TransportMode.BICYCLING == "bicycling"

    def test_all_four_modes(self):
        assert len(TransportMode) == 4


class TestStopType:
    def test_values(self):
        assert StopType.ORIGIN == "origin"
        assert StopType.DESTINATION == "destination"
        assert StopType.WAYPOINT == "waypoint"
        assert StopType.REST_STOP == "rest_stop"


class TestStopSource:
    def test_values(self):
        assert StopSource.CALENDAR == "calendar"
        assert StopSource.MANUAL == "manual"
        assert StopSource.DETECTED == "detected"


class TestTraceStatus:
    def test_values(self):
        assert TraceStatus.ACTIVE == "active"
        assert TraceStatus.PAUSED == "paused"
        assert TraceStatus.COMPLETED == "completed"


class TestStayPointStatus:
    def test_values(self):
        assert StayPointStatus.DETECTED == "detected"
        assert StayPointStatus.CONFIRMED == "confirmed"
        assert StayPointStatus.IGNORED == "ignored"
