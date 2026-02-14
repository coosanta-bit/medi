import uuid

from fastapi import HTTPException
from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.enums import JobPostStatus, UserStatus
from app.models.admin import AdminLog, Report
from app.models.job import JobPost, JobPostHistory
from app.models.user import User
from app.schemas.report import ReportRead


def _report_to_read(r: Report) -> ReportRead:
    return ReportRead(
        id=str(r.id),
        target_type=r.target_type,
        target_id=str(r.target_id),
        reporter_user_id=str(r.reporter_user_id) if r.reporter_user_id else None,
        reason_code=r.reason_code,
        detail=r.detail,
        status=r.status,
        created_at=r.created_at,
        updated_at=r.updated_at,
    )


async def submit_report(
    db: AsyncSession,
    user: User | None,
    target_type: str,
    target_id: str,
    reason_code: str,
    detail: str | None = None,
) -> ReportRead:
    """Submit a report. Can be anonymous (user=None)."""
    report = Report(
        target_type=target_type,
        target_id=uuid.UUID(target_id),
        reporter_user_id=user.id if user else None,
        reason_code=reason_code,
        detail=detail,
        status="PENDING",
    )
    db.add(report)
    await db.flush()
    return _report_to_read(report)


async def list_reports(
    db: AsyncSession,
    status_filter: str | None = None,
    page: int = 1,
    size: int = 20,
) -> dict:
    """List reports for admin."""
    filters = []
    if status_filter:
        filters.append(Report.status == status_filter)

    where = and_(*filters) if filters else True

    count_q = select(func.count()).select_from(Report).where(where)
    total = (await db.execute(count_q)).scalar() or 0

    q = (
        select(Report)
        .where(where)
        .order_by(Report.created_at.asc())
        .offset((page - 1) * size)
        .limit(size)
    )
    result = await db.execute(q)
    reports = result.scalars().all()

    items = [_report_to_read(r) for r in reports]
    return {"items": items, "total": total}


async def process_report(
    db: AsyncSession,
    admin_user: User,
    report_id: uuid.UUID,
    action: str,
    note: str | None = None,
) -> ReportRead:
    """Process a report: BLIND, WARN, or DISMISS."""
    result = await db.execute(select(Report).where(Report.id == report_id))
    report = result.scalar_one_or_none()
    if not report:
        raise HTTPException(status_code=404, detail="신고를 찾을 수 없습니다")

    if report.status != "PENDING":
        raise HTTPException(status_code=409, detail="이미 처리된 신고입니다")

    if action == "BLIND" and report.target_type == "JOB":
        # Blind the job post
        job_result = await db.execute(
            select(JobPost).where(JobPost.id == report.target_id)
        )
        job = job_result.scalar_one_or_none()
        if job and job.status != JobPostStatus.BLINDED.value:
            job.status = JobPostStatus.BLINDED.value
            history = JobPostHistory(
                job_post_id=job.id,
                changed_by=admin_user.id,
                action="BLIND",
                diff_json={"reason": note or "신고 처리"},
            )
            db.add(history)

    elif action == "WARN" and report.target_type == "USER":
        # For now, just log the warning (could send notification later)
        pass

    report.status = "PROCESSED"

    # Log admin action
    admin_log = AdminLog(
        admin_user_id=admin_user.id,
        action=f"REPORT_{action}",
        target_type="REPORT",
        target_id=report.id,
        meta_json={
            "report_target_type": report.target_type,
            "report_target_id": str(report.target_id),
            "note": note,
        },
    )
    db.add(admin_log)

    return _report_to_read(report)
