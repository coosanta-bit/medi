import uuid
from datetime import datetime, timezone

from fastapi import HTTPException
from sqlalchemy import and_, func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.notification import Notification
from app.models.user import User
from app.schemas.notification import NotificationListResponse, NotificationRead


async def create_notification(
    db: AsyncSession,
    user_id: uuid.UUID,
    ntype: str,
    payload: dict | None = None,
    channel: str = "IN_APP",
) -> None:
    """Create an in-app notification for a user."""
    notif = Notification(
        user_id=user_id,
        type=ntype,
        channel=channel,
        payload_json=payload,
        status="UNREAD",
    )
    db.add(notif)


async def list_notifications(
    db: AsyncSession, user: User, page: int = 1, size: int = 30
) -> NotificationListResponse:
    # Count unread
    unread_result = await db.execute(
        select(func.count())
        .select_from(Notification)
        .where(
            and_(
                Notification.user_id == user.id,
                Notification.read_at.is_(None),
            )
        )
    )
    unread_count = unread_result.scalar() or 0

    # Fetch notifications
    result = await db.execute(
        select(Notification)
        .where(Notification.user_id == user.id)
        .order_by(Notification.created_at.desc())
        .offset((page - 1) * size)
        .limit(size)
    )
    notifs = result.scalars().all()

    items = [
        NotificationRead(
            id=str(n.id),
            type=n.type,
            channel=n.channel,
            payload=n.payload_json,
            status="READ" if n.read_at else "UNREAD",
            read_at=n.read_at,
            created_at=n.created_at,
        )
        for n in notifs
    ]
    return NotificationListResponse(items=items, unread_count=unread_count)


async def mark_read(
    db: AsyncSession, user: User, notification_id: uuid.UUID
) -> None:
    result = await db.execute(
        select(Notification).where(Notification.id == notification_id)
    )
    notif = result.scalar_one_or_none()
    if not notif:
        raise HTTPException(status_code=404, detail="알림을 찾을 수 없습니다")
    if notif.user_id != user.id:
        raise HTTPException(status_code=403, detail="접근 권한이 없습니다")
    if not notif.read_at:
        notif.read_at = datetime.now(timezone.utc)


async def mark_all_read(db: AsyncSession, user: User) -> int:
    result = await db.execute(
        update(Notification)
        .where(
            and_(
                Notification.user_id == user.id,
                Notification.read_at.is_(None),
            )
        )
        .values(read_at=datetime.now(timezone.utc))
    )
    return result.rowcount
