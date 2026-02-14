from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.schemas.auth import (
    AuthResponse,
    LoginRequest,
    RefreshRequest,
    SignupRequest,
    TokenResponse,
    UserResponse,
)
from app.services import auth_service

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/signup", response_model=AuthResponse)
async def signup(data: SignupRequest, db: AsyncSession = Depends(get_db)):
    user, access, refresh = await auth_service.signup(db, data)
    return AuthResponse(
        user=UserResponse(
            id=str(user.id),
            type=user.type,
            email=user.email,
            role=user.role,
        ),
        tokens=TokenResponse(access_token=access, refresh_token=refresh),
    )


@router.post("/login", response_model=AuthResponse)
async def login(data: LoginRequest, db: AsyncSession = Depends(get_db)):
    user, access, refresh = await auth_service.login(db, data)
    return AuthResponse(
        user=UserResponse(
            id=str(user.id),
            type=user.type,
            email=user.email,
            role=user.role,
        ),
        tokens=TokenResponse(access_token=access, refresh_token=refresh),
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh(data: RefreshRequest, db: AsyncSession = Depends(get_db)):
    access, new_refresh = await auth_service.refresh_tokens(db, data.refresh_token)
    return TokenResponse(access_token=access, refresh_token=new_refresh)


@router.post("/logout")
async def logout():
    return {"ok": True}
