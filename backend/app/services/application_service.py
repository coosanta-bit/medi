import uuid

from fastapi import HTTPException
from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.enums import ApplicationStatus, JobPostStatus, Role
from app.models.application import Application, ApplicationNote, ApplicationStatusHistory
from app.models.company import Company, CompanyUser
from app.models.job import JobPost
from app.models.resume import Resume
from app.models.user import User, UserProfile
from app.schemas.application import (
    ApplicationDetailRead,
    ApplicationListResponse,
    ApplicationNoteRead,
    ApplicationRead,
    StatusHistoryRead,
)
from app.services import notification_service


# --- Helpers ---


def _app_to_read(
    app: Application,
    job_title: str | None = None,
    company_name: str | None = None,
    applicant_name: str | None = None,
) -> ApplicationRead:
    return ApplicationRead(
        id=str(app.id),
        job_post_id=str(app.job_post_id),
        job_title=job_title,
        company_name=company_name,
        applicant_user_id=str(app.applicant_user_id),
        applicant_name=applicant_name,
        resume_id=str(app.resume_id) if app.resume_id else None,
        status=app.status,
        created_at=app.created_at,
        updated_at=app.updated_at,
    )


# --- Apply (구직자) ---


async def apply_to_job(
    db: AsyncSession, user: User, job_id: uuid.UUID, resume_id: str
) -> ApplicationRead:
    # Check job exists and is published
    result = await db.execute(select(JobPost).where(JobPost.id == job_id))
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="공고를 찾을 수 없습니다")
    if job.status != JobPostStatus.PUBLISHED.value:
        raise HTTPException(status_code=409, detail="마감된 공고에는 지원할 수 없습니다")

    # Check resume ownership
    rid = uuid.UUID(resume_id)
    result = await db.execute(select(Resume).where(Resume.id == rid))
    resume = result.scalar_one_or_none()
    if not resume or resume.user_id != user.id:
        raise HTTPException(status_code=404, detail="이력서를 찾을 수 없습니다")

    # Check duplicate application
    result = await db.execute(
        select(Application).where(
            and_(
                Application.job_post_id == job_id,
                Application.applicant_user_id == user.id,
            )
        )
    )
    if result.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="이미 지원한 공고입니다")

    # Create application
    application = Application(
        job_post_id=job_id,
        applicant_user_id=user.id,
        resume_id=rid,
        status=ApplicationStatus.RECEIVED.value,
    )
    db.add(application)
    await db.flush()

    # Create status history
    history = ApplicationStatusHistory(
        application_id=application.id,
        from_status=None,
        to_status=ApplicationStatus.RECEIVED.value,
        changed_by=user.id,
    )
    db.add(history)

    # Notify company users
    co_result = await db.execute(
        select(CompanyUser.user_id).where(CompanyUser.company_id == job.company_id)
    )
    company_user_ids = co_result.scalars().all()
    for cu_id in company_user_ids:
        await notification_service.create_notification(
            db,
            cu_id,
            "APPLICATION_RECEIVED",
            payload={
                "job_post_id": str(job_id),
                "job_title": job.title,
                "application_id": str(application.id),
            },
        )

    # Get company name for response
    co = await db.execute(select(Company.name).where(Company.id == job.company_id))
    company_name = co.scalar_one_or_none()

    return _app_to_read(application, job.title, company_name)


async def list_my_applications(
    db: AsyncSession, user: User
) -> ApplicationListResponse:
    result = await db.execute(
        select(Application)
        .where(Application.applicant_user_id == user.id)
        .order_by(Application.created_at.desc())
    )
    apps = result.scalars().all()

    # Fetch job info
    job_ids = list({a.job_post_id for a in apps})
    jobs_map: dict[uuid.UUID, tuple[str, uuid.UUID]] = {}
    if job_ids:
        jr = await db.execute(
            select(JobPost.id, JobPost.title, JobPost.company_id).where(
                JobPost.id.in_(job_ids)
            )
        )
        for row in jr.all():
            jobs_map[row[0]] = (row[1], row[2])

    company_ids = list({v[1] for v in jobs_map.values()})
    companies_map: dict[uuid.UUID, str] = {}
    if company_ids:
        cr = await db.execute(
            select(Company.id, Company.name).where(Company.id.in_(company_ids))
        )
        for row in cr.all():
            companies_map[row[0]] = row[1]

    items = []
    for app in apps:
        job_info = jobs_map.get(app.job_post_id)
        job_title = job_info[0] if job_info else None
        company_name = companies_map.get(job_info[1]) if job_info else None
        items.append(_app_to_read(app, job_title, company_name))

    return ApplicationListResponse(items=items, total=len(items))


