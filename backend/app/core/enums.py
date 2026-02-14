import enum


class UserType(str, enum.Enum):
    PERSON = "PERSON"
    COMPANY = "COMPANY"


class UserStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    SUSPENDED = "SUSPENDED"
    DELETED = "DELETED"
    DORMANT = "DORMANT"


class Role(str, enum.Enum):
    GUEST = "GUEST"
    PERSON = "PERSON"
    COMPANY_UNVERIFIED = "COMPANY_UNVERIFIED"
    COMPANY_VERIFIED = "COMPANY_VERIFIED"
    ADMIN = "ADMIN"
    CS = "CS"
    SALES = "SALES"


class VerificationStatus(str, enum.Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"


class JobPostStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    PUBLISHED = "PUBLISHED"
    CLOSED = "CLOSED"
    BLINDED = "BLINDED"
    EXPIRED = "EXPIRED"


class ShiftType(str, enum.Enum):
    DAY = "DAY"
    TWO_SHIFT = "2SHIFT"
    THREE_SHIFT = "3SHIFT"
    KEEP = "KEEP"
    OTHER = "OTHER"


class SalaryType(str, enum.Enum):
    ANNUAL = "ANNUAL"
    MONTHLY = "MONTHLY"
    HOURLY = "HOURLY"
    NEGOTIABLE = "NEGOTIABLE"


class EmploymentType(str, enum.Enum):
    FULL_TIME = "FULL_TIME"
    PART_TIME = "PART_TIME"
    CONTRACT = "CONTRACT"
    INTERN = "INTERN"
    OTHER = "OTHER"


class ApplicationStatus(str, enum.Enum):
    RECEIVED = "RECEIVED"
    REVIEWING = "REVIEWING"
    INTERVIEW = "INTERVIEW"
    OFFERED = "OFFERED"
    HIRED = "HIRED"
    REJECTED = "REJECTED"
    ON_HOLD = "ON_HOLD"


class ScoutStatus(str, enum.Enum):
    SENT = "SENT"
    VIEWED = "VIEWED"
    ACCEPTED = "ACCEPTED"
    REJECTED = "REJECTED"
    HOLD = "HOLD"


class ResumeVisibility(str, enum.Enum):
    PUBLIC = "PUBLIC"
    PRIVATE = "PRIVATE"
    ONLY_APPLIED = "ONLY_APPLIED"


class NotificationType(str, enum.Enum):
    SYSTEM = "SYSTEM"
    MARKETING = "MARKETING"


class NotificationChannel(str, enum.Enum):
    EMAIL = "EMAIL"
    SMS = "SMS"
    PUSH = "PUSH"


class PaymentStatus(str, enum.Enum):
    PENDING = "PENDING"
    PAID = "PAID"
    FAILED = "FAILED"
    CANCELLED = "CANCELLED"
    REFUNDED = "REFUNDED"


class OrderStatus(str, enum.Enum):
    CREATED = "CREATED"
    PAID = "PAID"
    CANCELLED = "CANCELLED"
    REFUND_REQUESTED = "REFUND_REQUESTED"
    REFUNDED = "REFUNDED"
