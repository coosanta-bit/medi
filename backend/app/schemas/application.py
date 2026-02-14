from datetime import datetime

from pydantic import BaseModel, Field


class ApplyRequest(BaseModel):
    resume_id: str = Field(..., description="이력서 ID")


class ApplicationRead(BaseModel):
    id: str
    job_post_id: str
    job_title: str | None = None
    company_name: str | None = None
    applicant_user_id: str
    applicant_name: str | None = None
    resume_id: str | None = None
    status: str
    created_at: datetime
    updated_at: datetime


class ApplicationListResponse(BaseModel):
    items: list[ApplicationRead]
    total: int


class StatusChangeRequest(BaseModel):
    status: str = Field(
        ...,
        pattern="^(REVIEWING|INTERVIEW|OFFERED|HIRED|REJECTED|ON_HOLD)$",
    )
    note: str | None = None


class ApplicationNoteCreate(BaseModel):
    note: str = Field(..., min_length=1, max_length=2000)


class ApplicationNoteRead(BaseModel):
    id: str
    author_user_id: str
    note: str
    created_at: datetime


class StatusHistoryRead(BaseModel):
    id: str
    from_status: str | None = None
    to_status: str
    changed_by: str | None = None
    note: str | None = None
    created_at: datetime


class ApplicationDetailRead(BaseModel):
    id: str
    job_post_id: str
    job_title: str | None = None
    company_name: str | None = None
    applicant_user_id: str
    applicant_name: str | None = None
    resume_id: str | None = None
    status: str
    status_history: list[StatusHistoryRead] = []
    notes: list[ApplicationNoteRead] = []
    created_at: datetime
    updated_at: datetime
