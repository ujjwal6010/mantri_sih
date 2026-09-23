"""Pydantic schemas for audit trail, evidence, and alert lifecycle."""

from datetime import datetime
from pydantic import BaseModel, Field


class SubmitEvidenceRequest(BaseModel):
    submitted_by: str
    evidence_type: str = Field(
        ..., pattern="^(site_photo|document|geolocation|inspector_note)$",
    )
    description: str = Field(..., min_length=5)
    file_path: str | None = None
    latitude: float | None = None
    longitude: float | None = None


class EvidenceResponse(BaseModel):
    id: int
    project_id: int
    submitted_by: str
    evidence_type: str
    description: str
    file_path: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    submitted_at: datetime

    model_config = {"from_attributes": True}


class UpdateAlertRequest(BaseModel):
    new_status: str = Field(
        ..., pattern="^(under_review|evidence_submitted|escalated|resolved|dismissed)$",
    )
    actor: str
    resolution_notes: str | None = None


class AlertActionResponse(BaseModel):
    id: int
    project_id: int
    current_status: str
    assigned_to: str | None = None
    reviewed_by: str | None = None
    resolution_notes: str | None = None
    opened_at: datetime
    resolved_at: datetime | None = None

    model_config = {"from_attributes": True}


class AuditEventResponse(BaseModel):
    id: int
    project_id: int
    actor: str
    action: str
    details: str | None = None
    timestamp: datetime
    integrity_hash: str

    model_config = {"from_attributes": True}


class AuditTrailResponse(BaseModel):
    events: list[AuditEventResponse]
    total: int
    chain_intact: bool | None = None


class AlertStats(BaseModel):
    open_alerts: int = 0
    under_review: int = 0
    evidence_submitted: int = 0
    escalated: int = 0
    resolved: int = 0
    dismissed: int = 0


class EvidenceRequirementItem(BaseModel):
    type: str
    reasons: list[str]
    weight: float
    source_anomalies: list[str]
    submitted: bool = False


class SufficiencyResponse(BaseModel):
    score: float
    total_required: int
    submitted_count: int
    missing_types: list[str]
    requirements: list[EvidenceRequirementItem]


class InspectorStatsResponse(BaseModel):
    inspector: str
    total_handled: int
    resolved: int
    dismissed: int
    escalated: int
    active_reviews: int
    resolve_rate: float
    escalation_rate: float
    avg_response_hours: float | None = None
    is_flagged: bool = False
    flag_reason: str | None = None


class ReinspectionResponse(BaseModel):
    reopened: int
    message: str
