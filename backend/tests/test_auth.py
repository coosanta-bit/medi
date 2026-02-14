import pytest
from httpx import AsyncClient

pytestmark = pytest.mark.asyncio


async def test_signup_person(client: AsyncClient):
    res = await client.post(
        "/api/v1/auth/signup",
        json={
            "type": "PERSON",
            "email": "signup_person@example.com",
            "password": "Test1234!",
            "agree_terms": True,
        },
    )
    assert res.status_code == 200
    data = res.json()
    assert data["user"]["type"] == "PERSON"
    assert data["user"]["email"] == "signup_person@example.com"
    assert "access_token" in data["tokens"]
    assert "refresh_token" in data["tokens"]


async def test_signup_company(client: AsyncClient):
    res = await client.post(
        "/api/v1/auth/signup",
        json={
            "type": "COMPANY",
            "email": "signup_company@example.com",
            "password": "Company1234!",
            "business_no": "9999999999",
            "company_name": "테스트의원",
            "agree_terms": True,
        },
    )
    assert res.status_code == 200
    data = res.json()
    assert data["user"]["type"] == "COMPANY"


async def test_signup_duplicate_email(client: AsyncClient):
    payload = {
        "type": "PERSON",
        "email": "dup@example.com",
        "password": "Test1234!",
        "agree_terms": True,
    }
    await client.post("/api/v1/auth/signup", json=payload)
    res = await client.post("/api/v1/auth/signup", json=payload)
    assert res.status_code == 409


async def test_signup_weak_password(client: AsyncClient):
    res = await client.post(
        "/api/v1/auth/signup",
        json={
            "type": "PERSON",
            "email": "weak@example.com",
            "password": "short",
            "agree_terms": True,
        },
    )
    assert res.status_code == 422


async def test_login_success(client: AsyncClient):
    # signup first
    await client.post(
        "/api/v1/auth/signup",
        json={
            "type": "PERSON",
            "email": "login_test@example.com",
            "password": "Login1234!",
            "agree_terms": True,
        },
    )
    res = await client.post(
        "/api/v1/auth/login",
        json={"email": "login_test@example.com", "password": "Login1234!"},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["user"]["email"] == "login_test@example.com"
    assert data["tokens"]["access_token"]


async def test_login_wrong_password(client: AsyncClient):
    await client.post(
        "/api/v1/auth/signup",
        json={
            "type": "PERSON",
            "email": "wrong_pw@example.com",
            "password": "Correct1234!",
            "agree_terms": True,
        },
    )
    res = await client.post(
        "/api/v1/auth/login",
        json={"email": "wrong_pw@example.com", "password": "WrongPass1!"},
    )
    assert res.status_code == 401


async def test_login_nonexistent_user(client: AsyncClient):
    res = await client.post(
        "/api/v1/auth/login",
        json={"email": "nobody@example.com", "password": "NoUser1234!"},
    )
    assert res.status_code == 401


async def test_refresh_token(client: AsyncClient):
    signup = await client.post(
        "/api/v1/auth/signup",
        json={
            "type": "PERSON",
            "email": "refresh_test@example.com",
            "password": "Refresh1234!",
            "agree_terms": True,
        },
    )
    tokens = signup.json()["tokens"]

    res = await client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": tokens["refresh_token"]},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["access_token"]
    assert data["refresh_token"]


async def test_refresh_invalid_token(client: AsyncClient):
    res = await client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": "invalid.token.here"},
    )
    assert res.status_code == 401


async def test_logout(client: AsyncClient):
    res = await client.post("/api/v1/auth/logout")
    assert res.status_code == 200
    assert res.json()["ok"] is True
