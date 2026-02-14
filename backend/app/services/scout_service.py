import uuid

from fastapi import HTTPException
from sqlalchemy import and_, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.enums import JobPostStatus, ResumeVisibility, ScoutStatus
from app.models.company import Company, CompanyUser
from app.models.interaction import Scout
from app.models.job import JobPost
from app.models.resume import Resume
from app.models.user import User
from app.schemas.scout import (
    ScoutCreate,
    ScoutListResponse,
    ScoutRead,
    TalentListResponse,
    TalentSummary,
)
from app.services import notification_service


# --- Helpers ---


async def _get_company_for_user(db: AsyncSession, user: User) -> Company:
    result = await db.execute(
        select(CompanyUser).where(CompanyUser.user_id == user.id)
    )
    cu = result.scalar_one_or_none()
    if not cu:
        raise HTTPException(status_code=403, detail="기업 회원만 사용할 수 있습니다")

    result = await db.execute(select(Company).where(Company.id == cu.company_id))
    company = result.scalar_one_or_none()
    if not company:
        raise HTTPException(status_code=404, detail="기업 정보를 찾을 수 없습니다")
    return company


def _scout_to_read(
    scout: Scout,
    company_name: str | None = None,
    job_title: str | None = None,
) -> ScoutRead:
    return ScoutRead(
        id=str(scout.id),
        company_id=str(scout.company_id),
        company_name=company_name,
        user_id=str(scout.user_id),
        job_post_id=str(scout.job_post_id) if scout.job_post_id else None,
        job_title=job_title,
        status=scout.status,
        message=scout.message,
        created_at=scout.created_at,
        updated_at=scout.updated_at,
    )


# --- Talent Search ---


async def search_talents(
    db: AsyncSession,
    keyword: str | None,
    desired_job: str | None,
    desired_region: str | None,
    is_experienced: bool | None,
    page: int,
    size: int,
) -> TalentListResponse:
    conditions = [Resume.visibility == ResumeVisibility.PUBLIC.value]

    if keyword:
        kw = f"%{keyword}%"
        conditions.append(
            or_(Resume.title.ilike(kw), Resume.summary.ilike(kw))
        )
    if desired_job:
        conditions.append(Resume.desired_job == desired_job)
    if desired_region:
        conditions.append(Resume.desired_region == desired_region)
    if is_experienced is not None:
        conditions.append(Resume.is_experienced == is_experienced)

    where = and_(*conditions)

    # Count
    count_result = await db.execute(
        select(func.count()).select_from(Resume).where(where)
    )
    total = count_result.scalar() or 0

    # Fetch
    result = await db.execute(
        select(Resume)
        .options(selectinload(Resume.licenses), selectinload(Resume.careers))
        .where(where)
        .order_by(Resume.updated_at.desc())
        .offset((page - 1) * size)
        .limit(size)
    )
    resumes = result.scalars().all()

    items = []
    for r in resumes:
        preview = None
        if r.summary:
            preview = r.summary[:100] + "..." if len(r.summary) > 100 else r.summary
        items.append(
            TalentSummary(
                id=str(r.id),
                desired_job=r.desired_job,
                desired_region=r.desired_region,
                is_experienced=r.is_experienced,
                license_types=[lic.license_type for lic in r.licenses],
                career_count=len(r.careers),
                summary_preview=preview,
                created_at=r.created_at,
                updated_at=r.updated_at,
            )
        )

    return TalentListResponse(items=items, page=page, size=size, total=total)


# --- Scout: Company Side ---


