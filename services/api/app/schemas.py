import uuid
from datetime import date

from pydantic import BaseModel, ConfigDict, Field

from app import models as m
from app.models import Origin, RegionLevel, SourceType, Verification


class ORM(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class RegionOut(ORM):
    id: uuid.UUID
    code: str
    name: str
    level: RegionLevel


class DataSourceIn(BaseModel):
    code: str = Field(min_length=1, max_length=50)
    name: str = Field(min_length=1)
    source_type: SourceType
    description: str | None = None
    access_method: str | None = None
    terms_url: str | None = None
    license_notes: str | None = None


class DataSourceOut(DataSourceIn, ORM):
    id: uuid.UUID
    is_active: bool


class IndicatorOut(ORM):
    id: uuid.UUID
    code: str
    name: str
    unit: str | None
    direction: str
    availability: str


class CulturalObjectIn(BaseModel):
    external_code: str | None = None
    name: str = Field(min_length=1)
    category: str = Field(min_length=1)
    description: str | None = None
    region_id: uuid.UUID | None = None
    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)
    source_id: uuid.UUID | None = None
    data_origin: Origin  # wajib: tidak ada default supaya provenance selalu eksplisit


class CulturalObjectOut(ORM):
    id: uuid.UUID
    external_code: str | None
    name: str
    category: str
    region_id: uuid.UUID | None
    verification_status: Verification
    data_origin: Origin


class ObservationOut(ORM):
    id: uuid.UUID
    indicator_id: uuid.UUID
    period_start: date
    period_end: date
    value_numeric: float | None
    source_id: uuid.UUID
    verification_status: Verification
    data_origin: Origin


class RowError(BaseModel):
    row: int
    field: str
    message: str


class ImportReport(BaseModel):
    committed: bool
    job_id: uuid.UUID | None = None
    records_total: int
    records_valid: int
    records_failed: int
    errors: list[RowError]
    preview: list[dict]


class RiskFactorOut(BaseModel):
    indicator_code: str
    indicator_name: str
    normalized_risk: float
    weight: float
    contribution: float
    change_pct: float
    direction: str
    evidence_observation_ids: list[str]


class RiskOut(BaseModel):
    cultural_object_id: uuid.UUID
    assessment_date: date
    period_start: date
    period_end: date
    risk_score: float | None
    risk_level: str
    data_confidence: float | None
    method_version: str
    is_simulated: bool
    factors: list[RiskFactorOut]
    confidence_components: dict[str, float]
    params: dict


class RiskRunIn(BaseModel):
    cultural_object_id: uuid.UUID | None = None


class WarningOut(BaseModel):
    id: uuid.UUID
    cultural_object_id: uuid.UUID
    object_name: str
    severity: str
    title: str
    description: str
    status: str


class WarningPatch(BaseModel):
    status: m.WarningStatus
