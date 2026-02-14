import uuid
from datetime import datetime, timezone

from fastapi import HTTPException
from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.enums import OrderStatus, PaymentStatus
from app.models.company import Company, CompanyUser
from app.models.payment import Entitlement, Invoice, Order, Payment, Product
from app.models.user import User
from app.schemas.billing import (
    EntitlementRead,
    InvoiceRead,
    OrderRead,
    PaymentRead,
    ProductRead,
)


async def _get_company_for_user(db: AsyncSession, user: User) -> Company:
    result = await db.execute(
        select(CompanyUser).where(CompanyUser.user_id == user.id)
    )
    cu = result.scalar_one_or_none()
    if not cu:
        raise HTTPException(status_code=403, detail="기업 계정이 아닙니다")

    result = await db.execute(select(Company).where(Company.id == cu.company_id))
    company = result.scalar_one_or_none()
    if not company:
        raise HTTPException(status_code=404, detail="기업 정보를 찾을 수 없습니다")
    return company


# --- Products ---


async def list_products(db: AsyncSession) -> dict:
    """List active products."""
    result = await db.execute(
        select(Product).where(Product.active.is_(True)).order_by(Product.type, Product.price)
    )
    products = result.scalars().all()
    items = [
        ProductRead(
            id=str(p.id),
            type=p.type,
            name=p.name,
            price=p.price,
            currency=p.currency,
            config_json=p.config_json,
            active=p.active,
        )
        for p in products
    ]
    return {"items": items}


# --- Orders ---


async def create_order(
    db: AsyncSession, user: User, product_id: str
) -> OrderRead:
    """Create an order for a product."""
    company = await _get_company_for_user(db, user)

    result = await db.execute(
        select(Product).where(
            and_(Product.id == uuid.UUID(product_id), Product.active.is_(True))
        )
    )
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="상품을 찾을 수 없습니다")

    order = Order(
        company_id=company.id,
        product_id=product.id,
        amount=product.price,
        status=OrderStatus.CREATED.value,
    )
    db.add(order)
    await db.flush()

    # Create pending payment
    payment = Payment(
        order_id=order.id,
        status=PaymentStatus.PENDING.value,
    )
    db.add(payment)

    return OrderRead(
        id=str(order.id),
        company_id=str(order.company_id),
        product_id=str(order.product_id),
        product_name=product.name,
        amount=order.amount,
        status=order.status,
        created_at=order.created_at,
        updated_at=order.updated_at,
    )


async def list_orders(
    db: AsyncSession, user: User, page: int = 1, size: int = 20
) -> dict:
    """List company orders."""
    company = await _get_company_for_user(db, user)

    count_q = (
        select(func.count()).select_from(Order).where(Order.company_id == company.id)
    )
    total = (await db.execute(count_q)).scalar() or 0

    q = (
        select(Order)
        .where(Order.company_id == company.id)
        .order_by(Order.created_at.desc())
        .offset((page - 1) * size)
        .limit(size)
    )
    result = await db.execute(q)
    orders = result.scalars().all()

    # Fetch product names
    product_ids = list({o.product_id for o in orders})
    products_map: dict[uuid.UUID, str] = {}
    if product_ids:
        p_result = await db.execute(
            select(Product).where(Product.id.in_(product_ids))
        )
        for p in p_result.scalars().all():
            products_map[p.id] = p.name

    items = [
        OrderRead(
            id=str(o.id),
            company_id=str(o.company_id),
            product_id=str(o.product_id),
            product_name=products_map.get(o.product_id),
            amount=o.amount,
            status=o.status,
            created_at=o.created_at,
            updated_at=o.updated_at,
        )
        for o in orders
    ]
    return {"items": items, "total": total}


# --- Webhook (Idempotent) ---


async def process_webhook(
    db: AsyncSession,
    pg: str,
    order_id: str,
    pg_tid: str,
    amount: int,
    status: str,
) -> dict:
    """
    Process a PG webhook. Idempotent: if pg_tid already exists, skip.
    On PAID: update order status, grant entitlement.
    """
    # Idempotency check by pg_tid
    existing = await db.execute(
        select(Payment).where(Payment.pg_tid == pg_tid)
    )
    if existing.scalar_one_or_none():
        return {"ok": True, "message": "already processed"}

    # Find the order
    result = await db.execute(
        select(Order).where(Order.id == uuid.UUID(order_id))
    )
    order = result.scalar_one_or_none()
    if not order:
        return {"ok": False, "message": "order not found"}

    # Amount verification
    if status == "PAID" and order.amount != amount:
        return {"ok": False, "message": "amount mismatch"}

    # Find pending payment for this order
    pay_result = await db.execute(
        select(Payment).where(
            and_(
                Payment.order_id == order.id,
                Payment.status == PaymentStatus.PENDING.value,
            )
        )
    )
    payment = pay_result.scalar_one_or_none()

    now = datetime.now(timezone.utc)

    if payment:
        payment.pg = pg
        payment.pg_tid = pg_tid
        if status == "PAID":
            payment.status = PaymentStatus.PAID.value
            payment.paid_at = now
        elif status == "FAILED":
            payment.status = PaymentStatus.FAILED.value
        elif status == "CANCELLED":
            payment.status = PaymentStatus.CANCELLED.value
    else:
        # Create new payment record
        payment = Payment(
            order_id=order.id,
            pg=pg,
            pg_tid=pg_tid,
            status=status,
            paid_at=now if status == "PAID" else None,
        )
        db.add(payment)

    # Update order status
    if status == "PAID":
        order.status = OrderStatus.PAID.value
        # Grant entitlement
        await _grant_entitlement(db, order)
    elif status == "FAILED":
        order.status = OrderStatus.CANCELLED.value
    elif status == "CANCELLED":
        order.status = OrderStatus.CANCELLED.value

    return {"ok": True}


