from datetime import datetime

from pydantic import BaseModel, Field


class VerificationSubmit(BaseModel):
    file_key: str = Field(..., min_length=1, max_length=500)


class VerificationRead(BaseModel):
    id: str
    company_id: str
    company_name: str | None = None
    company_business_no: str | None = None
    status: str
    file_key: str | None = None
    reject_reason: str | None = None
    reviewed_by: str | None = None
    created_at: datetime
    updated_at: datetime


class VerificationListResponse(BaseModel):
    items: list[VerificationRead]
    total: int


class VerificationReview(BaseModel):
    status: str = Field(..., pattern=r"^(APPROVED|REJECTED)$")
    reject_reason: str | None = None
