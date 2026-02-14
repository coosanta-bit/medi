from datetime import datetime

from pydantic import BaseModel


class NotificationRead(BaseModel):
    id: str
    type: str
    channel: str
    payload: dict | None = None
    status: str
    read_at: datetime | None = None
    created_at: datetime


class NotificationListResponse(BaseModel):
    items: list[NotificationRead]
    unread_count: int
