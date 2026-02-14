import uuid

from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.company import Company
from app.models.interaction import Favorite
from app.models.job import JobPost
from app.models.user import User
from app.schemas.favorite import FavoriteRead


async def list_favorites(
    db: AsyncSession, user: User, page: int = 1, size: int = 20
) -> dict:
    count_q = (
        select(func.count())
        .select_from(Favorite)
        .where(Favorite.user_id == user.id)
    )
    total = (await db.execute(count_q)).scalar() or 0

    q = (
        select(Favorite)
        .where(Favorite.user_id == user.id)
        .order_by(Favorite.created_at.desc())
        .offset((page - 1) * size)
        .limit(size)
    )
    result = await db.execute(q)
    favorites = result.scalars().all()

    items = []
    for fav in favorites:
        job_result = await db.execute(
            select(JobPost).where(JobPost.id == fav.job_post_id)
        )
        job = job_result.scalar_one_or_none()
        if not job:
            continue

        co_result = await db.execute(
            select(Company.name).where(Company.id == job.company_id)
        )
        company_name = co_result.scalar() or ""

        items.append(
            FavoriteRead(
                id=str(fav.id),
                job_post_id=str(fav.job_post_id),
                job_title=job.title,
                company_name=company_name,
                location_code=job.location_code,
                close_at=str(job.close_at) if job.close_at else None,
                created_at=fav.created_at,
            )
        )

    return {"items": items, "total": total}


async def toggle_favorite(
    db: AsyncSession, user: User, job_post_id: str
) -> dict:
    jp_id = uuid.UUID(job_post_id)

    existing = await db.execute(
        select(Favorite).where(
            and_(
                Favorite.user_id == user.id,
                Favorite.job_post_id == jp_id,
            )
        )
    )
    fav = existing.scalar_one_or_none()

    if fav:
        await db.delete(fav)
        return {"favorited": False}
    else:
        new_fav = Favorite(user_id=user.id, job_post_id=jp_id)
        db.add(new_fav)
        return {"favorited": True}


async def is_favorited(
    db: AsyncSession, user_id: uuid.UUID, job_post_id: uuid.UUID
) -> bool:
    result = await db.execute(
        select(Favorite.id).where(
            and_(
                Favorite.user_id == user_id,
                Favorite.job_post_id == job_post_id,
            )
        )
    )
    return result.scalar_one_or_none() is not None
