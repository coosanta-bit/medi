from __future__ import annotations

import uuid

from sqlalchemy import ForeignKey, Index, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.enums import UserStatus, VerificationStatus
from app.models.base import BaseModel


class Company(BaseModel):
    __tablename__ = "companies"
    __table_args__ = (
        Index("ix_companies_business_no", "business_no", unique=True),
        Index("ix_companies_status", "status"),
    )

    business_no: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    type: Mapped[str | None] = mapped_column(String(50))
    address: Mapped[str | None] = mapped_column(String(500))
    status: Mapped[str] = mapped_column(String(20), default=UserStatus.ACTIVE.value)

    users: Mapped[list[CompanyUser]] = relationship(back_populates="company")
    verifications: Mapped[list[CompanyVerification]] = relationship(back_populates="company")
    job_posts: Mapped[list] = relationship("JobPost", back_populates="company")


class CompanyUser(BaseModel):
    __tablename__ = "company_users"
    __table_args__ = (
        Index("ix_company_users_company_id", "company_id"),
        Index("ix_company_users_user_id", "user_id"),
    )

    company_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("companies.id", ondelete="CASCADE"), nullable=False
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    role: Mapped[str] = mapped_column(String(30), default="OWNER")

    company: Mapped[Company] = relationship(back_populates="users")
    user: Mapped["User"] = relationship()


class CompanyVerification(BaseModel):
    __tablename__ = "company_verifications"
    __table_args__ = (
        Index("ix_company_verifications_company_id", "company_id"),
        Index("ix_company_verifications_status", "status"),
    )

    company_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("companies.id", ondelete="CASCADE"), nullable=False
    )
    status: Mapped[str] = mapped_column(
        String(20), default=VerificationStatus.PENDING.value, nullable=False
    )
    reject_reason: Mapped[str | None] = mapped_column(Text)
    file_key: Mapped[str | None] = mapped_column(String(500))
    reviewed_by: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id"))

    company: Mapped[Company] = relationship(back_populates="verifications")
