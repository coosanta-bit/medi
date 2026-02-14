from datetime import datetime

from pydantic import BaseModel


class FavoriteRead(BaseModel):
    id: str
    job_post_id: str
    job_title: str
    company_name: str
    location_code: str | None = None
    close_at: str | None = None
    created_at: datetime


class FavoriteListResponse(BaseModel):
    items: list[FavoriteRead]
    total: int
