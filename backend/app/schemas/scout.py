from datetime import datetime

from pydantic import BaseModel, Field


# --- Talent Search (anonymized resume for companies) ---


class TalentSummary(BaseModel):
    id: str
    desired_job: str | None = None
    desired_region: str | None = None
    is_experienced: bool = False
    license_types: list[str] = []
    career_count: int = 0
    summary_preview: str | None = None
    created_at: datetime
    updated_at: datetime


class TalentListResponse(BaseModel):
    items: list[TalentSummary]
    page: int
    size: int
    total: int


# --- Scout ---


class ScoutCreate(BaseModel):
    resume_id: str = Field(..., description="대상 이력서 ID")
    job_post_id: str | None = Field(None, description="연결할 공고 ID (선택)")
    message: str | None = Field(None, max_length=2000, description="스카우트 메시지")


class ScoutRead(BaseModel):
    id: str
    company_id: str
    company_name: str | None = None
    user_id: str
    job_post_id: str | None = None
    job_title: str | None = None
    status: str
    message: str | None = None
    created_at: datetime
    updated_at: datetime


class ScoutListResponse(BaseModel):
    items: list[ScoutRead]
    total: int


class ScoutRespondRequest(BaseModel):
    status: str = Field(
        ...,
        pattern="^(ACCEPTED|REJECTED|HOLD)$",
        description="응답 상태",
    )
