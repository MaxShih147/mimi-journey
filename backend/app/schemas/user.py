"""User Pydantic schemas."""

from pydantic import BaseModel, EmailStr


class UserBase(BaseModel):
    """Base user schema with common fields."""

    email: EmailStr
    name: str
    picture_url: str | None = None


class UserCreate(UserBase):
    """Schema for creating a user (internal use)."""

    google_id: str
    refresh_token: str | None = None


class UserUpdate(BaseModel):
    """Schema for updating user profile."""

    name: str | None = None
    picture_url: str | None = None
    preferences: dict | None = None


class UserResponse(UserBase):
    """User response schema for API."""

    id: str

    class Config:
        from_attributes = True


class UserInDB(UserBase):
    """User schema with all database fields."""

    id: str
    google_id: str
    refresh_token: str | None = None

    class Config:
        from_attributes = True
