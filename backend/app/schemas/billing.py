from datetime import datetime

from pydantic import BaseModel, Field


# --- Product ---


class ProductRead(BaseModel):
    id: str
    type: str
    name: str
    price: int
    currency: str = "KRW"
    config_json: dict | None = None
    active: bool = True


class ProductListResponse(BaseModel):
    items: list[ProductRead]


# --- Order ---


class OrderCreate(BaseModel):
    product_id: str


class OrderRead(BaseModel):
    id: str
    company_id: str
    product_id: str
    product_name: str | None = None
    amount: int
    status: str
    created_at: datetime
    updated_at: datetime


class OrderListResponse(BaseModel):
    items: list[OrderRead]
    total: int


# --- Payment ---


class PaymentRead(BaseModel):
    id: str
    order_id: str
    pg: str | None = None
    pg_tid: str | None = None
    status: str
    paid_at: datetime | None = None
    created_at: datetime


class PaymentListResponse(BaseModel):
    items: list[PaymentRead]
    total: int


# --- Webhook ---


class WebhookPayload(BaseModel):
    event_type: str
    order_id: str
    pg_tid: str
    amount: int
    status: str = Field(..., pattern=r"^(PAID|FAILED|CANCELLED)$")


# --- Entitlement ---


class EntitlementRead(BaseModel):
    id: str
    company_id: str
    type: str
    balance: int
    start_at: datetime | None = None
    end_at: datetime | None = None
    order_id: str | None = None
    created_at: datetime


class EntitlementListResponse(BaseModel):
    items: list[EntitlementRead]


# --- Invoice ---


class InvoiceRequest(BaseModel):
    order_id: str


class InvoiceRead(BaseModel):
    id: str
    company_id: str
    order_id: str
    status: str
    requested_at: datetime
    issued_at: datetime | None = None
    created_at: datetime


class InvoiceListResponse(BaseModel):
    items: list[InvoiceRead]
    total: int