async def _grant_entitlement(db: AsyncSession, order: Order) -> None:
    """Grant entitlement based on the product config."""
    result = await db.execute(
        select(Product).where(Product.id == order.product_id)
    )
    product = result.scalar_one_or_none()
    if not product:
        return

    now = datetime.now(timezone.utc)
    config = product.config_json or {}

    if product.type == "BOOST":
        # Period-based entitlement (e.g., 7 days, 14 days)
        days = config.get("days", 7)
        from datetime import timedelta

        entitlement = Entitlement(
            company_id=order.company_id,
            type="BOOST",
            balance=1,
            start_at=now,
            end_at=now + timedelta(days=days),
            order_id=order.id,
        )
        db.add(entitlement)

    elif product.type == "CREDIT":
        # Credit-based entitlement (e.g., 10/30/100 credits)
        credits = config.get("credits", 10)

        # Check for existing credit entitlement to add to
        existing = await db.execute(
            select(Entitlement).where(
                and_(
                    Entitlement.company_id == order.company_id,
                    Entitlement.type == "CREDIT",
                )
            )
        )
        ent = existing.scalar_one_or_none()
        if ent:
            ent.balance += credits
        else:
            entitlement = Entitlement(
                company_id=order.company_id,
                type="CREDIT",
                balance=credits,
                order_id=order.id,
            )
            db.add(entitlement)


# --- Payments ---


async def list_payments(
    db: AsyncSession, user: User, page: int = 1, size: int = 20
) -> dict:
    """List company payment history."""
    company = await _get_company_for_user(db, user)

    # Get all order IDs for this company
    order_ids_q = select(Order.id).where(Order.company_id == company.id)

    count_q = (
        select(func.count())
        .select_from(Payment)
        .where(Payment.order_id.in_(order_ids_q))
    )
    total = (await db.execute(count_q)).scalar() or 0

    q = (
        select(Payment)
        .where(Payment.order_id.in_(order_ids_q))
        .order_by(Payment.created_at.desc())
        .offset((page - 1) * size)
        .limit(size)
    )
    result = await db.execute(q)
    payments = result.scalars().all()

    items = [
        PaymentRead(
            id=str(p.id),
            order_id=str(p.order_id),
            pg=p.pg,
            pg_tid=p.pg_tid,
            status=p.status,
            paid_at=p.paid_at,
            created_at=p.created_at,
        )
        for p in payments
    ]
    return {"items": items, "total": total}


# --- Entitlements ---


async def list_entitlements(db: AsyncSession, user: User) -> dict:
    """List company entitlements."""
    company = await _get_company_for_user(db, user)

    result = await db.execute(
        select(Entitlement)
        .where(Entitlement.company_id == company.id)
        .order_by(Entitlement.created_at.desc())
    )
    entitlements = result.scalars().all()

    items = [
        EntitlementRead(
            id=str(e.id),
            company_id=str(e.company_id),
            type=e.type,
            balance=e.balance,
            start_at=e.start_at,
            end_at=e.end_at,
            order_id=str(e.order_id) if e.order_id else None,
            created_at=e.created_at,
        )
        for e in entitlements
    ]
    return {"items": items}


# --- Invoices ---


async def request_invoice(
    db: AsyncSession, user: User, order_id: str
) -> InvoiceRead:
    """Request a tax invoice for an order."""
    company = await _get_company_for_user(db, user)

    # Verify order belongs to company
    result = await db.execute(
        select(Order).where(
            and_(
                Order.id == uuid.UUID(order_id),
                Order.company_id == company.id,
            )
        )
    )
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="주문을 찾을 수 없습니다")

    if order.status != OrderStatus.PAID.value:
        raise HTTPException(
            status_code=409, detail="결제 완료된 주문만 세금계산서를 요청할 수 있습니다"
        )

    # Check duplicate
    existing = await db.execute(
        select(Invoice).where(Invoice.order_id == order.id)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=409, detail="이미 세금계산서가 요청되었습니다"
        )

    now = datetime.now(timezone.utc)
    invoice = Invoice(
        company_id=company.id,
        order_id=order.id,
        status="REQUESTED",
        requested_at=now,
    )
    db.add(invoice)
    await db.flush()

    return InvoiceRead(
        id=str(invoice.id),
        company_id=str(invoice.company_id),
        order_id=str(invoice.order_id),
        status=invoice.status,
        requested_at=invoice.requested_at,
        issued_at=invoice.issued_at,
        created_at=invoice.created_at,
    )


async def list_invoices(
    db: AsyncSession, user: User, page: int = 1, size: int = 20
) -> dict:
    """List company invoices."""
    company = await _get_company_for_user(db, user)

    count_q = (
        select(func.count())
        .select_from(Invoice)
        .where(Invoice.company_id == company.id)
    )
    total = (await db.execute(count_q)).scalar() or 0

    q = (
        select(Invoice)
        .where(Invoice.company_id == company.id)
        .order_by(Invoice.created_at.desc())
        .offset((page - 1) * size)
        .limit(size)
    )
    result = await db.execute(q)
    invoices = result.scalars().all()

    items = [
        InvoiceRead(
            id=str(inv.id),
            company_id=str(inv.company_id),
            order_id=str(inv.order_id),
            status=inv.status,
            requested_at=inv.requested_at,
            issued_at=inv.issued_at,
            created_at=inv.created_at,
        )
        for inv in invoices
    ]
    return {"items": items, "total": total}