async def send_scout(
    db: AsyncSession, user: User, data: ScoutCreate
) -> ScoutRead:
    company = await _get_company_for_user(db, user)

    # Validate resume
    result = await db.execute(
        select(Resume).where(Resume.id == uuid.UUID(data.resume_id))
    )
    resume = result.scalar_one_or_none()
    if not resume:
        raise HTTPException(status_code=404, detail="이력서를 찾을 수 없습니다")
    if resume.visibility != ResumeVisibility.PUBLIC.value:
        raise HTTPException(status_code=403, detail="비공개 이력서에는 스카우트를 보낼 수 없습니다")

    # Validate job post if provided
    job_title = None
    if data.job_post_id:
        jr = await db.execute(
            select(JobPost).where(JobPost.id == uuid.UUID(data.job_post_id))
        )
        job = jr.scalar_one_or_none()
        if not job:
            raise HTTPException(status_code=404, detail="공고를 찾을 수 없습니다")
        if job.company_id != company.id:
            raise HTTPException(status_code=403, detail="본인 기업의 공고만 연결할 수 있습니다")
        if job.status != JobPostStatus.PUBLISHED.value:
            raise HTTPException(status_code=400, detail="게시 중인 공고만 연결할 수 있습니다")
        job_title = job.title

    # Duplicate check
    existing = await db.execute(
        select(Scout).where(
            and_(
                Scout.company_id == company.id,
                Scout.user_id == resume.user_id,
                Scout.status != ScoutStatus.REJECTED.value,
            )
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="이미 스카우트를 보낸 인재입니다")

    scout = Scout(
        company_id=company.id,
        user_id=resume.user_id,
        job_post_id=uuid.UUID(data.job_post_id) if data.job_post_id else None,
        status=ScoutStatus.SENT.value,
        message=data.message,
    )
    db.add(scout)
    await db.flush()

    await notification_service.create_notification(
        db,
        resume.user_id,
        "SCOUT_RECEIVED",
        payload={"scout_id": str(scout.id), "company_name": company.name},
    )

    return _scout_to_read(scout, company.name, job_title)


async def list_company_scouts(
    db: AsyncSession,
    user: User,
    status: str | None,
    page: int,
    size: int,
) -> ScoutListResponse:
    company = await _get_company_for_user(db, user)

    conditions = [Scout.company_id == company.id]
    if status:
        conditions.append(Scout.status == status)
    where = and_(*conditions)

    count_result = await db.execute(
        select(func.count()).select_from(Scout).where(where)
    )
    total = count_result.scalar() or 0

    result = await db.execute(
        select(Scout)
        .where(where)
        .order_by(Scout.created_at.desc())
        .offset((page - 1) * size)
        .limit(size)
    )
    scouts = result.scalars().all()

    # Batch fetch job titles
    job_ids = list({s.job_post_id for s in scouts if s.job_post_id})
    jobs_map: dict[uuid.UUID, str] = {}
    if job_ids:
        jr = await db.execute(
            select(JobPost.id, JobPost.title).where(JobPost.id.in_(job_ids))
        )
        for row in jr.all():
            jobs_map[row[0]] = row[1]

    items = [
        _scout_to_read(s, company.name, jobs_map.get(s.job_post_id))
        for s in scouts
    ]
    return ScoutListResponse(items=items, total=total)


async def get_company_scout_detail(
    db: AsyncSession, user: User, scout_id: uuid.UUID
) -> ScoutRead:
    company = await _get_company_for_user(db, user)

    result = await db.execute(select(Scout).where(Scout.id == scout_id))
    scout = result.scalar_one_or_none()
    if not scout:
        raise HTTPException(status_code=404, detail="스카우트를 찾을 수 없습니다")
    if scout.company_id != company.id:
        raise HTTPException(status_code=403, detail="접근 권한이 없습니다")

    job_title = None
    if scout.job_post_id:
        jr = await db.execute(
            select(JobPost.title).where(JobPost.id == scout.job_post_id)
        )
        job_title = jr.scalar()

    return _scout_to_read(scout, company.name, job_title)


# --- Scout: User Side ---


async def list_user_scouts(
    db: AsyncSession,
    user: User,
    status: str | None,
    page: int,
    size: int,
) -> ScoutListResponse:
    conditions = [Scout.user_id == user.id]
    if status:
        conditions.append(Scout.status == status)
    where = and_(*conditions)

    count_result = await db.execute(
        select(func.count()).select_from(Scout).where(where)
    )
    total = count_result.scalar() or 0

    result = await db.execute(
        select(Scout)
        .where(where)
        .order_by(Scout.created_at.desc())
        .offset((page - 1) * size)
        .limit(size)
    )
    scouts = result.scalars().all()

    # Batch fetch company names and job titles
    company_ids = list({s.company_id for s in scouts})
    companies_map: dict[uuid.UUID, str] = {}
    if company_ids:
        cr = await db.execute(
            select(Company.id, Company.name).where(Company.id.in_(company_ids))
        )
        for row in cr.all():
            companies_map[row[0]] = row[1]

    job_ids = list({s.job_post_id for s in scouts if s.job_post_id})
    jobs_map: dict[uuid.UUID, str] = {}
    if job_ids:
        jr = await db.execute(
            select(JobPost.id, JobPost.title).where(JobPost.id.in_(job_ids))
        )
        for row in jr.all():
            jobs_map[row[0]] = row[1]

    items = [
        _scout_to_read(
            s,
            companies_map.get(s.company_id),
            jobs_map.get(s.job_post_id) if s.job_post_id else None,
        )
        for s in scouts
    ]
    return ScoutListResponse(items=items, total=total)


async def get_user_scout_detail(
    db: AsyncSession, user: User, scout_id: uuid.UUID
) -> ScoutRead:
    result = await db.execute(select(Scout).where(Scout.id == scout_id))
    scout = result.scalar_one_or_none()
    if not scout:
        raise HTTPException(status_code=404, detail="스카우트를 찾을 수 없습니다")
    if scout.user_id != user.id:
        raise HTTPException(status_code=403, detail="접근 권한이 없습니다")

    # Auto-mark as VIEWED
    if scout.status == ScoutStatus.SENT.value:
        scout.status = ScoutStatus.VIEWED.value
        await db.flush()

    # Fetch company name
    cr = await db.execute(
        select(Company.name).where(Company.id == scout.company_id)
    )
    company_name = cr.scalar()

    job_title = None
    if scout.job_post_id:
        jr = await db.execute(
            select(JobPost.title).where(JobPost.id == scout.job_post_id)
        )
        job_title = jr.scalar()

    return _scout_to_read(scout, company_name, job_title)


async def respond_to_scout(
    db: AsyncSession, user: User, scout_id: uuid.UUID, new_status: str
) -> ScoutRead:
    result = await db.execute(select(Scout).where(Scout.id == scout_id))
    scout = result.scalar_one_or_none()
    if not scout:
        raise HTTPException(status_code=404, detail="스카우트를 찾을 수 없습니다")
    if scout.user_id != user.id:
        raise HTTPException(status_code=403, detail="접근 권한이 없습니다")

    final_statuses = {ScoutStatus.ACCEPTED.value, ScoutStatus.REJECTED.value}
    if scout.status in final_statuses:
        raise HTTPException(
            status_code=409, detail=f"이미 응답한 스카우트입니다 ({scout.status})"
        )

    scout.status = new_status
    await db.flush()

    # Notify company users
    cu_result = await db.execute(
        select(CompanyUser.user_id).where(CompanyUser.company_id == scout.company_id)
    )
    for cu_id in cu_result.scalars().all():
        await notification_service.create_notification(
            db,
            cu_id,
            "SCOUT_RESPONDED",
            payload={"scout_id": str(scout.id), "status": new_status},
        )

    # Fetch names for response
    cr = await db.execute(
        select(Company.name).where(Company.id == scout.company_id)
    )
    company_name = cr.scalar()

    job_title = None
    if scout.job_post_id:
        jr = await db.execute(
            select(JobPost.title).where(JobPost.id == scout.job_post_id)
        )
        job_title = jr.scalar()

    return _scout_to_read(scout, company_name, job_title)
