"""Audit trail, evidence, and alert lifecycle endpoints."""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import Project
from app.db.audit_trail import AuditEvent, EvidenceRecord, AlertAction
from app.schemas.audit import (
    SubmitEvidenceRequest, EvidenceResponse,
    UpdateAlertRequest, AlertActionResponse,
    AuditEventResponse, AuditTrailResponse, AlertStats,
    EvidenceRequirementItem, SufficiencyResponse,
    InspectorStatsResponse, ReinspectionResponse,
)
from app.services.audit_service import (
    submit_evidence, transition_alert, verify_audit_chain,
    get_alert_stats, record_event,
    compute_evidence_requirements, compute_sufficiency_score,
    trigger_reinspection,
)
from app.services.inspector_analytics import get_inspector_stats

router = APIRouter()


def _get_project_or_404(project_id: str, db: Session) -> Project:
    project = db.query(Project).filter(Project.project_id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail=f"Project {project_id} not found")
    return project


# Evidence

@router.post("/projects/{project_id}/evidence", response_model=EvidenceResponse, status_code=201)
def add_evidence(project_id: str, body: SubmitEvidenceRequest, db: Session = Depends(get_db)):
    """Submit field evidence against a flagged project."""
    project = _get_project_or_404(project_id, db)
    record = submit_evidence(
        db,
        project=project,
        submitted_by=body.submitted_by,
        evidence_type=body.evidence_type,
        description=body.description,
        file_path=body.file_path,
        latitude=body.latitude,
        longitude=body.longitude,
    )
    db.commit()
    db.refresh(record)
    return record


@router.get("/projects/{project_id}/evidence", response_model=list[EvidenceResponse])
def list_evidence(project_id: str, db: Session = Depends(get_db)):
    """All evidence records for a project, newest first."""
    project = _get_project_or_404(project_id, db)
    records = (
        db.query(EvidenceRecord)
        .filter(EvidenceRecord.project_id == project.id)
        .order_by(EvidenceRecord.submitted_at.desc())
        .all()
    )
    return records


# Alert Lifecycle

@router.get("/projects/{project_id}/alert", response_model=AlertActionResponse | None)
def get_alert(project_id: str, db: Session = Depends(get_db)):
    """Current alert status for a project."""
    project = _get_project_or_404(project_id, db)
    alert = db.query(AlertAction).filter(AlertAction.project_id == project.id).first()
    if not alert:
        return None
    return alert


@router.patch("/projects/{project_id}/alert", response_model=AlertActionResponse)
def update_alert(project_id: str, body: UpdateAlertRequest, db: Session = Depends(get_db)):
    """Transition alert status. Enforces maker-checker for high-risk projects."""
    project = _get_project_or_404(project_id, db)
    try:
        alert = transition_alert(
            db,
            project=project,
            new_status=body.new_status,
            actor=body.actor,
            resolution_notes=body.resolution_notes,
        )
        db.commit()
        db.refresh(alert)
        return alert
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# Audit Trail

@router.get("/projects/{project_id}/audit-trail", response_model=AuditTrailResponse)
def get_project_audit_trail(
    project_id: str,
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    """Tamper-evident event log for a single project."""
    project = _get_project_or_404(project_id, db)
    total = db.query(AuditEvent).filter(AuditEvent.project_id == project.id).count()
    events = (
        db.query(AuditEvent)
        .filter(AuditEvent.project_id == project.id)
        .order_by(AuditEvent.timestamp.desc())
        .offset(offset).limit(limit)
        .all()
    )
    return AuditTrailResponse(events=events, total=total)


@router.get("/audit-trail", response_model=AuditTrailResponse)
def get_global_audit_trail(
    action: str | None = Query(None),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    """Global audit trail across all projects."""
    query = db.query(AuditEvent)
    if action:
        query = query.filter(AuditEvent.action == action)
    total = query.count()
    events = query.order_by(AuditEvent.timestamp.desc()).offset(offset).limit(limit).all()
    return AuditTrailResponse(events=events, total=total)


@router.get("/audit-trail/verify/{project_id}")
def verify_chain(project_id: str, db: Session = Depends(get_db)):
    """Verify integrity of a project's audit chain."""
    project = _get_project_or_404(project_id, db)

    record_event(
        db, actor="system", action="chain_verified",
        project_db_id=project.id,
        details={"triggered_by": "manual_verification"},
    )

    result = verify_audit_chain(db, project.id)
    db.commit()
    return result


# Alert Overview

@router.get("/alerts/overview", response_model=AlertStats)
def alert_overview(db: Session = Depends(get_db)):
    """Alert statistics across all projects."""
    return AlertStats(**get_alert_stats(db))


# Evidence Requirements & Sufficiency

@router.get("/projects/{project_id}/evidence-requirements", response_model=list[EvidenceRequirementItem])
def evidence_requirements(project_id: str, db: Session = Depends(get_db)):
    """What evidence is needed for this project, based on its anomalies."""
    project = _get_project_or_404(project_id, db)
    return compute_evidence_requirements(db, project)


@router.get("/projects/{project_id}/evidence-sufficiency", response_model=SufficiencyResponse)
def evidence_sufficiency(project_id: str, db: Session = Depends(get_db)):
    """How much of the required evidence has been submitted."""
    project = _get_project_or_404(project_id, db)
    result = compute_sufficiency_score(db, project)
    return SufficiencyResponse(**result)


# Inspector Behaviour Analytics

@router.get("/inspectors/analytics", response_model=list[InspectorStatsResponse])
def inspector_analytics(db: Session = Depends(get_db)):
    """Behaviour profile for every inspector who has handled alerts."""
    return get_inspector_stats(db)


# Re-inspection

@router.post("/reinspection/trigger", response_model=ReinspectionResponse)
def reinspection_trigger(
    sample_rate: float = Query(0.2, ge=0.0, le=1.0),
    db: Session = Depends(get_db),
):
    """Randomly re-open a fraction of resolved alerts for secondary review."""
    reopened = trigger_reinspection(db, sample_rate)
    return ReinspectionResponse(
        reopened=reopened,
        message=f"{reopened} alert(s) reopened for re-inspection.",
    )
