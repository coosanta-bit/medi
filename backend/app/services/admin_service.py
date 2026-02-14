import uuid
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException
from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.enums import JobPostStatus, UserStatus, VerificationStatus
from app.models.admin import AdminLog, Report
from app.models.application import Application
from app.models.company import Company, CompanyVerification
from app.models.job import JobPost, JobPostHistory
from app.models.user import User
from app.schemas.admin import (
    AdminDashboard,
    AdminLogRead,
    JobModerationItem,
    UserAdminRead,
)


async def get_dashboard(db: AsyncSession) -> AdminDashboard:
    """Get admin dashboard stats."""
    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

    pending_verifications = (
        await db.execute(
            select(func.count())
            .select_from(CompanyVerification)
            .where(CompanyVerification.status == VerificationStatus.PENDING.value)
        )
    ).scalar() or 0

    pending_reports = (
        await db.execute(
            select(func.count())
            .select_from(Report)
            .where(Report.status == "PENDING")
        )
    ).scalar() or 0

    published_jobs = (
        await db.execute(
            select(func.count())
            .select_from(JobPost)
            .where(JobPost.status == JobPostStatus.PUBLISHED.value)
        )
    ).scalar() or 0

    total_users = (
        await db.execute(select(func.count()).select_from(User))
    ).scalar() or 0

    today_applications = (
        await db.execute(
            select(func.count())
            .select_from(Application)
            .where(Application.created_at >= today_start)
        )
    ).scalar() or 0

    return AdminDashboard(
        pending_verifications=pending_verifications,
        pending_reports=pending_reports,
        published_jobs=published_jobs,
        total_users=total_users,
        today_applications=today_applications,
    )


# --- Job Moderation ---


async def list_jobs_for_moderation(
    db: AsyncSession,
    status_filter: str | None = None,
    page: int = 1,
    size: int = 20,
) -> dict:
    """List jobs for admin moderation."""
    filters = []
    if status_filter:
        filters.append(JobPost.status == status_filter)
    else:
        filters.append(
            JobPost.status.in_([
                JobPostStatus.PUBLISHED.value,
                JobPostStatus.BLINDED.value,
            ])
        )

    where = and_(*filters) if filters else True

    count_q = select(func.count()).select_from(JobPost).where(where)
    total = (await db.execute(count_q)).scalar() or 0

    q = (
        select(JobPost)
        .where(where)
        .order_by(JobPost.published_at.desc().nullslast())
        .offset((page - 1) * size)
        .limit(size)
    )
    result = await db.execute(q)
    jobs = result.scalars().all()

    # Fetch companies
    company_ids = list({j.company_id for j in jobs})
    companies_map: dict[uuid.UUID, Company] = {}
    if company_ids:
        co_result = await db.execute(
            select(Company).where(Company.id.in_(company_ids))
        )
        for co in co_result.scalars().all():
            companies_map[co.id] = co

    # Count reports per job
    job_ids = [j.id for j in jobs]
    report_counts: dict[uuid.UUID, int] = {}
    if job_ids:
        rc_result = await db.execute(
            select(Report.target_id, func.count())
            .where(
                and_(
                    Report.target_type == "JOB",
                    Report.target_id.in_(job_ids),
                )
            )
            .group_by(Report.target_id)
        )
        for target_id, count in rc_result.all():
            report_counts[target_id] = count

    items = [
        JobModerationItem(
            id=str(j.id),
            company_name=companies_map.get(j.company_id, None)
            and companies_map[j.company_id].name,
            title=j.title,
            status=j.status,
            published_at=j.published_at,
            view_count=j.view_count,
            report_count=report_counts.get(j.id, 0),
        )
        for j in jobs
    ]
    return {"items": items, "total": total}


async def blind_job(
    db: AsyncSession, admin_user: User, job_id: uuid.UUID, reason: str | None = None
) -> dict:
    """Blind a job post."""
    result = await db.execute(select(JobPost).where(JobPost.id == job_id))
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="공고를 찾을 수 없습니다")

    if job.status == JobPostStatus.BLINDED.value:
        raise HTTPException(status_code=409, detail="이미 블라인드 처리된 공고입니다")

    old_status = job.status
    job.status = JobPostStatus.BLINDED.value

    history = JobPostHistory(
        job_post_id=job.id,
        changed_by=admin_user.id,
        action="BLIND",
        diff_json={"from_status": old_status, "reason": reason or "관리자 블라인드"},
    )
    db.add(history)

    admin_log = AdminLog(
        admin_user_id=admin_user.id,
        action="JOB_BLIND",
        target_type="JOB",
        target_id=job.id,
        meta_json={"title": job.title, "reason": reason},
    )
    db.add(admin_log)

    return {"message": "블라인드 처리 완료", "job_id": str(job.id)}


