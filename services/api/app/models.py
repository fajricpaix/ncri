import enum
import uuid
from datetime import date, datetime

from geoalchemy2 import Geometry
from sqlalchemy import (Boolean, Date, DateTime, Enum, ForeignKey, Integer,
                        Numeric, String, Text, UniqueConstraint, func)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base


class Role(str, enum.Enum):
    ADMIN = "ADMIN"
    ANALYST = "ANALYST"
    REVIEWER = "REVIEWER"
    VIEWER = "VIEWER"


class Origin(str, enum.Enum):
    PUBLIC = "PUBLIC"
    SIMULATED = "SIMULATED"
    PARTNER = "PARTNER"


class Verification(str, enum.Enum):
    UNVERIFIED = "UNVERIFIED"
    VERIFIED = "VERIFIED"
    REJECTED = "REJECTED"


class RegionLevel(str, enum.Enum):
    PROVINCE = "PROVINCE"
    REGENCY = "REGENCY"
    DISTRICT = "DISTRICT"
    VILLAGE = "VILLAGE"


class SourceType(str, enum.Enum):
    GOVERNMENT = "GOVERNMENT"
    COMMUNITY = "COMMUNITY"
    SURVEY = "SURVEY"
    PUBLIC_DATA = "PUBLIC_DATA"
    MANUAL = "MANUAL"


class ImportStatus(str, enum.Enum):
    PENDING = "PENDING"
    PROCESSING = "PROCESSING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"


class Direction(str, enum.Enum):
    LOWER_IS_WORSE = "LOWER_IS_WORSE"
    HIGHER_IS_WORSE = "HIGHER_IS_WORSE"
    TARGET_RANGE = "TARGET_RANGE"


class Availability(str, enum.Enum):
    AVAILABLE = "AVAILABLE"
    PARTIAL = "PARTIAL"
    NOT_AVAILABLE = "NOT_AVAILABLE"


def _pk():
    return mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)


def _ts():
    return mapped_column(DateTime(timezone=True), server_default=func.now())


class Region(Base):
    __tablename__ = "regions"
    id: Mapped[uuid.UUID] = _pk()
    code: Mapped[str] = mapped_column(String, unique=True)
    name: Mapped[str] = mapped_column(String)
    level: Mapped[RegionLevel] = mapped_column(Enum(RegionLevel))
    parent_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("regions.id"))
    geometry = mapped_column(Geometry("MULTIPOLYGON", srid=4326), nullable=True)
    created_at: Mapped[datetime] = _ts()


class DataSource(Base):
    __tablename__ = "data_sources"
    id: Mapped[uuid.UUID] = _pk()
    code: Mapped[str] = mapped_column(String, unique=True)  # dipakai kolom source_code di CSV
    name: Mapped[str] = mapped_column(String)
    source_type: Mapped[SourceType] = mapped_column(Enum(SourceType))
    description: Mapped[str | None] = mapped_column(Text)
    access_method: Mapped[str | None] = mapped_column(String)
    terms_url: Mapped[str | None] = mapped_column(Text)
    license_notes: Mapped[str | None] = mapped_column(Text)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = _ts()


class CulturalObject(Base):
    __tablename__ = "cultural_objects"
    id: Mapped[uuid.UUID] = _pk()
    external_code: Mapped[str | None] = mapped_column(String, unique=True)
    name: Mapped[str] = mapped_column(String)
    category: Mapped[str] = mapped_column(String)
    description: Mapped[str | None] = mapped_column(Text)
    region_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("regions.id"))
    latitude: Mapped[float | None] = mapped_column(Numeric)
    longitude: Mapped[float | None] = mapped_column(Numeric)
    inventory_status: Mapped[str | None] = mapped_column(String)
    verification_status: Mapped[Verification] = mapped_column(Enum(Verification), default=Verification.UNVERIFIED)
    data_origin: Mapped[Origin] = mapped_column(Enum(Origin))
    source_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("data_sources.id"))
    created_at: Mapped[datetime] = _ts()
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    region: Mapped[Region | None] = relationship()


