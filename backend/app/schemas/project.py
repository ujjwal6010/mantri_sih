"""
Pydantic schemas for API request / response validation.
"""

from datetime import date, datetime
from pydantic import BaseModel, Field


# Fingerprint sub-schemas

class FinancialFingerprint(BaseModel):
    sanctioned_amount: float
    released_amount: float
    expenditure: float
    expenditure_ratio: float | None = None
    release_ratio: float | None = None
    spending_velocity: float | None = None


class ProgressFingerprint(BaseModel):
    physical_progress: float
    expected_progress: float | None = None
    progress_gap: float | None = None


class TemporalFingerprint(BaseModel):
    start_date: date
    expected_completion: date
    planned_duration_days: int | None = None
    elapsed_days: int | None = None
    delay_days: int | None = None


class GeographicFingerprint(BaseModel):
    latitude: float | None = None
    longitude: float | None = None


class EntityFingerprint(BaseModel):
    agency: str
    contractor: str


class ProjectFingerprint(BaseModel):
    financial: FinancialFingerprint
    progress: ProgressFingerprint
    temporal: TemporalFingerprint
    geographic: GeographicFingerprint
    entity: EntityFingerprint


# Risk schemas

class RiskBreakdown(BaseModel):
    rule_score: float = 0.0
    ml_anomaly_score: float = 0.0
    similarity_score: float = 0.0
    peer_score: float = 0.0


class RiskResponse(BaseModel):
    risk_score: float
    confidence_score: float
    breakdown: RiskBreakdown
    why_flagged: list[str] = []


class SimilarProject(BaseModel):
    project_id: str
    description: str | None = None
    distance_km: float | None = None
    text_similarity: float | None = None
    signals: list[str] = []
    match_strength: float | None = None


class PeerComparison(BaseModel):
    peer_group_size: int
    metric: str
    project_value: float
    peer_median: float
    peer_q1: float
    peer_q3: float
    deviation: str  # "above_iqr", "below_iqr", "within_range"


class DossierResponse(BaseModel):
    project_id: str
    risk_score: float
    confidence_score: float
    why_flagged: list[str]
    supporting_evidence: dict
    similar_projects: list[SimilarProject] = []
    peer_comparisons: list[PeerComparison] = []
    recommended_verification: list[str]
    disclaimer: str


# Project schemas

class ProjectBase(BaseModel):
    project_id: str
    state: str
    district: str
    constituency: str
    work_type: str
    description: str
    sanctioned_amount: float
    released_amount: float
    expenditure: float
    physical_progress: float
    start_date: date
    expected_completion: date
    latitude: float | None = None
    longitude: float | None = None
    agency: str
    contractor: str


class ProjectSummary(ProjectBase):
    """Compact view for the ranked table."""
    id: int
    risk_score: float | None = None
    confidence_score: float | None = None
    main_signal: str | None = None

    model_config = {"from_attributes": True}


class ProjectDetail(ProjectBase):
    """Full view for the project intelligence page."""
    id: int
    expenditure_ratio: float | None = None
    release_ratio: float | None = None
    spending_velocity: float | None = None
    expected_progress: float | None = None
    progress_gap: float | None = None
    planned_duration_days: int | None = None
    elapsed_days: int | None = None
    delay_days: int | None = None
    risk_score: float | None = None
    confidence_score: float | None = None

    model_config = {"from_attributes": True}


# Overview schema

class OverviewStats(BaseModel):
    total_projects: int
    projects_requiring_attention: int  # risk >= 60
    high_risk_signals: int             # risk >= 80
    delayed_projects: int              # delay_days > 0
    potential_overlap_signals: int     # similarity_score > 0

    risk_distribution: dict[str, int]  # {"low": n, "medium": n, "high": n, "critical": n}
    top_states: list[dict]             # [{state, count, avg_risk}]
    work_type_breakdown: list[dict]    # [{work_type, count}]
