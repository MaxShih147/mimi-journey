"""Tests for custom exceptions and error handlers."""

import pytest
from fastapi import status

from app.core.exceptions import (
    AppException,
    AuthenticationError,
    AuthorizationError,
    ConflictError,
    ExternalServiceError,
    NotFoundError,
    ValidationError,
    app_exception_handler,
    http_exception_handler,
)


class TestAppException:
    def test_defaults(self):
        exc = AppException("Something went wrong")
        assert exc.message == "Something went wrong"
        assert exc.code == "APP_ERROR"
        assert exc.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
        assert exc.details == {}

    def test_custom_values(self):
        exc = AppException("msg", code="CUSTOM", status_code=418, details={"key": "val"})
        assert exc.code == "CUSTOM"
        assert exc.status_code == 418
        assert exc.details == {"key": "val"}

    def test_str_is_message(self):
        exc = AppException("test message")
        assert str(exc) == "test message"


class TestNotFoundError:
    def test_without_identifier(self):
        exc = NotFoundError("User")
        assert exc.message == "User not found"
        assert exc.code == "NOT_FOUND"
        assert exc.status_code == 404

    def test_with_identifier(self):
        exc = NotFoundError("User", "abc-123")
        assert "abc-123" in exc.message
        assert exc.status_code == 404


class TestAuthenticationError:
    def test_default_message(self):
        exc = AuthenticationError()
        assert exc.message == "Authentication required"
        assert exc.status_code == 401
        assert exc.code == "UNAUTHORIZED"

    def test_custom_message(self):
        exc = AuthenticationError("Token expired")
        assert exc.message == "Token expired"


class TestAuthorizationError:
    def test_default_message(self):
        exc = AuthorizationError()
        assert exc.message == "Permission denied"
        assert exc.status_code == 403
        assert exc.code == "FORBIDDEN"


class TestValidationError:
    def test_basic(self):
        exc = ValidationError("Invalid email")
        assert exc.status_code == 422
        assert exc.code == "VALIDATION_ERROR"

    def test_with_details(self):
        exc = ValidationError("Invalid", details={"field": "email"})
        assert exc.details == {"field": "email"}


class TestConflictError:
    def test_basic(self):
        exc = ConflictError("Already exists")
        assert exc.status_code == 409
        assert exc.code == "CONFLICT"


class TestExternalServiceError:
    def test_basic(self):
        exc = ExternalServiceError("Google Maps", "Rate limited")
        assert "Google Maps" in exc.message
        assert "Rate limited" in exc.message
        assert exc.status_code == 502
        assert exc.details == {"service": "Google Maps"}


class TestAppExceptionHandler:
    @pytest.mark.asyncio
    async def test_returns_json_response(self):
        exc = NotFoundError("User", "123")
        response = await app_exception_handler(None, exc)
        assert response.status_code == 404
        import json
        body = json.loads(response.body)
        assert body["code"] == "NOT_FOUND"
        assert "User" in body["message"]


class TestHttpExceptionHandler:
    @pytest.mark.asyncio
    async def test_returns_json_response(self):
        from fastapi import HTTPException
        exc = HTTPException(status_code=400, detail="Bad request")
        response = await http_exception_handler(None, exc)
        assert response.status_code == 400
        import json
        body = json.loads(response.body)
        assert body["code"] == "HTTP_ERROR"
        assert body["message"] == "Bad request"
