import uuid

from fastapi import HTTPException
from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.enums import Role, VerificationStatus
from app.models.admin import AdminLog
from app.models.company import Company, CompanyUser, CompanyVerification
from app.models.user import User
from app.schemas.verification import VerificationRead


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


def _verification_to_read(
    v: CompanyVerification,
    company: Company | None = None,
) -> VerificationRead:
    return VerificationRead(
        id=str(v.id),
        company_id=str(v.company_id),
        company_name=company.name if company else None,
        company_business_no=company.business_no if company else None,
        status=v.status,
        file_key=v.file_key,
        reject_reason=v.reject_reason,
        reviewed_by=str(v.reviewed_by) if v.reviewed_by else None,
        created_at=v.created_at,
        updated_at=v.updated_at,
    )


async def get_verification_status(
    db: AsyncSession, user: User
) -> VerificationRead | None:
    """Get the latest verification for the user's company."""
    company = await _get_company_for_user(db, user)

    result = await db.execute(
        select(CompanyVerification)
        .where(CompanyVerification.company_id == company.id)
        .order_by(CompanyVerification.created_at.desc())
        .limit(1)
    )
    v = result.scalar_one_or_none()
    if not v:
        return None
    return _verification_to_read(v, company)


async def submit_verification(
    db: AsyncSession, user: User, file_key: str
) -> VerificationRead:
    """Submit a new verification request. Only allowed if no PENDING exists."""
    company = await _get_company_for_user(db, user)

    # Check for existing PENDING verification
    result = await db.execute(
        select(CompanyVerification).where(
            and_(
                CompanyVerification.company_id == company.id,
                CompanyVerification.status == VerificationStatus.PENDING.value,
            )
        )
    )
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=409, detail="이미 심사 중인 인증 요청이 있습니다"
        )

    # Check if already approved
    result = await db.execute(
        select(CompanyVerification).where(
            and_(
                CompanyVerification.company_id == company.id,
                CompanyVerification.status == VerificationStatus.APPROVED.value,
            )
        )
    )
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=409, detail="이미 인증이 완료된 기업입니다"
        )

    v = CompanyVerification(
        company_id=company.id,
        status=VerificationStatus.PENDING.value,
        file_key=file_key,
    )
    db.add(v)
    await db.flush()
    return _verification_to_read(v, company)


# --- Admin ---


async def list_pending_verifications(
    db: AsyncSession, status_filter: str | None = None, page: int = 1, size: int = 20
) -> dict:
    """List verifications for admin review."""
    filters = []
    if status_filter:
        filters.append(CompanyVerification.status == status_filter)
    else:
        filters.append(
            CompanyVerification.status == VerificationStatus.PENDING.value
        )

    where = and_(*filters) if filters else True

    count_q = (
        select(func.count()).select_from(CompanyVerification).where(where)
    )
    total = (await db.execute(count_q)).scalar() or 0

    q = (
        select(CompanyVerification)
        .where(where)
        .order_by(CompanyVerification.created_at.asc())
        .offset((page - 1) * size)
        .limit(size)
    )
    result = await db.execute(q)
    verifications = result.scalars().all()

    # Fetch companies
    company_ids = list({v.company_id for v in verifications})
    companies_map: dict[uuid.UUID, Company] = {}
    if company_ids:
        co_result = await db.execute(
            select(Company).where(Company.id.in_(company_ids))
        )
        for co in co_result.scalars().all():
            companies_map[co.id] = co

    items = [
        _verification_to_read(v, companies_map.get(v.company_id))
        for v in verifications
    ]
    return {"items": items, "total": total}


async def review_verification(
    db: AsyncSession,
    admin_user: User,
    verification_id: uuid.UUID,
    status: str,
    reject_reason: str | None = None,
) -> VerificationRead:
    """Approve or reject a verification."""
    result = await db.execute(
        select(CompanyVerification).where(CompanyVerification.id == verification_id)
    )
    v = result.scalar_one_or_none()
    if not v:
        raise HTTPException(status_code=404, detail="인증 요청을 찾을 수 없습니다")

    if v.status != VerificationStatus.PENDING.value:
        raise HTTPException(
            status_code=409, detail="이미 처리된 인증 요청입니다"
        )

    v.status = status
    v.reviewed_by = admin_user.id
    if status == VerificationStatus.REJECTED.value and reject_reason:
        v.reject_reason = reject_reason

    # If approved, upgrade company users to COMPANY_VERIFIED
    if status == VerificationStatus.APPROVED.value:
        cu_result = await db.execute(
            select(CompanyUser).where(CompanyUser.company_id == v.company_id)
        )
        company_users = cu_result.scalars().all()
        for cu in company_users:
            user_result = await db.execute(
                select(User).where(User.id == cu.user_id)
            )
            u = user_result.scalar_one_or_none()
            if u and u.role == Role.COMPANY_UNVERIFIED.value:
                u.role = Role.COMPANY_VERIFIED.value

    # Log admin action
    co_result = await db.execute(
        select(Company).where(Company.id == v.company_id)
    )
    company = co_result.scalar_one_or_none()

    admin_log = AdminLog(
        admin_user_id=admin_user.id,
        action=f"VERIFICATION_{status}",
        target_type="COMPANY_VERIFICATION",
        target_id=v.id,
        meta_json={"company_name": company.name if company else None},
    )
    db.add(admin_log)

    return _verification_to_read(v, company)
