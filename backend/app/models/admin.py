from __future__ import annotations

import uuid

from sqlalchemy import ForeignKey, Index, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import BaseModel


class Report(BaseModel):
    __tablename__ = "reports"
    __table_args__ = (
        Index("ix_reports_status_created", "status", "created_at"),
    )

    target_type: Mapped[str] = mapped_column(String(30), nullable=False)
    target_id: Mapped[uuid.UUID] = mapped_column(nullable=False)
    reporter_user_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id"))
    reason_code: Mapped[str] = mapped_column(String(50), nullable=False)
    detail: Mapped[str | None] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(20), default="PENDING")


class AdminLog(BaseModel):
    __tablename__ = "admin_logs"
    __table_args__ = (
        Index("ix_admin_logs_admin_created", "admin_user_id", "created_at"),
    )

    admin_user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id"), nullable=False
    )
    action: Mapped[str] = mapped_column(String(50), nullable=False)
    target_type: Mapped[str | None] = mapped_column(String(30))
    target_id: Mapped[uuid.UUID | None] = mapped_column()
    meta_json: Mapped[dict | None] = mapped_column(JSONB)
