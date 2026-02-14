import pytest
from httpx import AsyncClient

from tests.conftest import auth_header

pytestmark = pytest.mark.asyncio


async def test_list_jobs(client: AsyncClient):
    res = await client.get("/api/v1/jobs")
    assert res.status_code == 200
    data = res.json()
    assert "items" in data
    assert "total" in data
    assert "page" in data
    assert isinstance(data["items"], list)


async def test_list_jobs_pagination(client: AsyncClient):
    res = await client.get("/api/v1/jobs", params={"page": 1, "size": 5})
    assert res.status_code == 200
    data = res.json()
    assert data["page"] == 1
    assert len(data["items"]) <= 5


async def test_list_jobs_filter_keyword(client: AsyncClient):
    res = await client.get("/api/v1/jobs", params={"keyword": "간호"})
    assert res.status_code == 200


async def test_list_jobs_filter_employment_type(client: AsyncClient):
    res = await client.get("/api/v1/jobs", params={"employment_type": "FULL_TIME"})
    assert res.status_code == 200


async def test_list_jobs_sort(client: AsyncClient):
    res = await client.get("/api/v1/jobs", params={"sort": "SALARY_DESC"})
    assert res.status_code == 200


async def test_get_job_detail(client: AsyncClient):
    # get a job id from list first
    list_res = await client.get("/api/v1/jobs", params={"size": 1})
    items = list_res.json()["items"]
    if not items:
        pytest.skip("No job posts in database")
    job_id = items[0]["id"]

    res = await client.get(f"/api/v1/jobs/{job_id}")
    assert res.status_code == 200
    data = res.json()
    assert data["id"] == job_id
    assert "title" in data
    assert "company_name" in data


async def test_get_job_not_found(client: AsyncClient):
    fake_id = "00000000-0000-0000-0000-000000000000"
    res = await client.get(f"/api/v1/jobs/{fake_id}")
    assert res.status_code == 404


async def test_apply_unauthenticated(client: AsyncClient):
    list_res = await client.get("/api/v1/jobs", params={"size": 1})
    items = list_res.json()["items"]
    if not items:
        pytest.skip("No job posts in database")
    job_id = items[0]["id"]

    res = await client.post(f"/api/v1/jobs/{job_id}/apply", json={"resume_id": None})
    assert res.status_code in (401, 403)


async def test_health(client: AsyncClient):
    res = await client.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "ok"
