from __future__ import annotations

import uuid
from datetime import date

from sqlalchemy import Boolean, Date, ForeignKey, Index, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.enums import ResumeVisibility
from app.models.base import BaseModel


class Resume(BaseModel):
    __tablename__ = "resumes"
    __table_args__ = (
        Index("ix_resumes_user_id", "user_id"),
        Index("ix_resumes_visibility_job", "visibility", "desired_job"),
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    visibility: Mapped[str] = mapped_column(
        String(20), default=ResumeVisibility.PRIVATE.value, nullable=False
    )
    desired_job: Mapped[str | None] = mapped_column(String(50))
    desired_region: Mapped[str | None] = mapped_column(String(10))
    desired_shift: Mapped[str | None] = mapped_column(String(20))
    desired_salary_type: Mapped[str | None] = mapped_column(String(20))
    desired_salary_min: Mapped[int | None] = mapped_column(Integer)
    summary: Mapped[str | None] = mapped_column(Text)
    is_experienced: Mapped[bool] = mapped_column(Boolean, default=False)

    user: Mapped["User"] = relationship(back_populates="resumes")
    licenses: Mapped[list[ResumeLicense]] = relationship(
        back_populates="resume", cascade="all, delete-orphan"
    )
    careers: Mapped[list[ResumeCareer]] = relationship(
        back_populates="resume", cascade="all, delete-orphan"
    )


class ResumeLicense(BaseModel):
    __tablename__ = "resume_licenses"
    __table_args__ = (
        Index("ix_resume_licenses_resume_id", "resume_id"),
        Index("ix_resume_licenses_license_type", "license_type"),
    )

    resume_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("resumes.id", ondelete="CASCADE"), nullable=False
    )
    license_type: Mapped[str] = mapped_column(String(100), nullable=False)
    license_no_enc: Mapped[str | None] = mapped_column(String(500))
    issued_at: Mapped[date | None] = mapped_column(Date)

    resume: Mapped[Resume] = relationship(back_populates="licenses")


class ResumeCareer(BaseModel):
    __tablename__ = "resume_careers"
    __table_args__ = (
        Index("ix_resume_careers_resume_id", "resume_id"),
    )

    resume_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("resumes.id", ondelete="CASCADE"), nullable=False
    )
    org_name: Mapped[str] = mapped_column(String(200), nullable=False)
    role: Mapped[str | None] = mapped_column(String(100))
    department: Mapped[str | None] = mapped_column(String(100))
    start_at: Mapped[date] = mapped_column(Date, nullable=False)
    end_at: Mapped[date | None] = mapped_column(Date)
    description: Mapped[str | None] = mapped_column(Text)

    resume: Mapped[Resume] = relationship(back_populates="careers")
