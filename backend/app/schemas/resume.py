from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, Field


# --- License ---

class ResumeLicenseCreate(BaseModel):
    license_type: str = Field(..., min_length=1, max_length=100)
    license_no_enc: str | None = None
    issued_at: date | None = None


class ResumeLicenseRead(BaseModel):
    id: str
    license_type: str
    issued_at: date | None = None
    created_at: datetime


# --- Career ---

class ResumeCareerCreate(BaseModel):
    org_name: str = Field(..., min_length=1, max_length=200)
    role: str | None = None
    department: str | None = None
    start_at: date
    end_at: date | None = None
    description: str | None = None


class ResumeCareerRead(BaseModel):
    id: str
    org_name: str
    role: str | None = None
    department: str | None = None
    start_at: date
    end_at: date | None = None
    description: str | None = None
    created_at: datetime


# --- Resume ---

class ResumeCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    visibility: str = "PRIVATE"
    desired_job: str | None = None
    desired_region: str | None = None
    desired_shift: str | None = None
    desired_salary_type: str | None = None
    desired_salary_min: int | None = None
    summary: str | None = None
    is_experienced: bool = False
    licenses: list[ResumeLicenseCreate] = []
    careers: list[ResumeCareerCreate] = []


class ResumeUpdate(BaseModel):
    title: str | None = Field(None, min_length=1, max_length=200)
    desired_job: str | None = None
    desired_region: str | None = None
    desired_shift: str | None = None
    desired_salary_type: str | None = None
    desired_salary_min: int | None = None
    summary: str | None = None
    is_experienced: bool | None = None
    licenses: list[ResumeLicenseCreate] | None = None
    careers: list[ResumeCareerCreate] | None = None


class VisibilityUpdate(BaseModel):
    visibility: str = Field(..., pattern="^(PUBLIC|PRIVATE|ONLY_APPLIED)$")


class ResumeRead(BaseModel):
    id: str
    user_id: str
    title: str
    visibility: str
    desired_job: str | None = None
    desired_region: str | None = None
    desired_shift: str | None = None
    desired_salary_type: str | None = None
    desired_salary_min: int | None = None
    summary: str | None = None
    is_experienced: bool = False
    licenses: list[ResumeLicenseRead] = []
    careers: list[ResumeCareerRead] = []
    created_at: datetime
    updated_at: datetime


class ResumeSummary(BaseModel):
    id: str
    title: str
    visibility: str
    desired_job: str | None = None
    is_experienced: bool = False
    created_at: datetime
    updated_at: datetime


class ResumeListResponse(BaseModel):
    items: list[ResumeSummary]
