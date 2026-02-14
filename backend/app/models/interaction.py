from __future__ import annotations

import uuid

from sqlalchemy import ForeignKey, Index, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.core.enums import ScoutStatus
from app.models.base import BaseModel


class Favorite(BaseModel):
    __tablename__ = "favorites"
    __table_args__ = (
        UniqueConstraint("user_id", "job_post_id", name="uq_favorites_user_job"),
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    job_post_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("job_posts.id", ondelete="CASCADE"), nullable=False
    )


class Follow(BaseModel):
    __tablename__ = "follows"
    __table_args__ = (
        UniqueConstraint("user_id", "company_id", name="uq_follows_user_company"),
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    company_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("companies.id", ondelete="CASCADE"), nullable=False
    )


class Scout(BaseModel):
    __tablename__ = "scouts"
    __table_args__ = (
        Index("ix_scouts_company_status", "company_id", "status"),
        Index("ix_scouts_user_status", "user_id", "status"),
    )

    company_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("companies.id", ondelete="CASCADE"), nullable=False
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    job_post_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("job_posts.id"))
    status: Mapped[str] = mapped_column(
        String(20), default=ScoutStatus.SENT.value, nullable=False
    )
    message: Mapped[str | None] = mapped_column(Text)
