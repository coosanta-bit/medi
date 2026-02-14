from __future__ import annotations

import uuid

from sqlalchemy import Boolean, ForeignKey, Index, Integer, String
from sqlalchemy.dialects.postgresql import ENUM
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.enums import Role, UserStatus, UserType
from app.models.base import BaseModel

user_type_enum = ENUM(UserType, name="user_type_enum", create_type=False)
user_status_enum = ENUM(UserStatus, name="user_status_enum", create_type=False)
role_enum = ENUM(Role, name="role_enum", create_type=False)


class User(BaseModel):
    __tablename__ = "users"
    __table_args__ = (
        Index("ix_users_email", "email", unique=True),
        Index("ix_users_phone", "phone"),
        Index("ix_users_type_status", "type", "status"),
    )

    type: Mapped[str] = mapped_column(String(20), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    phone: Mapped[str | None] = mapped_column(String(20))
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[str] = mapped_column(String(20), default=UserStatus.ACTIVE.value, nullable=False)
    role: Mapped[str] = mapped_column(String(30), default=Role.PERSON.value, nullable=False)
    agree_terms: Mapped[bool] = mapped_column(Boolean, default=False)
    agree_marketing: Mapped[bool] = mapped_column(Boolean, default=False)

    profile: Mapped[UserProfile | None] = relationship(back_populates="user", uselist=False)
    resumes: Mapped[list] = relationship("Resume", back_populates="user")


class UserProfile(BaseModel):
    __tablename__ = "user_profiles"
    __table_args__ = (
        Index("ix_user_profiles_region_code", "region_code"),
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False
    )
    name: Mapped[str | None] = mapped_column(String(50))
    birth_year: Mapped[int | None] = mapped_column(Integer)
    region_code: Mapped[str | None] = mapped_column(String(10))

    user: Mapped[User] = relationship(back_populates="profile")
