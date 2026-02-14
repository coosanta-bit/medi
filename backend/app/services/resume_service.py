import uuid

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.resume import Resume, ResumeCareer, ResumeLicense
from app.models.user import User
from app.schemas.resume import (
    ResumeCreate,
    ResumeListResponse,
    ResumeRead,
    ResumeSummary,
    ResumeUpdate,
    ResumeLicenseRead,
    ResumeCareerRead,
)


def _license_to_read(lic: ResumeLicense) -> ResumeLicenseRead:
    return ResumeLicenseRead(
        id=str(lic.id),
        license_type=lic.license_type,
        issued_at=lic.issued_at,
        created_at=lic.created_at,
    )


def _career_to_read(car: ResumeCareer) -> ResumeCareerRead:
    return ResumeCareerRead(
        id=str(car.id),
        org_name=car.org_name,
        role=car.role,
        department=car.department,
        start_at=car.start_at,
        end_at=car.end_at,
        description=car.description,
        created_at=car.created_at,
    )


def _resume_to_read(resume: Resume) -> ResumeRead:
    return ResumeRead(
        id=str(resume.id),
        user_id=str(resume.user_id),
        title=resume.title,
        visibility=resume.visibility,
        desired_job=resume.desired_job,
        desired_region=resume.desired_region,
        desired_shift=resume.desired_shift,
        desired_salary_type=resume.desired_salary_type,
        desired_salary_min=resume.desired_salary_min,
        summary=resume.summary,
        is_experienced=resume.is_experienced,
        licenses=[_license_to_read(lic) for lic in resume.licenses],
        careers=[_career_to_read(car) for car in resume.careers],
        created_at=resume.created_at,
        updated_at=resume.updated_at,
    )


def _resume_to_summary(resume: Resume) -> ResumeSummary:
    return ResumeSummary(
        id=str(resume.id),
        title=resume.title,
        visibility=resume.visibility,
        desired_job=resume.desired_job,
        is_experienced=resume.is_experienced,
        created_at=resume.created_at,
        updated_at=resume.updated_at,
    )


async def _get_resume_owned(
    db: AsyncSession, user: User, resume_id: uuid.UUID
) -> Resume:
    result = await db.execute(
        select(Resume)
        .options(selectinload(Resume.licenses), selectinload(Resume.careers))
        .where(Resume.id == resume_id)
    )
    resume = result.scalar_one_or_none()
    if not resume:
        raise HTTPException(status_code=404, detail="이력서를 찾을 수 없습니다")
    if resume.user_id != user.id:
        raise HTTPException(status_code=403, detail="접근 권한이 없습니다")
    return resume


async def list_resumes(db: AsyncSession, user: User) -> ResumeListResponse:
    result = await db.execute(
        select(Resume)
        .where(Resume.user_id == user.id)
        .order_by(Resume.updated_at.desc())
    )
    resumes = result.scalars().all()
    return ResumeListResponse(items=[_resume_to_summary(r) for r in resumes])


async def create_resume(
    db: AsyncSession, user: User, data: ResumeCreate
) -> ResumeRead:
    resume = Resume(
        user_id=user.id,
        title=data.title,
        visibility=data.visibility,
        desired_job=data.desired_job,
        desired_region=data.desired_region,
        desired_shift=data.desired_shift,
        desired_salary_type=data.desired_salary_type,
        desired_salary_min=data.desired_salary_min,
        summary=data.summary,
        is_experienced=data.is_experienced,
    )
    db.add(resume)
    await db.flush()

    for lic_data in data.licenses:
        lic = ResumeLicense(
            resume_id=resume.id,
            license_type=lic_data.license_type,
            license_no_enc=lic_data.license_no_enc,
            issued_at=lic_data.issued_at,
        )
        db.add(lic)

    for car_data in data.careers:
        car = ResumeCareer(
            resume_id=resume.id,
            org_name=car_data.org_name,
            role=car_data.role,
            department=car_data.department,
            start_at=car_data.start_at,
            end_at=car_data.end_at,
            description=car_data.description,
        )
        db.add(car)

    await db.flush()

    # Reload with relationships
    return await get_resume(db, user, resume.id)


async def get_resume(
    db: AsyncSession, user: User, resume_id: uuid.UUID
) -> ResumeRead:
    resume = await _get_resume_owned(db, user, resume_id)
    return _resume_to_read(resume)


async def update_resume(
    db: AsyncSession, user: User, resume_id: uuid.UUID, data: ResumeUpdate
) -> ResumeRead:
    resume = await _get_resume_owned(db, user, resume_id)

    update_data = data.model_dump(exclude_unset=True)

    # Handle simple fields
    simple_fields = [
        "title", "desired_job", "desired_region", "desired_shift",
        "desired_salary_type", "desired_salary_min", "summary", "is_experienced",
    ]
    for field in simple_fields:
        if field in update_data:
            setattr(resume, field, update_data[field])

    # Replace licenses if provided
    if "licenses" in update_data and update_data["licenses"] is not None:
        for lic in resume.licenses:
            await db.delete(lic)
        for lic_data in data.licenses:
            lic = ResumeLicense(
                resume_id=resume.id,
                license_type=lic_data.license_type,
                license_no_enc=lic_data.license_no_enc,
                issued_at=lic_data.issued_at,
            )
            db.add(lic)

    # Replace careers if provided
    if "careers" in update_data and update_data["careers"] is not None:
        for car in resume.careers:
            await db.delete(car)
        for car_data in data.careers:
            car = ResumeCareer(
                resume_id=resume.id,
                org_name=car_data.org_name,
                role=car_data.role,
                department=car_data.department,
                start_at=car_data.start_at,
                end_at=car_data.end_at,
                description=car_data.description,
            )
            db.add(car)

    await db.flush()
    return await get_resume(db, user, resume.id)


async def update_visibility(
    db: AsyncSession, user: User, resume_id: uuid.UUID, visibility: str
) -> ResumeRead:
    resume = await _get_resume_owned(db, user, resume_id)
    resume.visibility = visibility
    await db.flush()
    return _resume_to_read(resume)
