from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.application import ApplicationDetailRead, ApplicationListResponse
from app.schemas.notification import NotificationListResponse
from app.schemas.resume import (
    ResumeCreate,
    ResumeListResponse,
    ResumeRead,
    ResumeUpdate,
    VisibilityUpdate,
)
from app.schemas.favorite import FavoriteListResponse
from app.services import application_service, favorite_service, notification_service, resume_service

router = APIRouter(prefix="/me", tags=["me"])


@router.get("")
async def get_me(user: User = Depends(get_current_user)):
    return {
        "id": str(user.id),
        "type": user.type,
        "email": user.email,
        "role": user.role,
    }


# --- Resumes ---


@router.get("/resumes", response_model=ResumeListResponse)
async def list_resumes(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await resume_service.list_resumes(db, user)


@router.post("/resumes", response_model=ResumeRead)
async def create_resume(
    data: ResumeCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await resume_service.create_resume(db, user, data)


@router.get("/resumes/{resume_id}", response_model=ResumeRead)
async def get_resume(
    resume_id: UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await resume_service.get_resume(db, user, resume_id)


@router.patch("/resumes/{resume_id}", response_model=ResumeRead)
async def update_resume(
    resume_id: UUID,
    data: ResumeUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await resume_service.update_resume(db, user, resume_id, data)


@router.post("/resumes/{resume_id}/visibility", response_model=ResumeRead)
async def update_visibility(
    resume_id: UUID,
    data: VisibilityUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await resume_service.update_visibility(db, user, resume_id, data.visibility)


# --- Applications ---


@router.get("/applications", response_model=ApplicationListResponse)
async def list_applications(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await application_service.list_my_applications(db, user)


@router.get("/applications/{application_id}", response_model=ApplicationDetailRead)
async def get_application(
    application_id: UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await application_service.get_my_application(db, user, application_id)


# --- Notifications ---


@router.get("/notifications", response_model=NotificationListResponse)
async def list_notifications(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    page: int = Query(1, ge=1),
    size: int = Query(30, ge=1, le=100),
):
    return await notification_service.list_notifications(db, user, page, size)


@router.patch("/notifications/{notification_id}/read")
async def mark_notification_read(
    notification_id: UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await notification_service.mark_read(db, user, notification_id)
    return {"ok": True}


@router.patch("/notifications/read-all")
async def mark_all_notifications_read(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    count = await notification_service.mark_all_read(db, user)
    return {"ok": True, "updated": count}


# --- Favorites ---


@router.get("/favorites", response_model=FavoriteListResponse)
async def list_favorites(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
):
    return await favorite_service.list_favorites(db, user, page, size)


@router.post("/favorites/{job_post_id}")
async def toggle_favorite(
    job_post_id: UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await favorite_service.toggle_favorite(db, user, str(job_post_id))


# --- Other placeholders ---


@router.get("/scouts")
async def list_received_scouts(user: User = Depends(get_current_user)):
    return {"items": [], "message": "수신 스카우트 - 추후 구현 예정"}
