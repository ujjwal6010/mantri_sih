"""Project API endpoints."""

import json
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.db.database import get_db
from app.db.models import Project, RiskAssessment
from app.schemas.project import (
    ProjectSummary, ProjectDetail, ProjectFingerprint,
    FinancialFingerprint, ProgressFingerprint, TemporalFingerprint,
    GeographicFingerprint, EntityFingerprint, DossierResponse,
)

router = APIRouter()

# Helper

def _get_project_or_404(project_id: str, db: Session) -> Project:
    project = db.query(Project).filter(Project.project_id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail=f"Project {project_id} not found")
    return project

def _main_signal(ra: RiskAssessment | None) -> str | None:
    """Pick the dominant signal from why_flagged."""
    if not ra or not ra.why_flagged:
        return None
    try:
        reasons = json.loads(ra.why_flagged)
        return reasons[0] if reasons else None
    except (json.JSONDecodeError, IndexError):
        return None

# GET /projects

@router.get("", response_model=list[ProjectSummary])
def list_projects(
    state: Optional[str] = Query(None),
    district: Optional[str] = Query(None),
    constituency: Optional[str] = Query(None),
    work_type: Optional[str] = Query(None),
    risk_min: Optional[float] = Query(None, ge=0, le=100),
    risk_max: Optional[float] = Query(None, ge=0, le=100),
    sort_by: str = Query("risk", enum=["risk", "project_id", "district"]),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    """List projects with optional filters, sorted by risk (descending) by default."""
    query = db.query(Project)

    # Filters
    if state:
        query = query.filter(Project.state == state)
    if district:
        query = query.filter(Project.district == district)
    if constituency:
        query = query.filter(Project.constituency == constituency)
    if work_type:
        query = query.filter(Project.work_type == work_type)

    # Risk range filter via join
    if risk_min is not None or risk_max is not None:
        query = query.join(RiskAssessment, isouter=True)
        if risk_min is not None:
            query = query.filter(RiskAssessment.risk_score >= risk_min)
        if risk_max is not None:
            query = query.filter(RiskAssessment.risk_score <= risk_max)

    # Sorting
    if sort_by == "risk":
        query = (
            query
            .outerjoin(RiskAssessment)
            .order_by(desc(RiskAssessment.risk_score).nulls_last())
        )
    elif sort_by == "district":
        query = query.order_by(Project.district)
    else:
        query = query.order_by(Project.project_id)

    projects = query.offset(offset).limit(limit).all()

    results = []
    for p in projects:
        ra = p.risk_assessment
        results.append(ProjectSummary(
            id=p.id,
            project_id=p.project_id,
            state=p.state,
            district=p.district,
            constituency=p.constituency,
            work_type=p.work_type,
            description=p.description,
            sanctioned_amount=p.sanctioned_amount,
            released_amount=p.released_amount,
            expenditure=p.expenditure,
            physical_progress=p.physical_progress,
            start_date=p.start_date,
            expected_completion=p.expected_completion,
            latitude=p.latitude,
            longitude=p.longitude,
            agency=p.agency,
            contractor=p.contractor,
            risk_score=ra.risk_score if ra else None,
            confidence_score=ra.confidence_score if ra else None,
            main_signal=_main_signal(ra),
        ))
    return results

# GET /projects/{project_id}

@router.get("/{project_id}", response_model=ProjectDetail)
def get_project(project_id: str, db: Session = Depends(get_db)):
    """Full project details including computed fingerprint features."""
    p = _get_project_or_404(project_id, db)
    ra = p.risk_assessment

    return ProjectDetail(
        id=p.id,
        project_id=p.project_id,
        state=p.state,
        district=p.district,
        constituency=p.constituency,
        work_type=p.work_type,
        description=p.description,
        sanctioned_amount=p.sanctioned_amount,
        released_amount=p.released_amount,
        expenditure=p.expenditure,
        physical_progress=p.physical_progress,
        start_date=p.start_date,
        expected_completion=p.expected_completion,
        latitude=p.latitude,
        longitude=p.longitude,
        agency=p.agency,
        contractor=p.contractor,
        expenditure_ratio=p.expenditure_ratio,
        release_ratio=p.release_ratio,
        spending_velocity=p.spending_velocity,
        expected_progress=p.expected_progress,
        progress_gap=p.progress_gap,
        planned_duration_days=p.planned_duration_days,
        elapsed_days=p.elapsed_days,
        delay_days=p.delay_days,
        risk_score=ra.risk_score if ra else None,
        confidence_score=ra.confidence_score if ra else None,
    )

# GET /projects/{project_id}/fingerprint

@router.get("/{project_id}/fingerprint", response_model=ProjectFingerprint)
def get_fingerprint(project_id: str, db: Session = Depends(get_db)):
    """Multidimensional behavioural fingerprint for a project."""
    p = _get_project_or_404(project_id, db)

    return ProjectFingerprint(
        financial=FinancialFingerprint(
            sanctioned_amount=p.sanctioned_amount,
            released_amount=p.released_amount,
            expenditure=p.expenditure,
            expenditure_ratio=p.expenditure_ratio,
            release_ratio=p.release_ratio,
            spending_velocity=p.spending_velocity,
        ),
        progress=ProgressFingerprint(
            physical_progress=p.physical_progress,
            expected_progress=p.expected_progress,
            progress_gap=p.progress_gap,
        ),
        temporal=TemporalFingerprint(
            start_date=p.start_date,
            expected_completion=p.expected_completion,
            planned_duration_days=p.planned_duration_days,
            elapsed_days=p.elapsed_days,
            delay_days=p.delay_days,
        ),
        geographic=GeographicFingerprint(
            latitude=p.latitude,
            longitude=p.longitude,
        ),
        entity=EntityFingerprint(
            agency=p.agency,
            contractor=p.contractor,
        ),
    )

# GET /projects/{project_id}/dossier

@router.get("/{project_id}/dossier", response_model=DossierResponse)
def get_dossier(project_id: str, db: Session = Depends(get_db)):
    """Investigation dossier for a project."""
    p = _get_project_or_404(project_id, db)
    ra = p.risk_assessment

    if not ra:
        raise HTTPException(
            status_code=404,
            detail=f"Risk assessment not yet available for {project_id}. Run seed.py with intelligence engines.",
        )

    # Parse stored JSON fields
    why_flagged = json.loads(ra.why_flagged) if ra.why_flagged else []
    similar_raw = json.loads(ra.similarity_details) if ra.similarity_details else []
    peer_raw = json.loads(ra.peer_details) if ra.peer_details else []

    # Supporting evidence
    evidence = {
        "expenditure_ratio": p.expenditure_ratio,
        "release_ratio": p.release_ratio,
        "spending_velocity": p.spending_velocity,
        "physical_progress": p.physical_progress,
        "expected_progress": p.expected_progress,
        "progress_gap": p.progress_gap,
        "delay_days": p.delay_days,
        "sanctioned_amount": p.sanctioned_amount,
    }

    # Recommended verification steps based on signals
    verification = []
    if p.progress_gap and p.progress_gap > 20:
        verification.append("Verify physical progress on site.")
    if p.expenditure_ratio and p.expenditure_ratio > 80:
        verification.append("Review expenditure and sanction records.")
    if p.delay_days and p.delay_days > 0:
        verification.append("Investigate reasons for timeline delay.")
    if similar_raw:
        verification.append("Compare work location with related projects.")
        verification.append("Verify measurement and progress records.")
    if not verification:
        verification.append("General review recommended based on risk signals.")

    return DossierResponse(
        project_id=p.project_id,
        risk_score=ra.risk_score,
        confidence_score=ra.confidence_score,
        why_flagged=why_flagged,
        supporting_evidence=evidence,
        similar_projects=similar_raw,
        peer_comparisons=peer_raw,
        recommended_verification=verification,
        disclaimer=(
            "This dossier identifies risk signals for authorised human verification. "
            "It does not establish fraud or misconduct."
        ),
    )
