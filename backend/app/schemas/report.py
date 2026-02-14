from datetime import datetime

from pydantic import BaseModel, Field


class ReportCreate(BaseModel):
    target_type: str = Field(..., pattern=r"^(JOB|USER|COMPANY)$")
    target_id: str
    reason_code: str = Field(..., min_length=1, max_length=50)
    detail: str | None = None


class ReportRead(BaseModel):
    id: str
    target_type: str
    target_id: str
    reporter_user_id: str | None = None
    reason_code: str
    detail: str | None = None
    status: str
    created_at: datetime
    updated_at: datetime


class ReportListResponse(BaseModel):
    items: list[ReportRead]
    total: int


class ReportProcess(BaseModel):
    action: str = Field(..., pattern=r"^(BLIND|WARN|DISMISS)$")
    note: str | None = None
