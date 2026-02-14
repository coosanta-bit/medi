from __future__ import annotations

import uuid

from sqlalchemy import ForeignKey, Index, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.enums import ApplicationStatus
from app.models.base import BaseModel


class Application(BaseModel):
    __tablename__ = "applications"
    __table_args__ = (
        UniqueConstraint("job_post_id", "applicant_user_id", name="uq_applications_job_user"),
        Index("ix_applications_status", "status"),
    )

    job_post_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("job_posts.id", ondelete="CASCADE"), nullable=False
    )
    applicant_user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    resume_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("resumes.id"))
    status: Mapped[str] = mapped_column(
        String(20), default=ApplicationStatus.RECEIVED.value, nullable=False
    )

    job_post: Mapped["JobPost"] = relationship(back_populates="applications")
    status_history: Mapped[list[ApplicationStatusHistory]] = relationship(
        back_populates="application"
    )
    notes: Mapped[list[ApplicationNote]] = relationship(back_populates="application")


class ApplicationStatusHistory(BaseModel):
    __tablename__ = "application_status_history"
    __table_args__ = (
        Index("ix_app_status_history_app_created", "application_id", "created_at"),
    )

    application_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("applications.id", ondelete="CASCADE"), nullable=False
    )
    from_status: Mapped[str | None] = mapped_column(String(30))
    to_status: Mapped[str] = mapped_column(String(30), nullable=False)
    changed_by: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id"))
    note: Mapped[str | None] = mapped_column(Text)

    application: Mapped[Application] = relationship(back_populates="status_history")


class ApplicationNote(BaseModel):
    __tablename__ = "application_notes"
    __table_args__ = (
        Index("ix_application_notes_app_id", "application_id"),
    )

    application_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("applications.id", ondelete="CASCADE"), nullable=False
    )
    company_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("companies.id", ondelete="CASCADE"), nullable=False
    )
    author_user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id"), nullable=False
    )
    note: Mapped[str] = mapped_column(Text, nullable=False)

    application: Mapped[Application] = relationship(back_populates="notes")
