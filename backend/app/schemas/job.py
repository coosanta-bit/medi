from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, Field


class JobPostCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=300)
    body: str | None = None
    job_category: str | None = None
    department: str | None = None
    specialty: str | None = None
    employment_type: str | None = None
    shift_type: str | None = None
    salary_type: str | None = None
    salary_min: int | None = None
    salary_max: int | None = None
    location_code: str | None = None
    location_detail: str | None = None
    contact_name: str | None = None
    contact_visible: bool = False
    close_at: date | None = None


class JobPostUpdate(BaseModel):
    title: str | None = Field(None, min_length=1, max_length=300)
    body: str | None = None
    job_category: str | None = None
    department: str | None = None
    specialty: str | None = None
    employment_type: str | None = None
    shift_type: str | None = None
    salary_type: str | None = None
    salary_min: int | None = None
    salary_max: int | None = None
    location_code: str | None = None
    location_detail: str | None = None
    contact_name: str | None = None
    contact_visible: bool | None = None
    close_at: date | None = None


class JobPostRead(BaseModel):
    id: str
    company_id: str
    company_name: str | None = None
    company_type: str | None = None
    status: str
    title: str
    body: str | None = None
    job_category: str | None = None
    department: str | None = None
    specialty: str | None = None
    employment_type: str | None = None
    shift_type: str | None = None
    salary_type: str | None = None
    salary_min: int | None = None
    salary_max: int | None = None
    location_code: str | None = None
    location_detail: str | None = None
    contact_name: str | None = None
    contact_visible: bool = False
    close_at: date | None = None
    published_at: datetime | None = None
    view_count: int = 0
    created_at: datetime
    updated_at: datetime


class JobPostSummary(BaseModel):
    id: str
    company_name: str | None = None
    company_type: str | None = None
    status: str
    title: str
    job_category: str | None = None
    employment_type: str | None = None
    shift_type: str | None = None
    salary_type: str | None = None
    salary_min: int | None = None
    salary_max: int | None = None
    location_code: str | None = None
    location_detail: str | None = None
    close_at: date | None = None
    published_at: datetime | None = None
    view_count: int = 0


class JobListResponse(BaseModel):
    items: list[JobPostSummary]
    page: int
    size: int
    total: int


class JobSitemapEntry(BaseModel):
    id: str
    updated_at: datetime
