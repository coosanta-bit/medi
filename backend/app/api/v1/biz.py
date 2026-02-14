from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.application import (
    ApplicationDetailRead,
    ApplicationListResponse,
    ApplicationNoteCreate,
    ApplicationNoteRead,
    StatusChangeRequest,
)
from app.schemas.job import (
    JobListResponse,
    JobPostCreate,
    JobPostRead,
    JobPostUpdate,
)
from app.schemas.report import ReportCreate, ReportRead
from app.schemas.verification import VerificationRead, VerificationSubmit
from app.services import application_service, job_service, report_service, verification_service

router = APIRouter(prefix="/biz", tags=["biz"])


@router.get("")
async def dashboard(user: User = Depends(get_current_user)):
    return {"message": "기업 대시보드 - 추후 구현 예정"}


# --- Verification ---


@router.get("/verify", response_model=VerificationRead | None)
async def get_verification_status(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await verification_service.get_verification_status(db, user)


@router.post("/verify", response_model=VerificationRead)
async def submit_verification(
    data: VerificationSubmit,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await verification_service.submit_verification(db, user, data.file_key)


# --- Reports ---


@router.post("/reports", response_model=ReportRead)
async def submit_report(
    data: ReportCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await report_service.submit_report(
        db, user, data.target_type, data.target_id, data.reason_code, data.detail
    )


# --- Job CRUD ---


@router.get("/jobs", response_model=JobListResponse)
async def list_company_jobs(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
):
    return await job_service.get_company_jobs(db, user, page, size)


@router.post("/jobs", response_model=JobPostRead)
async def create_job(
    data: JobPostCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await job_service.create_job(db, user, data)


@router.patch("/jobs/{job_id}", response_model=JobPostRead)
async def update_job(
    job_id: UUID,
    data: JobPostUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await job_service.update_job(db, user, job_id, data)


@router.post("/jobs/{job_id}/publish", response_model=JobPostRead)
async def publish_job(
    job_id: UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await job_service.publish_job(db, user, job_id)


@router.post("/jobs/{job_id}/close", response_model=JobPostRead)
async def close_job(
    job_id: UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await job_service.close_job(db, user, job_id)


# --- ATS (Applicant Management) ---


@router.get("/applicants", response_model=ApplicationListResponse)
async def list_applicants(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    job_post_id: UUID | None = None,
    status: str | None = None,
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
):
    return await application_service.list_company_applicants(
        db, user, job_post_id, status, page, size
    )


@router.get("/applicants/{application_id}", response_model=ApplicationDetailRead)
async def get_applicant(
    application_id: UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await application_service.get_applicant_detail(db, user, application_id)


@router.patch("/applicants/{application_id}/status", response_model=ApplicationDetailRead)
async def change_applicant_status(
    application_id: UUID,
    data: StatusChangeRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await application_service.change_applicant_status(
        db, user, application_id, data.status, data.note
    )


@router.post("/applicants/{application_id}/notes", response_model=ApplicationNoteRead)
async def add_applicant_note(
    application_id: UUID,
    data: ApplicationNoteCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await application_service.add_applicant_note(
        db, user, application_id, data.note
    )


# --- Placeholders ---


@router.get("/talents")
async def search_talents(user: User = Depends(get_current_user)):
    return {"items": [], "message": "인재 검색 - 추후 구현 예정"}


@router.get("/scouts")
async def list_scouts(user: User = Depends(get_current_user)):
    return {"items": [], "message": "스카우트 목록 - 추후 구현 예정"}


@router.get("/billing")
async def billing(user: User = Depends(get_current_user)):
    return {"message": "결제/상품은 /billing/* 엔드포인트를 사용하세요"}