async def get_my_application(
    db: AsyncSession, user: User, application_id: uuid.UUID
) -> ApplicationDetailRead:
    result = await db.execute(
        select(Application)
        .options(selectinload(Application.status_history))
        .where(Application.id == application_id)
    )
    app = result.scalar_one_or_none()
    if not app:
        raise HTTPException(status_code=404, detail="지원 내역을 찾을 수 없습니다")
    if app.applicant_user_id != user.id:
        raise HTTPException(status_code=403, detail="접근 권한이 없습니다")

    # Fetch job info
    jr = await db.execute(
        select(JobPost.title, JobPost.company_id).where(
            JobPost.id == app.job_post_id
        )
    )
    job_row = jr.one_or_none()
    job_title = job_row[0] if job_row else None
    company_name = None
    if job_row:
        cr = await db.execute(
            select(Company.name).where(Company.id == job_row[1])
        )
        company_name = cr.scalar_one_or_none()

    return ApplicationDetailRead(
        id=str(app.id),
        job_post_id=str(app.job_post_id),
        job_title=job_title,
        company_name=company_name,
        applicant_user_id=str(app.applicant_user_id),
        resume_id=str(app.resume_id) if app.resume_id else None,
        status=app.status,
        status_history=[
            StatusHistoryRead(
                id=str(h.id),
                from_status=h.from_status,
                to_status=h.to_status,
                changed_by=str(h.changed_by) if h.changed_by else None,
                note=h.note,
                created_at=h.created_at,
            )
            for h in sorted(app.status_history, key=lambda h: h.created_at)
        ],
        notes=[],  # Notes not visible to applicant
        created_at=app.created_at,
        updated_at=app.updated_at,
    )


# --- ATS (기업) ---


async def _get_company_for_user(db: AsyncSession, user: User) -> Company:
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


async def list_company_applicants(
    db: AsyncSession,
    user: User,
    job_post_id: uuid.UUID | None = None,
    status: str | None = None,
    page: int = 1,
    size: int = 20,
) -> ApplicationListResponse:
    company = await _get_company_for_user(db, user)

    # Get company's job IDs
    job_q = select(JobPost.id).where(JobPost.company_id == company.id)
    if job_post_id:
        job_q = job_q.where(JobPost.id == job_post_id)
    jr = await db.execute(job_q)
    company_job_ids = list(jr.scalars().all())

    if not company_job_ids:
        return ApplicationListResponse(items=[], total=0)

    filters = [Application.job_post_id.in_(company_job_ids)]
    if status:
        filters.append(Application.status == status)

    # Count
    count_r = await db.execute(
        select(func.count())
        .select_from(Application)
        .where(and_(*filters))
    )
    total = count_r.scalar() or 0

    # Fetch
    result = await db.execute(
        select(Application)
        .where(and_(*filters))
        .order_by(Application.created_at.desc())
        .offset((page - 1) * size)
        .limit(size)
    )
    apps = result.scalars().all()

    # Get job titles
    job_ids = list({a.job_post_id for a in apps})
    jobs_map: dict[uuid.UUID, str] = {}
    if job_ids:
        jr2 = await db.execute(
            select(JobPost.id, JobPost.title).where(JobPost.id.in_(job_ids))
        )
        for row in jr2.all():
            jobs_map[row[0]] = row[1]

    # Get applicant names
    user_ids = list({a.applicant_user_id for a in apps})
    names_map: dict[uuid.UUID, str] = {}
    if user_ids:
        pr = await db.execute(
            select(UserProfile.user_id, UserProfile.name).where(
                UserProfile.user_id.in_(user_ids)
            )
        )
        for row in pr.all():
            if row[1]:
                names_map[row[0]] = row[1]

    items = [
        _app_to_read(
            app,
            jobs_map.get(app.job_post_id),
            company.name,
            names_map.get(app.applicant_user_id),
        )
        for app in apps
    ]
    return ApplicationListResponse(items=items, total=total)


