from __future__ import annotations

import uuid
from datetime import date, datetime

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, Index, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.enums import JobPostStatus
from app.models.base import BaseModel


class JobPost(BaseModel):
    __tablename__ = "job_posts"
    __table_args__ = (
        Index("ix_job_posts_status_published", "status", "published_at"),
        Index("ix_job_posts_location_code", "location_code"),
        Index("ix_job_posts_job_category", "job_category"),
        Index("ix_job_posts_company_id", "company_id"),
    )

    company_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("companies.id", ondelete="CASCADE"), nullable=False
    )
    status: Mapped[str] = mapped_column(
        String(20), default=JobPostStatus.DRAFT.value, nullable=False
    )
    title: Mapped[str] = mapped_column(String(300), nullable=False)
    body: Mapped[str | None] = mapped_column(Text)

    # Medical-specific fields
    job_category: Mapped[str | None] = mapped_column(String(50))
    department: Mapped[str | None] = mapped_column(String(100))
    specialty: Mapped[str | None] = mapped_column(String(100))
    employment_type: Mapped[str | None] = mapped_column(String(20))
    shift_type: Mapped[str | None] = mapped_column(String(20))

    # Salary
    salary_type: Mapped[str | None] = mapped_column(String(20))
    salary_min: Mapped[int | None] = mapped_column(Integer)
    salary_max: Mapped[int | None] = mapped_column(Integer)

    # Location
    location_code: Mapped[str | None] = mapped_column(String(10))
    location_detail: Mapped[str | None] = mapped_column(String(500))

    # Contact
    contact_name: Mapped[str | None] = mapped_column(String(50))
    contact_visible: Mapped[bool] = mapped_column(Boolean, default=False)

    # Dates
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    close_at: Mapped[date | None] = mapped_column(Date)

    # Denormalized counter
    view_count: Mapped[int] = mapped_column(Integer, default=0)

    company: Mapped["Company"] = relationship(back_populates="job_posts")
    history: Mapped[list[JobPostHistory]] = relationship(back_populates="job_post")
    applications: Mapped[list] = relationship("Application", back_populates="job_post")


class JobPostHistory(BaseModel):
    __tablename__ = "job_post_history"
    __table_args__ = (
        Index("ix_job_post_history_job_created", "job_post_id", "created_at"),
    )

    job_post_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("job_posts.id", ondelete="CASCADE"), nullable=False
    )
    changed_by: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id"))
    diff_json: Mapped[dict | None] = mapped_column(JSONB)
    action: Mapped[str] = mapped_column(String(30))

    job_post: Mapped[JobPost] = relationship(back_populates="history")
