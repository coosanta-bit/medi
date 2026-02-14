"""
시드 데이터 생성 스크립트
실행: cd backend && source .venv/bin/activate && python -m scripts.seed
"""

import asyncio
import uuid
from datetime import date, datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.enums import (
    ApplicationStatus,
    EmploymentType,
    JobPostStatus,
    OrderStatus,
    PaymentStatus,
    Role,
    ShiftType,
    UserStatus,
    UserType,
    VerificationStatus,
)
from app.core.security import hash_password
from app.db.session import async_session
from app.models.admin import AdminLog
from app.models.application import Application, ApplicationStatusHistory
from app.models.company import Company, CompanyUser, CompanyVerification
from app.models.job import JobPost
from app.models.notification import Notification
from app.models.payment import Entitlement, Product
from app.models.user import User, UserProfile


async def seed():
    async with async_session() as db:
        # Check if already seeded
        result = await db.execute(select(User).limit(1))
        existing = result.scalars().all()
        # 이미 test@example.com 외의 시드 유저가 있으면 skip
        result2 = await db.execute(
            select(User).where(User.email == "admin@medifordoc.com")
        )
        if result2.scalar_one_or_none():
            print("시드 데이터가 이미 존재합니다. 건너뜁니다.")
            return

        now = datetime.now(timezone.utc)
        pw = hash_password("Password1")

        # ============================================================
        # 1. 관리자 계정
        # ============================================================
        admin = User(
            type=UserType.PERSON.value,
            email="admin@medifordoc.com",
            password_hash=pw,
            status=UserStatus.ACTIVE.value,
            role=Role.ADMIN.value,
            agree_terms=True,
        )
        db.add(admin)
        await db.flush()

        admin_profile = UserProfile(
            user_id=admin.id,
            name="관리자",
        )
        db.add(admin_profile)

        print(f"[관리자] admin@medifordoc.com / Password1  (role: ADMIN)")

        # ============================================================
        # 2. 개인 회원 (구직자)
        # ============================================================
        person = User(
            type=UserType.PERSON.value,
            email="nurse@example.com",
            phone="010-1234-5678",
            password_hash=pw,
            status=UserStatus.ACTIVE.value,
            role=Role.PERSON.value,
            agree_terms=True,
        )
        db.add(person)
        await db.flush()

        person_profile = UserProfile(
            user_id=person.id,
            name="김간호",
            birth_year=1995,
            region_code="11",
        )
        db.add(person_profile)

        print(f"[구직자] nurse@example.com / Password1  (role: PERSON)")

        # ============================================================
        # 3. 기업 계정 (인증 완료)
        # ============================================================
        company_user = User(
            type=UserType.COMPANY.value,
            email="biz@example.com",
            phone="02-1234-5678",
            password_hash=pw,
            status=UserStatus.ACTIVE.value,
            role=Role.COMPANY_VERIFIED.value,
            agree_terms=True,
        )
        db.add(company_user)
        await db.flush()

        company = Company(
            business_no="123-45-67890",
            name="서울중앙병원",
            type="종합병원",
            address="서울시 강남구 테헤란로 123",
            status=UserStatus.ACTIVE.value,
        )
        db.add(company)
        await db.flush()

        cu = CompanyUser(
            company_id=company.id,
            user_id=company_user.id,
            role="OWNER",
        )
        db.add(cu)

        verification = CompanyVerification(
            company_id=company.id,
            status=VerificationStatus.APPROVED.value,
            file_key="seed/business_license_123.pdf",
            reviewed_by=admin.id,
        )
        db.add(verification)

        print(f"[기업] biz@example.com / Password1  (기업: 서울중앙병원, VERIFIED)")

        # ============================================================
        # 4. 기업 계정 2 (미인증)
        # ============================================================
        company_user2 = User(
            type=UserType.COMPANY.value,
            email="biz2@example.com",
            password_hash=pw,
            status=UserStatus.ACTIVE.value,
            role=Role.COMPANY_UNVERIFIED.value,
            agree_terms=True,
        )
        db.add(company_user2)
        await db.flush()

        company2 = Company(
            business_no="987-65-43210",
            name="강남피부과의원",
            type="피부과",
            address="서울시 강남구 논현동 456",
            status=UserStatus.ACTIVE.value,
        )
        db.add(company2)
        await db.flush()

        cu2 = CompanyUser(
            company_id=company2.id,
            user_id=company_user2.id,
            role="OWNER",
        )
        db.add(cu2)

        # 인증 대기 중
        verification2 = CompanyVerification(
            company_id=company2.id,
            status=VerificationStatus.PENDING.value,
            file_key="seed/business_license_987.pdf",
        )
        db.add(verification2)

        print(f"[기업] biz2@example.com / Password1  (기업: 강남피부과의원, 인증대기)")

        # ============================================================
        # 5. 공고 (서울중앙병원 - 5개)
        # ============================================================
        jobs_data = [
            {
                "title": "[서울중앙병원] 간호사 경력직 채용",
                "body": "서울중앙병원에서 경력 간호사를 모집합니다.\n\n■ 담당업무\n- 병동 환자 간호\n- 투약 및 주사\n- 환자 상태 모니터링\n\n■ 자격요건\n- 간호사 면허 소지자\n- 경력 3년 이상\n- 3교대 근무 가능자",
                "job_category": "NURSE",
                "department": "내과 병동",
                "employment_type": EmploymentType.FULL_TIME.value,
                "shift_type": ShiftType.THREE_SHIFT.value,
                "salary_type": "ANNUAL",
                "salary_min": 40000000,
                "salary_max": 55000000,
                "location_code": "11",
                "location_detail": "서울시 강남구 테헤란로 123",
                "contact_name": "인사팀 김채용",
                "contact_visible": True,
                "close_at": date.today() + timedelta(days=30),
            },
            {
                "title": "[서울중앙병원] 간호조무사 신입/경력",
                "body": "서울중앙병원 외래에서 근무할 간호조무사를 모집합니다.\n\n■ 근무시간: 주간 (09:00~18:00)\n■ 급여: 월 250~300만원\n■ 복리후생: 4대보험, 식대, 교통비 지원",
                "job_category": "NURSE_AIDE",
                "department": "외래",
                "employment_type": EmploymentType.FULL_TIME.value,
                "shift_type": ShiftType.DAY.value,
                "salary_type": "MONTHLY",
                "salary_min": 2500000,
                "salary_max": 3000000,
                "location_code": "11",
                "location_detail": "서울시 강남구 테헤란로 123",
                "contact_name": "인사팀",
                "contact_visible": True,
                "close_at": date.today() + timedelta(days=20),
            },
            {
                "title": "[서울중앙병원] 물리치료사 채용",
                "body": "재활의학과 물리치료사를 모집합니다.\n\n■ 자격: 물리치료사 면허\n■ 우대: 도수치료 가능자\n■ 근무: 주간 고정",
                "job_category": "PHYSICAL_THERAPIST",
                "department": "재활의학과",
                "employment_type": EmploymentType.FULL_TIME.value,
                "shift_type": ShiftType.DAY.value,
                "salary_type": "ANNUAL",
                "salary_min": 35000000,
                "salary_max": 50000000,
                "location_code": "11",
                "location_detail": "서울시 강남구 테헤란로 123",
                "close_at": date.today() + timedelta(days=45),
            },
            {
                "title": "[서울중앙병원] 방사선사 모집",
                "body": "영상의학과 방사선사를 모집합니다.\n\nCT/MRI 촬영 경험자 우대\n2교대 근무",
                "job_category": "RADIOGRAPHER",
                "department": "영상의학과",
                "employment_type": EmploymentType.FULL_TIME.value,
                "shift_type": ShiftType.TWO_SHIFT.value,
                "salary_type": "ANNUAL",
                "salary_min": 38000000,
                "salary_max": 52000000,
                "location_code": "11",
                "close_at": date.today() + timedelta(days=15),
            },
            {
                "title": "[서울중앙병원] 원무과 파트타임 모집",
                "body": "원무과 접수 파트타임 직원을 모집합니다.\n\n근무시간: 월~금 09:00~14:00\n시급 12,000원",
                "job_category": "MEDICAL_ADMIN",
                "department": "원무과",
                "employment_type": EmploymentType.PART_TIME.value,
                "shift_type": ShiftType.DAY.value,
                "salary_type": "HOURLY",
                "salary_min": 12000,
                "salary_max": 12000,
                "location_code": "11",
                "close_at": date.today() + timedelta(days=10),
            },
        ]

        created_jobs = []
        for jd in jobs_data:
            job = JobPost(
                company_id=company.id,
                status=JobPostStatus.PUBLISHED.value,
                published_at=now - timedelta(days=3),
                view_count=50 + hash(jd["title"]) % 200,
                **jd,
            )
            db.add(job)
            await db.flush()
            created_jobs.append(job)
            print(f"  [공고] {jd['title']}")

        # ============================================================
        # 6. 지원 (구직자 → 간호사 공고)
        # ============================================================
        application = Application(
            job_post_id=created_jobs[0].id,
            applicant_user_id=person.id,
            status=ApplicationStatus.RECEIVED.value,
        )
        db.add(application)
        await db.flush()

        app_history = ApplicationStatusHistory(
            application_id=application.id,
            to_status=ApplicationStatus.RECEIVED.value,
        )
        db.add(app_history)

        # 알림 (기업에게)
        notif = Notification(
            user_id=company_user.id,
            type="APPLICATION_RECEIVED",
            channel="IN_APP",
            payload_json={
                "job_title": created_jobs[0].title,
                "applicant_name": "김간호",
            },
            status="SENT",
            sent_at=now,
        )
        db.add(notif)

        print(f"  [지원] 김간호 → {created_jobs[0].title}")

        # ============================================================
        # 7. 상품 (BOOST + CREDIT)
        # ============================================================
        products = [
            Product(
                type="BOOST",
                name="공고 상단노출 7일",
                price=99000,
                config_json={"days": 7},
            ),
            Product(
                type="BOOST",
                name="공고 상단노출 14일",
                price=179000,
                config_json={"days": 14},
            ),
            Product(
                type="CREDIT",
                name="인재 열람권 10회",
                price=49000,
                config_json={"credits": 10},
            ),
            Product(
                type="CREDIT",
                name="인재 열람권 30회",
                price=129000,
                config_json={"credits": 30},
            ),
            Product(
                type="CREDIT",
                name="인재 열람권 100회",
                price=390000,
                config_json={"credits": 100},
            ),
        ]
        for p in products:
            db.add(p)
            print(f"  [상품] {p.name} - {p.price:,}원")

        # ============================================================
        # 8. 관리 로그 (시드 생성 기록)
        # ============================================================
        log = AdminLog(
            admin_user_id=admin.id,
            action="SEED_DATA",
            target_type="SYSTEM",
            meta_json={"message": "시드 데이터 생성"},
        )
        db.add(log)

        await db.commit()

        print("\n" + "=" * 50)
        print("시드 데이터 생성 완료!")
        print("=" * 50)
        print("\n계정 정보 (비밀번호: 모두 Password1)")
        print("-" * 50)
        print("관리자:  admin@medifordoc.com  (ADMIN)")
        print("구직자:  nurse@example.com     (PERSON)")
        print("기업1:   biz@example.com       (COMPANY_VERIFIED, 서울중앙병원)")
        print("기업2:   biz2@example.com      (COMPANY_UNVERIFIED, 강남피부과의원)")
        print(f"\n공고 {len(created_jobs)}건, 상품 {len(products)}건, 지원 1건 생성")


if __name__ == "__main__":
    asyncio.run(seed())
