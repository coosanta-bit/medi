from fastapi import APIRouter

from app.api.v1 import admin, auth, billing, biz, jobs, me

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(auth.router)
api_router.include_router(jobs.router)
api_router.include_router(me.router)
api_router.include_router(biz.router)
api_router.include_router(admin.router)
api_router.include_router(billing.router)
