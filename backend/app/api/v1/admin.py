from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import require_role
from app.core.enums import Role
from app.db.session import get_db
from app.models.user import User
from app.schemas.admin import (
    AdminDashboard,
    AdminLogListResponse,
    JobModerationListResponse,
    UserAdminListResponse,
    UserAdminRead,
    UserStatusUpdate,
)
from app.schemas.report import (
    ReportListResponse,
    ReportProcess,
    ReportRead,
)
from app.schemas.verification import (
    VerificationListResponse,
    VerificationRead,
    VerificationReview,
)
from app.services import admin_service, report_service, verification_service

router = APIRouter(prefix="/admin", tags=["admin"])

admin_roles = require_role(Role.ADMIN, Role.CS)
admin_only = require_role(Role.ADMIN)


# --- Dashboard ---


@router.get("", response_model=AdminDashboard)
async def admin_dashboard(
    user: User = Depends(admin_roles),
    db: AsyncSession = Depends(get_db),
):
    return await admin_service.get_dashboard(db)


# --- Verifications ---


@router.get("/verifications", response_model=VerificationListResponse)
async def list_verifications(
    user: User = Depends(admin_roles),
    db: AsyncSession = Depends(get_db),
    status: str | None = None,
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
):
    return await verification_service.list_pending_verifications(
        db, status, page, size
    )


@router.patch(
    "/verifications/{verification_id}", response_model=VerificationRead
)
async def review_verification(
    verification_id: UUID,
    data: VerificationReview,
    user: User = Depends(admin_roles),
    db: AsyncSession = Depends(get_db),
):
    return await verification_service.review_verification(
        db, user, verification_id, data.status, data.reject_reason
    )


# --- Reports ---


@router.get("/reports", response_model=ReportListResponse)
async def list_reports(
    user: User = Depends(admin_roles),
    db: AsyncSession = Depends(get_db),
    status: str | None = None,
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
):
    return await report_service.list_reports(db, status, page, size)


@router.patch("/reports/{report_id}", response_model=ReportRead)
async def process_report(
    report_id: UUID,
    data: ReportProcess,
    user: User = Depends(admin_roles),
    db: AsyncSession = Depends(get_db),
):
    return await report_service.process_report(
        db, user, report_id, data.action, data.note
    )


# --- Job Moderation ---


@router.get("/moderation/jobs", response_model=JobModerationListResponse)
async def moderation_jobs(
    user: User = Depends(admin_roles),
    db: AsyncSession = Depends(get_db),
    status: str | None = None,
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
):
    return await admin_service.list_jobs_for_moderation(
        db, status, page, size
    )


@router.post("/moderation/jobs/{job_id}/blind")
async def blind_job(
    job_id: UUID,
    user: User = Depends(admin_roles),
    db: AsyncSession = Depends(get_db),
    reason: str | None = None,
):
    return await admin_service.blind_job(db, user, job_id, reason)


@router.post("/moderation/jobs/{job_id}/unblind")
async def unblind_job(
    job_id: UUID,
    user: User = Depends(admin_roles),
    db: AsyncSession = Depends(get_db),
):
    return await admin_service.unblind_job(db, user, job_id)


# --- User Management ---


@router.get("/users", response_model=UserAdminListResponse)
async def list_users(
    user: User = Depends(admin_roles),
    db: AsyncSession = Depends(get_db),
    type: str | None = None,
    status: str | None = None,
    keyword: str | None = None,
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
):
    return await admin_service.list_users(
        db, type, status, keyword, page, size
    )


@router.patch("/users/{user_id}/status", response_model=UserAdminRead)
async def update_user_status(
    user_id: UUID,
    data: UserStatusUpdate,
    user: User = Depends(admin_only),
    db: AsyncSession = Depends(get_db),
):
    return await admin_service.update_user_status(
        db, user, user_id, data.status, data.reason
    )


# --- Admin Logs ---


@router.get("/logs", response_model=AdminLogListResponse)
async def list_logs(
    user: User = Depends(admin_only),
    db: AsyncSession = Depends(get_db),
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=100),
):
    return await admin_service.list_admin_logs(db, page, size)
