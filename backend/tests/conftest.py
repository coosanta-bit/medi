from collections.abc import AsyncGenerator

import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import get_settings
from app.core.rate_limit import limiter
from app.db.session import get_db
from app.main import app
from app.models.base import Base

# Disable rate limiting in tests
limiter.enabled = False

settings = get_settings()

# These will be initialized in setup_db fixture (same event loop as tests)
_test_engine = None
_test_session_factory = None


@pytest_asyncio.fixture(scope="session", autouse=True)
async def setup_db():
    global _test_engine, _test_session_factory

    _test_engine = create_async_engine(
        settings.DATABASE_URL,
        echo=False,
        pool_size=5,
        max_overflow=0,
    )
    _test_session_factory = async_sessionmaker(
        _test_engine, class_=AsyncSession, expire_on_commit=False
    )

    async def override_get_db() -> AsyncGenerator[AsyncSession, None]:
        async with _test_session_factory() as session:
            try:
                yield session
                await session.commit()
            except Exception:
                await session.rollback()
                raise

    app.dependency_overrides[get_db] = override_get_db

    async with _test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    yield

    async with _test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await _test_engine.dispose()


@pytest_asyncio.fixture
async def client() -> AsyncGenerator[AsyncClient, None]:
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest_asyncio.fixture
async def db() -> AsyncGenerator[AsyncSession, None]:
    async with _test_session_factory() as session:
        yield session


# --- helpers ---

TEST_PERSON = {
    "type": "PERSON",
    "email": "testuser@example.com",
    "password": "Test1234!",
    "agree_terms": True,
}

TEST_COMPANY = {
    "type": "COMPANY",
    "email": "company@example.com",
    "password": "Company1234!",
    "business_no": "1234567890",
    "company_name": "테스트병원",
    "agree_terms": True,
}


@pytest_asyncio.fixture
async def person_tokens(client: AsyncClient) -> dict:
    res = await client.post("/api/v1/auth/signup", json=TEST_PERSON)
    if res.status_code == 409:
        res = await client.post(
            "/api/v1/auth/login",
            json={"email": TEST_PERSON["email"], "password": TEST_PERSON["password"]},
        )
    return res.json()["tokens"]


@pytest_asyncio.fixture
async def company_tokens(client: AsyncClient) -> dict:
    res = await client.post("/api/v1/auth/signup", json=TEST_COMPANY)
    if res.status_code == 409:
        res = await client.post(
            "/api/v1/auth/login",
            json={"email": TEST_COMPANY["email"], "password": TEST_COMPANY["password"]},
        )
    return res.json()["tokens"]


def auth_header(tokens: dict) -> dict:
    return {"Authorization": f"Bearer {tokens['access_token']}"}
