from datetime import datetime
from typing import Literal

from pydantic import BaseModel, EmailStr, field_validator


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str | None = None
    phone: str | None = None

    @field_validator("password")
    @classmethod
    def password_min_length(cls, v: str) -> str:
        if len(v) < 6:
            raise ValueError("Password must be at least 6 characters")
        return v


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def password_min_length(cls, v: str) -> str:
        if len(v) < 6:
            raise ValueError("Password must be at least 6 characters")
        return v


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str | None
    phone: str | None
    role: str
    is_active: bool
    avatar: str | None
    bio: str | None

    model_config = {"from_attributes": True}


class AdminUserResponse(UserResponse):
    avatar: str | None
    created_at: datetime


class AdminUserUpdate(BaseModel):
    role: Literal["user", "admin"] | None = None
    is_active: bool | None = None


class AdminUserListResponse(BaseModel):
    items: list[AdminUserResponse]
    total: int
    page: int
    limit: int
    pages: int
