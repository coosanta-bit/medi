import re

from pydantic import BaseModel, EmailStr, field_validator

from app.core.enums import UserType


class SignupRequest(BaseModel):
    type: UserType
    email: EmailStr
    password: str
    phone: str | None = None
    name: str | None = None
    business_no: str | None = None
    company_name: str | None = None
    agree_terms: bool
    agree_marketing: bool = False

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("비밀번호는 8자 이상이어야 합니다")
        categories = sum([
            bool(re.search(r"[a-zA-Z]", v)),
            bool(re.search(r"\d", v)),
            bool(re.search(r"[!@#$%^&*(),.?\":{}|<>]", v)),
        ])
        if categories < 2:
            raise ValueError("비밀번호는 영문, 숫자, 특수문자 중 2종 이상 포함해야 합니다")
        return v

    @field_validator("agree_terms")
    @classmethod
    def must_agree(cls, v: bool) -> bool:
        if not v:
            raise ValueError("이용약관에 동의해야 합니다")
        return v


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RefreshRequest(BaseModel):
    refresh_token: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    id: str
    type: str
    email: str
    role: str


class AuthResponse(BaseModel):
    user: UserResponse
    tokens: TokenResponse
