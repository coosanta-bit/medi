import uuid
from datetime import datetime, timezone

from fastapi import HTTPException
from sqlalchemy import Select, and_, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.enums import JobPostStatus, Role, VerificationStatus
from app.models.company import Company, CompanyUser, CompanyVerification
from app.models.job import JobPost, JobPostHistory
from app.models.user import User
from app.schemas.job import (
    JobListResponse,
    JobPostCreate,
    JobPostRead,
    JobPostSummary,
    JobPostUpdate,
)


async def _get_company_for_user(db: AsyncSession, user: User) -> Company:
    """Get the company associated with a user, or raise 403."""
    result = await db.execute(
        select(CompanyUser).where(CompanyUser.user_id == user.id)
    )
    cu = result.scalar_one_or_none()
    if not cu:
        raise HTTPException(status_code=403, detail="기업 계정이 아닙니다")

    result = await db.execute(select(Company).where(Company.id == cu.company_id))
    company = result.scalar_one_or_none()
    if not company:
        raise HTTPException(status_code=404, detail="기업 정보를 찾을 수 없습니다")
    return company


async def _check_verified(db: AsyncSession, company_id: uuid.UUID) -> bool:
    """Check if the company has an approved verification."""
    result = await db.execute(
        select(CompanyVerification).where(
            and_(
                CompanyVerification.company_id == company_id,
                CompanyVerification.status == VerificationStatus.APPROVED.value,
            )
        )
    )
    return result.scalar_one_or_none() is not None


def _job_to_summary(job: JobPost, company: Company | None = None) -> JobPostSummary:
    return JobPostSummary(
        id=str(job.id),
        company_name=company.name if company else None,
        company_type=company.type if company else None,
        status=job.status,
        title=job.title,
        job_category=job.job_category,
        employment_type=job.employment_type,
        shift_type=job.shift_type,
        salary_type=job.salary_type,
        salary_min=job.salary_min,
        salary_max=job.salary_max,
        location_code=job.location_code,
        location_detail=job.location_detail,
        close_at=job.close_at,
        published_at=job.published_at,
        view_count=job.view_count,
    )


def _job_to_read(job: JobPost, company: Company | None = None) -> JobPostRead:
    return JobPostRead(
        id=str(job.id),
        company_id=str(job.company_id),
        company_name=company.name if company else None,
        company_type=company.type if company else None,
        status=job.status,
        title=job.title,
        body=job.body,
        job_category=job.job_category,
        department=job.department,
        specialty=job.specialty,
        employment_type=job.employment_type,
        shift_type=job.shift_type,
        salary_type=job.salary_type,
        salary_min=job.salary_min,
        salary_max=job.salary_max,
        location_code=job.location_code,
        location_detail=job.location_detail,
        contact_name=job.contact_name,
        contact_visible=job.contact_visible,
        close_at=job.close_at,
        published_at=job.published_at,
        view_count=job.view_count,
        created_at=job.created_at,
        updated_at=job.updated_at,
    )


async def _record_history(
    db: AsyncSession,
    job_post_id: uuid.UUID,
    action: str,
    changed_by: uuid.UUID | None = None,
    diff: dict | None = None,
) -> None:
    history = JobPostHistory(
        job_post_id=job_post_id,
        changed_by=changed_by,
        action=action,
        diff_json=diff,
    )
    db.add(history)


# --- CRUD ---


async def create_job(
    db: AsyncSession, user: User, data: JobPostCreate
) -> JobPostRead:
    company = await _get_company_for_user(db, user)

    job = JobPost(
        company_id=company.id,
        status=JobPostStatus.DRAFT.value,
        title=data.title,
        body=data.body,
        job_category=data.job_category,
        department=data.department,
        specialty=data.specialty,
        employment_type=data.employment_type,
        shift_type=data.shift_type,
        salary_type=data.salary_type,
        salary_min=data.salary_min,
        salary_max=data.salary_max,
        location_code=data.location_code,
        location_detail=data.location_detail,
        contact_name=data.contact_name,
        contact_visible=data.contact_visible,
        close_at=data.close_at,
    )
    db.add(job)
    await db.flush()

    await _record_history(db, job.id, "CREATE", user.id)

    return _job_to_read(job, company)


async def update_job(
    db: AsyncSession, user: User, job_id: uuid.UUID, data: JobPostUpdate
) -> JobPostRead:
    company = await _get_company_for_user(db, user)

    result = await db.execute(select(JobPost).where(JobPost.id == job_id))
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="공고를 찾을 수 없습니다")
    if job.company_id != company.id:
        raise HTTPException(status_code=403, detail="수정 권한이 없습니다")
    if job.status == JobPostStatus.BLINDED.value:
        raise HTTPException(status_code=403, detail="블라인드 처리된 공고는 수정할 수 없습니다")

    diff = {}
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        old_value = getattr(job, field)
        if old_value != value:
            diff[field] = {"from": str(old_value), "to": str(value)}
            setattr(job, field, value)

    if diff:
        await _record_history(db, job.id, "UPDATE", user.id, diff)

    return _job_to_read(job, company)


