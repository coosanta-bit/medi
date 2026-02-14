from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.enums import Role, UserStatus, UserType
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.models.company import Company, CompanyUser
from app.models.user import User, UserProfile
from app.schemas.auth import LoginRequest, SignupRequest


async def signup(db: AsyncSession, data: SignupRequest) -> tuple[User, str, str]:
    existing = await db.execute(select(User).where(User.email == data.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="이미 등록된 이메일입니다")

    role = Role.PERSON if data.type == UserType.PERSON else Role.COMPANY_UNVERIFIED

    user = User(
        type=data.type.value,
        email=data.email,
        phone=data.phone,
        password_hash=hash_password(data.password),
        status=UserStatus.ACTIVE.value,
        role=role.value,
        agree_terms=data.agree_terms,
        agree_marketing=data.agree_marketing,
    )
    db.add(user)
    await db.flush()

    if data.type == UserType.PERSON:
        profile = UserProfile(user_id=user.id, name=data.name)
        db.add(profile)

    if data.type == UserType.COMPANY:
        if not data.business_no or not data.company_name:
            raise HTTPException(
                status_code=400,
                detail="기업 회원가입 시 사업자등록번호와 기업명은 필수입니다",
            )
        # Check duplicate business number
        existing_co = await db.execute(
            select(Company).where(Company.business_no == data.business_no)
        )
        if existing_co.scalar_one_or_none():
            raise HTTPException(status_code=409, detail="이미 등록된 사업자등록번호입니다")

        company = Company(business_no=data.business_no, name=data.company_name)
        db.add(company)
        await db.flush()
        company_user = CompanyUser(company_id=company.id, user_id=user.id, role="OWNER")
        db.add(company_user)

    access = create_access_token(user.id, role.value)
    refresh = create_refresh_token(user.id)
    return user, access, refresh


async def login(db: AsyncSession, data: LoginRequest) -> tuple[User, str, str]:
    result = await db.execute(select(User).where(User.email == data.email))
    user = result.scalar_one_or_none()
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="이메일 또는 비밀번호가 올바르지 않습니다")
    if user.status != UserStatus.ACTIVE.value:
        raise HTTPException(status_code=403, detail="비활성 계정입니다")

    access = create_access_token(user.id, user.role)
    refresh = create_refresh_token(user.id)
    return user, access, refresh


async def refresh_tokens(db: AsyncSession, refresh_token: str) -> tuple[str, str]:
    try:
        payload = decode_token(refresh_token)
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="유효하지 않은 토큰 유형입니다")
        user_id = UUID(payload["sub"])
    except Exception:
        raise HTTPException(status_code=401, detail="유효하지 않은 리프레시 토큰입니다")

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user or user.status != UserStatus.ACTIVE.value:
        raise HTTPException(status_code=401, detail="사용자를 찾을 수 없거나 비활성 상태입니다")

    access = create_access_token(user.id, user.role)
    new_refresh = create_refresh_token(user.id)
    return access, new_refresh
