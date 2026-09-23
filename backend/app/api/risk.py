"""Risk overview and scoring endpoints."""

import json
from collections import Counter

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.db.database import get_db
from app.db.models import Project, RiskAssessment
from app.schemas.project import RiskResponse, RiskBreakdown, OverviewStats
from app.services.audit_service import get_alert_stats

router = APIRouter()

# Risk band helper

def _risk_band(score: float) -> str:
    if score >= 80:
        return "critical"
    elif score >= 60:
        return "high"
    elif score >= 40:
        return "medium"
    return "low"

# GET /overview

@router.get("/overview", response_model=OverviewStats)
def get_overview(db: Session = Depends(get_db)):
    """Dashboard-level summary statistics."""
    total = db.query(Project).count()

    # Risk-based counts
    assessments = db.query(RiskAssessment).all()
    risk_scores = [ra.risk_score for ra in assessments]

    projects_requiring_attention = sum(1 for s in risk_scores if s >= 60)
    high_risk_signals = sum(1 for s in risk_scores if s >= 80)

    # Delayed projects
    delayed = db.query(Project).filter(Project.delay_days > 0).count()

    # Potential overlaps (projects with similarity_score > 0)
    overlap_count = sum(
        1 for ra in assessments
        if ra.similarity_score and ra.similarity_score > 0
    )

    # Risk distribution
    band_counts = Counter(_risk_band(s) for s in risk_scores)
    risk_distribution = {
        "low": band_counts.get("low", 0),
        "medium": band_counts.get("medium", 0),
        "high": band_counts.get("high", 0),
        "critical": band_counts.get("critical", 0),
    }

    # If no assessments yet, still return valid distribution
    if not assessments:
        risk_distribution = {"low": total, "medium": 0, "high": 0, "critical": 0}

    # Top states by avg risk
    state_data = (
        db.query(
            Project.state,
            func.count(Project.id).label("count"),
        )
        .group_by(Project.state)
        .all()
    )
    top_states = []
    for state_name, count in state_data:
        state_risks = [
            ra.risk_score for ra in assessments
            if ra.project and ra.project.state == state_name
        ]
        avg_risk = round(sum(state_risks) / len(state_risks), 1) if state_risks else 0.0
        top_states.append({"state": state_name, "count": count, "avg_risk": avg_risk})
    top_states.sort(key=lambda x: x["avg_risk"], reverse=True)

    # Work type breakdown
    wt_data = (
        db.query(Project.work_type, func.count(Project.id).label("count"))
        .group_by(Project.work_type)
        .all()
    )
    work_type_breakdown = [{"work_type": wt, "count": c} for wt, c in wt_data]

    alert_stats = get_alert_stats(db)

    return OverviewStats(
        total_projects=total,
        projects_requiring_attention=projects_requiring_attention,
        high_risk_signals=high_risk_signals,
        delayed_projects=delayed,
        potential_overlap_signals=overlap_count,
        risk_distribution=risk_distribution,
        top_states=top_states,
        work_type_breakdown=work_type_breakdown,
        open_alerts=alert_stats["open_alerts"],
        escalated_count=alert_stats["escalated"],
    )

# GET /projects/{project_id}/risk

@router.get("/projects/{project_id}/risk", response_model=RiskResponse)
def get_project_risk(project_id: str, db: Session = Depends(get_db)):
    """Risk score breakdown for a single project."""
    project = db.query(Project).filter(Project.project_id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail=f"Project {project_id} not found")

    ra = project.risk_assessment
    if not ra:
        raise HTTPException(
            status_code=404,
            detail=f"Risk assessment not yet available for {project_id}. Run seed.py with intelligence engines.",
        )

    why_flagged = json.loads(ra.why_flagged) if ra.why_flagged else []

    return RiskResponse(
        risk_score=ra.risk_score,
        confidence_score=ra.confidence_score,
        breakdown=RiskBreakdown(
            rule_score=ra.rule_score or 0.0,
            ml_anomaly_score=ra.ml_anomaly_score or 0.0,
            similarity_score=ra.similarity_score or 0.0,
            peer_score=ra.peer_score or 0.0,
        ),
        why_flagged=why_flagged,
    )
