from datetime import datetime

from pydantic import BaseModel


class AdminDashboard(BaseModel):
    pending_verifications: int = 0
    pending_reports: int = 0
    published_jobs: int = 0
    total_users: int = 0
    today_applications: int = 0


class AdminLogRead(BaseModel):
    id: str
    admin_user_id: str
    action: str
    target_type: str | None = None
    target_id: str | None = None
    meta_json: dict | None = None
    created_at: datetime


class AdminLogListResponse(BaseModel):
    items: list[AdminLogRead]
    total: int


class JobModerationItem(BaseModel):
    id: str
    company_name: str | None = None
    title: str
    status: str
    published_at: datetime | None = None
    view_count: int = 0
    report_count: int = 0


class JobModerationListResponse(BaseModel):
    items: list[JobModerationItem]
    total: int


class UserAdminRead(BaseModel):
    id: str
    email: str
    type: str
    role: str
    status: str
    created_at: datetime


class UserAdminListResponse(BaseModel):
    items: list[UserAdminRead]
    total: int


class UserStatusUpdate(BaseModel):
    status: str
    reason: str | None = None