class Indicator(Base):
    __tablename__ = "indicators"
    id: Mapped[uuid.UUID] = _pk()
    code: Mapped[str] = mapped_column(String, unique=True)
    name: Mapped[str] = mapped_column(String)
    description: Mapped[str] = mapped_column(Text)
    unit: Mapped[str | None] = mapped_column(String)
    direction: Mapped[Direction] = mapped_column(Enum(Direction))
    default_weight: Mapped[float] = mapped_column(Numeric)
    availability: Mapped[Availability] = mapped_column(Enum(Availability), default=Availability.PARTIAL)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)


class DataImportJob(Base):
    __tablename__ = "data_import_jobs"
    id: Mapped[uuid.UUID] = _pk()
    file_name: Mapped[str | None] = mapped_column(String)
    status: Mapped[ImportStatus] = mapped_column(Enum(ImportStatus), default=ImportStatus.PENDING)
    records_total: Mapped[int] = mapped_column(Integer, default=0)
    records_success: Mapped[int] = mapped_column(Integer, default=0)
    records_failed: Mapped[int] = mapped_column(Integer, default=0)
    error_summary: Mapped[str | None] = mapped_column(Text)
    started_at: Mapped[datetime] = _ts()
    finished_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class IndicatorObservation(Base):
    __tablename__ = "indicator_observations"
    __table_args__ = (UniqueConstraint("cultural_object_id", "indicator_id", "period_start", "period_end", "source_id"),)
    id: Mapped[uuid.UUID] = _pk()
    cultural_object_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("cultural_objects.id"))
    indicator_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("indicators.id"))
    period_start: Mapped[date] = mapped_column(Date)
    period_end: Mapped[date] = mapped_column(Date)
    value_numeric: Mapped[float | None] = mapped_column(Numeric)
    value_text: Mapped[str | None] = mapped_column(Text)
    sample_size: Mapped[int | None] = mapped_column(Integer)
    source_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("data_sources.id"))
    import_job_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("data_import_jobs.id"))
    verification_status: Mapped[Verification] = mapped_column(Enum(Verification), default=Verification.UNVERIFIED)
    data_origin: Mapped[Origin] = mapped_column(Enum(Origin))
    notes: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = _ts()


class User(Base):
    __tablename__ = "users"
    id: Mapped[uuid.UUID] = _pk()
    name: Mapped[str] = mapped_column(String)
    email: Mapped[str] = mapped_column(String, unique=True)
    password_hash: Mapped[str] = mapped_column(String)
    role: Mapped[Role] = mapped_column(Enum(Role))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    # dinaikkan saat logout, ganti sandi, ganti role/status: semua token lama langsung tidak berlaku
    token_version: Mapped[int] = mapped_column(Integer, default=0, server_default="0")
    created_at: Mapped[datetime] = _ts()
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class AuditLog(Base):
    __tablename__ = "audit_logs"
    id: Mapped[uuid.UUID] = _pk()
    user_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id"))
    action: Mapped[str] = mapped_column(String)
    entity_type: Mapped[str] = mapped_column(String)
    entity_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))
    meta: Mapped[dict] = mapped_column("metadata", JSONB, default=dict)
    created_at: Mapped[datetime] = _ts()


class RiskLevel(str, enum.Enum):
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"
    INSUFFICIENT_DATA = "INSUFFICIENT_DATA"


class Severity(str, enum.Enum):
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"


class WarningStatus(str, enum.Enum):
    OPEN = "OPEN"
    IN_REVIEW = "IN_REVIEW"
    RESOLVED = "RESOLVED"
    DISMISSED = "DISMISSED"


class RiskAssessment(Base):
    __tablename__ = "risk_assessments"
    id: Mapped[uuid.UUID] = _pk()
    cultural_object_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("cultural_objects.id"), index=True)
    assessment_date: Mapped[date] = mapped_column(Date)
    period_start: Mapped[date] = mapped_column(Date)
    period_end: Mapped[date] = mapped_column(Date)
    risk_score: Mapped[float | None] = mapped_column(Numeric)  # NULL bila INSUFFICIENT_DATA
    risk_level: Mapped[RiskLevel] = mapped_column(Enum(RiskLevel))
    method_version: Mapped[str] = mapped_column(String)
    data_quality_score: Mapped[float | None] = mapped_column(Numeric)
    explanation_json: Mapped[dict] = mapped_column(JSONB, default=dict)
    is_simulated: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = _ts()
    factors: Mapped[list["RiskAssessmentFactor"]] = relationship(cascade="all, delete-orphan")