async def unblind_job(
    db: AsyncSession, admin_user: User, job_id: uuid.UUID
) -> dict:
    """Restore a blinded job post to PUBLISHED."""
    result = await db.execute(select(JobPost).where(JobPost.id == job_id))
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="공고를 찾을 수 없습니다")

    if job.status != JobPostStatus.BLINDED.value:
        raise HTTPException(status_code=409, detail="블라인드 상태가 아닙니다")

    job.status = JobPostStatus.PUBLISHED.value

    history = JobPostHistory(
        job_post_id=job.id,
        changed_by=admin_user.id,
        action="UNBLIND",
    )
    db.add(history)

    admin_log = AdminLog(
        admin_user_id=admin_user.id,
        action="JOB_UNBLIND",
        target_type="JOB",
        target_id=job.id,
        meta_json={"title": job.title},
    )
    db.add(admin_log)

    return {"message": "블라인드 해제 완료", "job_id": str(job.id)}


# --- User Management ---


async def list_users(
    db: AsyncSession,
    type_filter: str | None = None,
    status_filter: str | None = None,
    keyword: str | None = None,
    page: int = 1,
    size: int = 20,
) -> dict:
    """List users for admin."""
    filters = []
    if type_filter:
        filters.append(User.type == type_filter)
    if status_filter:
        filters.append(User.status == status_filter)
    if keyword:
        filters.append(User.email.ilike(f"%{keyword}%"))

    where = and_(*filters) if filters else True

    count_q = select(func.count()).select_from(User).where(where)
    total = (await db.execute(count_q)).scalar() or 0

    q = (
        select(User)
        .where(where)
        .order_by(User.created_at.desc())
        .offset((page - 1) * size)
        .limit(size)
    )
    result = await db.execute(q)
    users = result.scalars().all()

    items = [
        UserAdminRead(
            id=str(u.id),
            email=u.email,
            type=u.type,
            role=u.role,
            status=u.status,
            created_at=u.created_at,
        )
        for u in users
    ]
    return {"items": items, "total": total}


async def update_user_status(
    db: AsyncSession,
    admin_user: User,
    user_id: uuid.UUID,
    new_status: str,
    reason: str | None = None,
) -> UserAdminRead:
    """Suspend or reactivate a user."""
    result = await db.execute(select(User).where(User.id == user_id))
    target = result.scalar_one_or_none()
    if not target:
        raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다")

    old_status = target.status
    target.status = new_status

    admin_log = AdminLog(
        admin_user_id=admin_user.id,
        action=f"USER_STATUS_{new_status}",
        target_type="USER",
        target_id=target.id,
        meta_json={
            "from_status": old_status,
            "to_status": new_status,
            "reason": reason,
        },
    )
    db.add(admin_log)

    return UserAdminRead(
        id=str(target.id),
        email=target.email,
        type=target.type,
        role=target.role,
        status=target.status,
        created_at=target.created_at,
    )


# --- Admin Logs ---


async def list_admin_logs(
    db: AsyncSession, page: int = 1, size: int = 50
) -> dict:
    """List admin action logs."""
    count_q = select(func.count()).select_from(AdminLog)
    total = (await db.execute(count_q)).scalar() or 0

    q = (
        select(AdminLog)
        .order_by(AdminLog.created_at.desc())
        .offset((page - 1) * size)
        .limit(size)
    )
    result = await db.execute(q)
    logs = result.scalars().all()

    items = [
        AdminLogRead(
            id=str(log.id),
            admin_user_id=str(log.admin_user_id),
            action=log.action,
            target_type=log.target_type,
            target_id=str(log.target_id) if log.target_id else None,
            meta_json=log.meta_json,
            created_at=log.created_at,
        )
        for log in logs
    ]
    return {"items": items, "total": total}
