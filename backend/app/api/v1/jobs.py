from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.application import ApplyRequest, ApplicationRead
from app.core.enums import JobPostStatus
from app.models.job import JobPost
from app.schemas.job import JobListResponse, JobPostRead, JobSitemapEntry
from app.services import application_service, job_service

router = APIRouter(prefix="/jobs", tags=["jobs"])


@router.get("/sitemap", response_model=list[JobSitemapEntry])
async def jobs_for_sitemap(db: AsyncSession = Depends(get_db)):
    from sqlalchemy import select

    result = await db.execute(
        select(JobPost.id, JobPost.updated_at)
        .where(JobPost.status == JobPostStatus.PUBLISHED.value)
        .order_by(JobPost.updated_at.desc())
        .limit(5000)
    )
    return [
        {"id": str(r.id), "updated_at": r.updated_at} for r in result.all()
    ]


@router.get("", response_model=JobListResponse)
async def list_jobs(
    db: AsyncSession = Depends(get_db),
    keyword: str | None = None,
    location_code: str | None = None,
    job_category: str | None = None,
    shift_type: str | None = None,
    employment_type: str | None = None,
    salary_min: int | None = None,
    sort: str = "LATEST",
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
):
    return await job_service.search_jobs(
        db,
        keyword=keyword,
        location_code=location_code,
        job_category=job_category,
        shift_type=shift_type,
        employment_type=employment_type,
        salary_min=salary_min,
        sort=sort,
        page=page,
        size=size,
    )


@router.get("/{job_id}", response_model=JobPostRead)
async def get_job(job_id: UUID, db: AsyncSession = Depends(get_db)):
    return await job_service.get_job_detail(db, job_id)


@router.post("/{job_id}/apply", response_model=ApplicationRead)
async def apply_to_job(
    job_id: UUID,
    data: ApplyRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await application_service.apply_to_job(db, user, job_id, data.resume_id)