async def publish_job(
    db: AsyncSession, user: User, job_id: uuid.UUID
) -> JobPostRead:
    company = await _get_company_for_user(db, user)

    result = await db.execute(select(JobPost).where(JobPost.id == job_id))
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="공고를 찾을 수 없습니다")
    if job.company_id != company.id:
        raise HTTPException(status_code=403, detail="공개 권한이 없습니다")

    # Verify company is approved
    is_verified = await _check_verified(db, company.id)
    if not is_verified:
        raise HTTPException(
            status_code=403, detail="기업 인증이 완료되어야 공고를 공개할 수 있습니다"
        )

    if job.status not in (JobPostStatus.DRAFT.value, JobPostStatus.CLOSED.value):
        raise HTTPException(
            status_code=409,
            detail=f"현재 상태({job.status})에서는 공개할 수 없습니다",
        )

    # Validate required fields for publishing
    missing = []
    if not job.title:
        missing.append("title")
    if not job.job_category:
        missing.append("job_category")
    if not job.employment_type:
        missing.append("employment_type")
    if not job.location_code:
        missing.append("location_code")
    if missing:
        raise HTTPException(
            status_code=400,
            detail=f"필수 항목이 누락되었습니다: {', '.join(missing)}",
        )

    job.status = JobPostStatus.PUBLISHED.value
    job.published_at = datetime.now(timezone.utc)

    await _record_history(db, job.id, "PUBLISH", user.id)

    return _job_to_read(job, company)


async def close_job(
    db: AsyncSession, user: User, job_id: uuid.UUID
) -> JobPostRead:
    company = await _get_company_for_user(db, user)

    result = await db.execute(select(JobPost).where(JobPost.id == job_id))
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="공고를 찾을 수 없습니다")
    if job.company_id != company.id:
        raise HTTPException(status_code=403, detail="마감 권한이 없습니다")
    if job.status != JobPostStatus.PUBLISHED.value:
        raise HTTPException(
            status_code=409, detail="공개 중인 공고만 마감할 수 있습니다"
        )

    job.status = JobPostStatus.CLOSED.value

    await _record_history(db, job.id, "CLOSE", user.id)

    return _job_to_read(job, company)


async def get_company_jobs(
    db: AsyncSession, user: User, page: int = 1, size: int = 20
) -> JobListResponse:
    company = await _get_company_for_user(db, user)

    count_q = select(func.count()).select_from(JobPost).where(
        JobPost.company_id == company.id
    )
    total_result = await db.execute(count_q)
    total = total_result.scalar() or 0

    q = (
        select(JobPost)
        .where(JobPost.company_id == company.id)
        .order_by(JobPost.created_at.desc())
        .offset((page - 1) * size)
        .limit(size)
    )
    result = await db.execute(q)
    jobs = result.scalars().all()

    items = [_job_to_summary(j, company) for j in jobs]
    return JobListResponse(items=items, page=page, size=size, total=total)


# --- Public Search ---


async def search_jobs(
    db: AsyncSession,
    keyword: str | None = None,
    location_code: str | None = None,
    job_category: str | None = None,
    shift_type: str | None = None,
    employment_type: str | None = None,
    salary_min: int | None = None,
    sort: str = "LATEST",
    page: int = 1,
    size: int = 20,
) -> JobListResponse:
    base_filter = JobPost.status == JobPostStatus.PUBLISHED.value

    filters = [base_filter]

    if keyword:
        kw = f"%{keyword}%"
        filters.append(
            or_(
                JobPost.title.ilike(kw),
                JobPost.body.ilike(kw),
            )
        )
    if location_code:
        filters.append(JobPost.location_code == location_code)
    if job_category:
        filters.append(JobPost.job_category == job_category)
    if shift_type:
        filters.append(JobPost.shift_type == shift_type)
    if employment_type:
        filters.append(JobPost.employment_type == employment_type)
    if salary_min is not None:
        filters.append(
            or_(
                JobPost.salary_min >= salary_min,
                JobPost.salary_min.is_(None),
            )
        )

    where_clause = and_(*filters)

    # Count
    count_q = select(func.count()).select_from(JobPost).where(where_clause)
    total_result = await db.execute(count_q)
    total = total_result.scalar() or 0

    # Sort
    if sort == "SALARY_DESC":
        order = JobPost.salary_max.desc().nullslast()
    elif sort == "CLOSING_SOON":
        order = JobPost.close_at.asc().nullslast()
    elif sort == "VIEWS":
        order = JobPost.view_count.desc()
    else:  # LATEST
        order = JobPost.published_at.desc().nullslast()

    q = (
        select(JobPost)
        .where(where_clause)
        .order_by(order, JobPost.id)
        .offset((page - 1) * size)
        .limit(size)
    )
    result = await db.execute(q)
    jobs = result.scalars().all()

    # Fetch companies for the jobs
    company_ids = list({j.company_id for j in jobs})
    companies_map: dict[uuid.UUID, Company] = {}
    if company_ids:
        co_result = await db.execute(
            select(Company).where(Company.id.in_(company_ids))
        )
        for co in co_result.scalars().all():
            companies_map[co.id] = co

    items = [_job_to_summary(j, companies_map.get(j.company_id)) for j in jobs]
    return JobListResponse(items=items, page=page, size=size, total=total)


async def get_job_detail(
    db: AsyncSession, job_id: uuid.UUID
) -> JobPostRead:
    result = await db.execute(select(JobPost).where(JobPost.id == job_id))
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="공고를 찾을 수 없습니다")

    # BLINDED jobs: return limited info
    if job.status == JobPostStatus.BLINDED.value:
        raise HTTPException(status_code=404, detail="블라인드 처리된 공고입니다")

    # Fetch company
    co_result = await db.execute(select(Company).where(Company.id == job.company_id))
    company = co_result.scalar_one_or_none()

    # Increment view count
    job.view_count += 1

    return _job_to_read(job, company)
