export const ROUTES = {
  HOME: "/",
  JOBS: "/jobs",
  JOB_DETAIL: (id: string) => `/jobs/${id}`,
  LOGIN: "/auth/login",
  SIGNUP: "/auth/signup",
  ME: "/me",
  ME_RESUME: "/me/resume",
  ME_APPLICATIONS: "/me/applications",
  ME_FAVORITES: "/me/favorites",
  ME_NOTIFICATIONS: "/me/notifications",
  BIZ: "/biz",
  BIZ_VERIFY: "/biz/verify",
  BIZ_JOBS: "/biz/jobs",
  BIZ_JOBS_NEW: "/biz/jobs/new",
  BIZ_APPLICANTS: "/biz/applicants",
  BIZ_TALENTS: "/biz/talents",
  BIZ_SCOUTS: "/biz/scouts",
  BIZ_BILLING: "/biz/billing",
  ADMIN: "/admin",
  HELP: "/help",
} as const;

export const JOB_CATEGORIES = [
  { value: "NURSE", label: "간호사" },
  { value: "NURSE_AIDE", label: "간호조무사" },
  { value: "DENTAL_HYGIENIST", label: "치위생사" },
  { value: "PHYSICAL_THERAPIST", label: "물리치료사" },
  { value: "OCCUPATIONAL_THERAPIST", label: "작업치료사" },
  { value: "RADIOGRAPHER", label: "방사선사" },
  { value: "CLINICAL_LAB", label: "임상병리사" },
  { value: "PHARMACIST", label: "약사" },
  { value: "MEDICAL_ADMIN", label: "원무과" },
  { value: "COORDINATOR", label: "코디네이터" },
  { value: "OTHER", label: "기타" },
] as const;

export const REGIONS = [
  { value: "11", label: "서울" },
  { value: "26", label: "부산" },
  { value: "27", label: "대구" },
  { value: "28", label: "인천" },
  { value: "29", label: "광주" },
  { value: "30", label: "대전" },
  { value: "31", label: "울산" },
  { value: "36", label: "세종" },
  { value: "41", label: "경기" },
  { value: "42", label: "강원" },
  { value: "43", label: "충북" },
  { value: "44", label: "충남" },
  { value: "45", label: "전북" },
  { value: "46", label: "전남" },
  { value: "47", label: "경북" },
  { value: "48", label: "경남" },
  { value: "50", label: "제주" },
] as const;

export const SHIFT_TYPES = [
  { value: "DAY", label: "주간" },
  { value: "2SHIFT", label: "2교대" },
  { value: "3SHIFT", label: "3교대" },
  { value: "KEEP", label: "킵(KEEP)" },
  { value: "OTHER", label: "기타" },
] as const;

export const EMPLOYMENT_TYPES = [
  { value: "FULL_TIME", label: "정규직" },
  { value: "PART_TIME", label: "파트타임" },
  { value: "CONTRACT", label: "계약직" },
  { value: "INTERN", label: "인턴" },
  { value: "OTHER", label: "기타" },
] as const;

export const SALARY_TYPES = [
  { value: "ANNUAL", label: "연봉" },
  { value: "MONTHLY", label: "월급" },
  { value: "HOURLY", label: "시급" },
  { value: "NEGOTIABLE", label: "협의" },
] as const;

export const RESUME_VISIBILITY = [
  { value: "PUBLIC", label: "공개" },
  { value: "PRIVATE", label: "비공개" },
  { value: "ONLY_APPLIED", label: "지원기업만 공개" },
] as const;

export const APPLICATION_STATUSES = [
  { value: "RECEIVED", label: "접수" },
  { value: "REVIEWING", label: "검토중" },
  { value: "INTERVIEW", label: "면접" },
  { value: "OFFERED", label: "제안" },
  { value: "HIRED", label: "채용" },
  { value: "REJECTED", label: "불합격" },
  { value: "ON_HOLD", label: "보류" },
] as const;

export const VERIFICATION_STATUSES = [
  { value: "PENDING", label: "심사중" },
  { value: "APPROVED", label: "승인" },
  { value: "REJECTED", label: "반려" },
] as const;

export const REPORT_STATUSES = [
  { value: "PENDING", label: "대기" },
  { value: "PROCESSED", label: "처리완료" },
] as const;

export const USER_STATUSES = [
  { value: "ACTIVE", label: "활성" },
  { value: "SUSPENDED", label: "정지" },
  { value: "DELETED", label: "탈퇴" },
  { value: "DORMANT", label: "휴면" },
] as const;

export const USER_TYPES = [
  { value: "PERSON", label: "개인" },
  { value: "COMPANY", label: "기업" },
] as const;

export const ORDER_STATUSES = [
  { value: "CREATED", label: "생성" },
  { value: "PAID", label: "결제완료" },
  { value: "CANCELLED", label: "취소" },
  { value: "REFUND_REQUESTED", label: "환불요청" },
  { value: "REFUNDED", label: "환불완료" },
] as const;

export const PAYMENT_STATUSES = [
  { value: "PENDING", label: "대기" },
  { value: "PAID", label: "결제완료" },
  { value: "FAILED", label: "실패" },
  { value: "CANCELLED", label: "취소" },
  { value: "REFUNDED", label: "환불" },
] as const;

export const PRODUCT_TYPES = [
  { value: "BOOST", label: "상단노출" },
  { value: "CREDIT", label: "열람권" },
] as const;

export const SORT_OPTIONS = [
  { value: "LATEST", label: "최신순" },
  { value: "CLOSING_SOON", label: "마감임박순" },
  { value: "SALARY_DESC", label: "급여높은순" },
  { value: "VIEWS", label: "조회순" },
] as const;

export function getLabel(
  list: readonly { value: string; label: string }[],
  value: string | null | undefined
): string {
  if (!value) return "-";
  return list.find((item) => item.value === value)?.label ?? value;
}

export function formatSalary(
  type: string | null,
  min: number | null,
  max: number | null
): string {
  if (!type || type === "NEGOTIABLE") return "급여 협의";
  const unit = type === "ANNUAL" ? "만원" : type === "HOURLY" ? "원" : "만원";
  const divider = type === "HOURLY" ? 1 : 10000;
  const minVal = min ? Math.round(min / divider) : null;
  const maxVal = max ? Math.round(max / divider) : null;
  const typeLabel = getLabel(SALARY_TYPES, type);
  if (minVal && maxVal) return `${typeLabel} ${minVal.toLocaleString()}~${maxVal.toLocaleString()}${unit}`;
  if (minVal) return `${typeLabel} ${minVal.toLocaleString()}${unit}~`;
  if (maxVal) return `${typeLabel} ~${maxVal.toLocaleString()}${unit}`;
  return typeLabel;
}