async def get_applicant_detail(
    db: AsyncSession, user: User, application_id: uuid.UUID
) -> ApplicationDetailRead:
    company = await _get_company_for_user(db, user)

    result = await db.execute(
        select(Application)
        .options(
            selectinload(Application.status_history),
            selectinload(Application.notes),
        )
        .where(Application.id == application_id)
    )
    app = result.scalar_one_or_none()
    if not app:
        raise HTTPException(status_code=404, detail="지원 내역을 찾을 수 없습니다")

    # Verify this application is for the company's job
    jr = await db.execute(
        select(JobPost).where(
            and_(JobPost.id == app.job_post_id, JobPost.company_id == company.id)
        )
    )
    job = jr.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=403, detail="접근 권한이 없습니다")

    # Get applicant name
    pr = await db.execute(
        select(UserProfile.name).where(UserProfile.user_id == app.applicant_user_id)
    )
    applicant_name = pr.scalar_one_or_none()

    return ApplicationDetailRead(
        id=str(app.id),
        job_post_id=str(app.job_post_id),
        job_title=job.title,
        company_name=company.name,
        applicant_user_id=str(app.applicant_user_id),
        applicant_name=applicant_name,
        resume_id=str(app.resume_id) if app.resume_id else None,
        status=app.status,
        status_history=[
            StatusHistoryRead(
                id=str(h.id),
                from_status=h.from_status,
                to_status=h.to_status,
                changed_by=str(h.changed_by) if h.changed_by else None,
                note=h.note,
                created_at=h.created_at,
            )
            for h in sorted(app.status_history, key=lambda h: h.created_at)
        ],
        notes=[
            ApplicationNoteRead(
                id=str(n.id),
                author_user_id=str(n.author_user_id),
                note=n.note,
                created_at=n.created_at,
            )
            for n in sorted(app.notes, key=lambda n: n.created_at)
        ],
        created_at=app.created_at,
        updated_at=app.updated_at,
    )


FINAL_STATUSES = {ApplicationStatus.HIRED.value, ApplicationStatus.REJECTED.value}


async def change_applicant_status(
    db: AsyncSession,
    user: User,
    application_id: uuid.UUID,
    new_status: str,
    note: str | None = None,
) -> ApplicationDetailRead:
    company = await _get_company_for_user(db, user)

    result = await db.execute(
        select(Application).where(Application.id == application_id)
    )
    app = result.scalar_one_or_none()
    if not app:
        raise HTTPException(status_code=404, detail="지원 내역을 찾을 수 없습니다")

    # Verify ownership
    jr = await db.execute(
        select(JobPost).where(
            and_(JobPost.id == app.job_post_id, JobPost.company_id == company.id)
        )
    )
    if not jr.scalar_one_or_none():
        raise HTTPException(status_code=403, detail="접근 권한이 없습니다")

    # Prevent reverting final statuses
    if app.status in FINAL_STATUSES:
        raise HTTPException(
            status_code=409,
            detail=f"최종 상태({app.status})는 변경할 수 없습니다",
        )

    old_status = app.status
    app.status = new_status

    # Record history
    history = ApplicationStatusHistory(
        application_id=app.id,
        from_status=old_status,
        to_status=new_status,
        changed_by=user.id,
        note=note,
    )
    db.add(history)

    # Notify applicant
    await notification_service.create_notification(
        db,
        app.applicant_user_id,
        "STATUS_CHANGED",
        payload={
            "application_id": str(app.id),
            "job_post_id": str(app.job_post_id),
            "from_status": old_status,
            "to_status": new_status,
        },
    )

    await db.flush()
    return await get_applicant_detail(db, user, application_id)


async def add_applicant_note(
    db: AsyncSession,
    user: User,
    application_id: uuid.UUID,
    note_text: str,
) -> ApplicationNoteRead:
    company = await _get_company_for_user(db, user)

    result = await db.execute(
        select(Application).where(Application.id == application_id)
    )
    app = result.scalar_one_or_none()
    if not app:
        raise HTTPException(status_code=404, detail="지원 내역을 찾을 수 없습니다")

    # Verify ownership
    jr = await db.execute(
        select(JobPost).where(
            and_(JobPost.id == app.job_post_id, JobPost.company_id == company.id)
        )
    )
    if not jr.scalar_one_or_none():
        raise HTTPException(status_code=403, detail="접근 권한이 없습니다")

    note = ApplicationNote(
        application_id=app.id,
        company_id=company.id,
        author_user_id=user.id,
        note=note_text,
    )
    db.add(note)
    await db.flush()

    return ApplicationNoteRead(
        id=str(note.id),
        author_user_id=str(note.author_user_id),
        note=note.note,
        created_at=note.created_at,
    )
