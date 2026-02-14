from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.billing import (
    EntitlementListResponse,
    InvoiceListResponse,
    InvoiceRead,
    InvoiceRequest,
    OrderCreate,
    OrderListResponse,
    OrderRead,
    PaymentListResponse,
    ProductListResponse,
    WebhookPayload,
)
from app.services import billing_service

router = APIRouter(prefix="/billing", tags=["billing"])


# --- Products (public for company users) ---


@router.get("/products", response_model=ProductListResponse)
async def list_products(
    db: AsyncSession = Depends(get_db),
):
    return await billing_service.list_products(db)


# --- Orders ---


@router.post("/orders", response_model=OrderRead)
async def create_order(
    data: OrderCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await billing_service.create_order(db, user, data.product_id)


@router.get("/orders", response_model=OrderListResponse)
async def list_orders(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
):
    return await billing_service.list_orders(db, user, page, size)


# --- Webhook (no auth - called by PG) ---


@router.post("/webhooks/{pg}")
async def receive_webhook(
    pg: str,
    data: WebhookPayload,
    db: AsyncSession = Depends(get_db),
):
    return await billing_service.process_webhook(
        db, pg, data.order_id, data.pg_tid, data.amount, data.status
    )


# --- Payments ---


@router.get("/payments", response_model=PaymentListResponse)
async def list_payments(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
):
    return await billing_service.list_payments(db, user, page, size)


# --- Entitlements ---


@router.get("/entitlements", response_model=EntitlementListResponse)
async def list_entitlements(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await billing_service.list_entitlements(db, user)


# --- Invoices ---


@router.post("/invoices/request", response_model=InvoiceRead)
async def request_invoice(
    data: InvoiceRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await billing_service.request_invoice(db, user, data.order_id)


@router.get("/invoices", response_model=InvoiceListResponse)
async def list_invoices(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
):
    return await billing_service.list_invoices(db, user, page, size)
