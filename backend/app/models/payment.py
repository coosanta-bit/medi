from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Index, Integer, String
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.enums import OrderStatus, PaymentStatus
from app.models.base import BaseModel


class Product(BaseModel):
    __tablename__ = "products"
    __table_args__ = (
        Index("ix_products_type_active", "type", "active"),
    )

    type: Mapped[str] = mapped_column(String(30), nullable=False)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    price: Mapped[int] = mapped_column(Integer, nullable=False)
    currency: Mapped[str] = mapped_column(String(3), default="KRW")
    config_json: Mapped[dict | None] = mapped_column(JSONB)
    active: Mapped[bool] = mapped_column(Boolean, default=True)


class Order(BaseModel):
    __tablename__ = "orders"
    __table_args__ = (
        Index("ix_orders_company_created", "company_id", "created_at"),
    )

    company_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("companies.id", ondelete="CASCADE"), nullable=False
    )
    product_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("products.id"), nullable=False
    )
    amount: Mapped[int] = mapped_column(Integer, nullable=False)
    status: Mapped[str] = mapped_column(
        String(20), default=OrderStatus.CREATED.value, nullable=False
    )

    payments: Mapped[list[Payment]] = relationship(back_populates="order")


class Payment(BaseModel):
    __tablename__ = "payments"
    __table_args__ = (
        Index("ix_payments_pg_tid", "pg_tid"),
        Index("ix_payments_status", "status"),
    )

    order_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("orders.id", ondelete="CASCADE"), nullable=False
    )
    pg: Mapped[str | None] = mapped_column(String(30))
    pg_tid: Mapped[str | None] = mapped_column(String(100))
    status: Mapped[str] = mapped_column(
        String(20), default=PaymentStatus.PENDING.value, nullable=False
    )
    paid_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    order: Mapped[Order] = relationship(back_populates="payments")


class Entitlement(BaseModel):
    __tablename__ = "entitlements"
    __table_args__ = (
        Index("ix_entitlements_company_type", "company_id", "type"),
    )

    company_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("companies.id", ondelete="CASCADE"), nullable=False
    )
    type: Mapped[str] = mapped_column(String(30), nullable=False)
    balance: Mapped[int] = mapped_column(Integer, default=0)
    start_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    end_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    order_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("orders.id"))


class Invoice(BaseModel):
    __tablename__ = "invoices"
    __table_args__ = (
        Index("ix_invoices_company_status", "company_id", "status"),
    )

    company_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("companies.id", ondelete="CASCADE"), nullable=False
    )
    order_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("orders.id"), nullable=False
    )
    status: Mapped[str] = mapped_column(String(20), default="REQUESTED")
    requested_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    issued_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