class RiskAssessmentFactor(Base):
    __tablename__ = "risk_assessment_factors"
    id: Mapped[uuid.UUID] = _pk()
    risk_assessment_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("risk_assessments.id"), index=True)
    indicator_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("indicators.id"))
    normalized_value: Mapped[float] = mapped_column(Numeric)
    weight_used: Mapped[float] = mapped_column(Numeric)
    weighted_contribution: Mapped[float] = mapped_column(Numeric)
    direction: Mapped[str] = mapped_column(String)
    change_pct: Mapped[float] = mapped_column(Numeric)
    evidence_observation_ids: Mapped[list] = mapped_column(JSONB, default=list)
    indicator: Mapped[Indicator] = relationship()


class EarlyWarning(Base):
    __tablename__ = "early_warnings"
    id: Mapped[uuid.UUID] = _pk()
    cultural_object_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("cultural_objects.id"), index=True)
    risk_assessment_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("risk_assessments.id", ondelete="SET NULL"))
    severity: Mapped[Severity] = mapped_column(Enum(Severity))
    title: Mapped[str] = mapped_column(String)
    description: Mapped[str] = mapped_column(Text)
    triggered_by_json: Mapped[dict] = mapped_column(JSONB, default=dict)
    status: Mapped[WarningStatus] = mapped_column(Enum(WarningStatus), default=WarningStatus.OPEN)
    created_at: Mapped[datetime] = _ts()
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    cultural_object: Mapped[CulturalObject] = relationship()


class AnalysisType(str, enum.Enum):
    RISK_EXPLANATION = "RISK_EXPLANATION"
    ROOT_CAUSE = "ROOT_CAUSE"
    RECOMMENDATION = "RECOMMENDATION"


class ReviewStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"


class RecStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    UNDER_REVIEW = "UNDER_REVIEW"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    IMPLEMENTED = "IMPLEMENTED"


class LlmAnalysis(Base):
    __tablename__ = "llm_analyses"
    id: Mapped[uuid.UUID] = _pk()
    cultural_object_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("cultural_objects.id"), index=True)
    risk_assessment_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("risk_assessments.id", ondelete="SET NULL"))
    analysis_type: Mapped[AnalysisType] = mapped_column(Enum(AnalysisType))
    provider: Mapped[str] = mapped_column(String)
    model: Mapped[str] = mapped_column(String)
    prompt_version: Mapped[str] = mapped_column(String)
    input_snapshot: Mapped[dict] = mapped_column(JSONB)
    output_json: Mapped[dict] = mapped_column(JSONB)
    evidence_refs: Mapped[list] = mapped_column(JSONB, default=list)
    validation_errors: Mapped[list] = mapped_column(JSONB, default=list)
    review_status: Mapped[ReviewStatus] = mapped_column(Enum(ReviewStatus), default=ReviewStatus.DRAFT)
    reviewed_by: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id"))
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = _ts()


class PolicyRecommendation(Base):
    __tablename__ = "policy_recommendations"
    id: Mapped[uuid.UUID] = _pk()
    cultural_object_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("cultural_objects.id"), index=True)
    risk_assessment_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("risk_assessments.id", ondelete="SET NULL"))
    llm_analysis_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("llm_analyses.id"))
    title: Mapped[str] = mapped_column(String)
    problem_statement: Mapped[str] = mapped_column(Text)
    root_cause_hypotheses: Mapped[list] = mapped_column(JSONB, default=list)
    recommended_actions: Mapped[list] = mapped_column(JSONB, default=list)
    target_groups: Mapped[list] = mapped_column(JSONB, default=list)
    suggested_kpis: Mapped[list] = mapped_column(JSONB, default=list)
    evidence_refs: Mapped[list] = mapped_column(JSONB, default=list)
    status: Mapped[RecStatus] = mapped_column(Enum(RecStatus), default=RecStatus.DRAFT)
    created_by_type: Mapped[str] = mapped_column(String, default="LLM")
    reviewed_by: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id"))
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = _ts()
    cultural_object: Mapped[CulturalObject] = relationship()


class LoginFailure(Base):
    """Satu baris per percobaan login gagal; dihitung dalam jendela waktu lalu dihapus. Lihat app/lockout.py."""
    __tablename__ = "login_failures"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    key: Mapped[str] = mapped_column(String(254), index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
