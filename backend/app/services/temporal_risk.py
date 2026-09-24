"""Temporal risk trajectory and velocity analysis."""

from sqlalchemy.orm import Session

from app.db.v3_models import RiskSnapshot
from app.db.models import Project


def get_risk_trajectory(db: Session, project_code: str) -> list[dict]:
    """Get the full history of risk scores for a project."""
    snapshots = (
        db.query(RiskSnapshot)
        .filter(RiskSnapshot.project_code == project_code)
        .order_by(RiskSnapshot.snapshot_at.asc())
        .all()
    )

    trajectory = []
    for snap in snapshots:
        trajectory.append({
            "snapshot_at": snap.snapshot_at.isoformat(),
            "risk_score": snap.risk_score,
            "rule_score": snap.rule_score,
            "ml_anomaly_score": snap.ml_anomaly_score,
            "similarity_score": snap.similarity_score,
            "peer_score": snap.peer_score,
            "confidence_score": snap.confidence_score,
            "delta": snap.delta_from_previous,
            "is_change_point": bool(snap.is_change_point),
        })

    return trajectory


def get_risk_velocity(db: Session, project_code: str) -> dict:
    """Calculate the rate of change in risk score over recent snapshots."""
    snapshots = (
        db.query(RiskSnapshot)
        .filter(RiskSnapshot.project_code == project_code)
        .order_by(RiskSnapshot.snapshot_at.desc())
        .limit(5)
        .all()
    )

    if not snapshots or len(snapshots) < 2:
        return {"velocity": 0.0, "trend": "stable", "recent_changes": []}

    snapshots.reverse()  # oldest first among the 5

    first = snapshots[0]
    last = snapshots[-1]
    
    total_delta = last.risk_score - first.risk_score
    velocity = total_delta / (len(snapshots) - 1)
    
    trend = "stable"
    if velocity > 3.0:
        trend = "rapid_increase"
    elif velocity > 0.5:
        trend = "increasing"
    elif velocity < -3.0:
        trend = "rapid_decrease"
    elif velocity < -0.5:
        trend = "decreasing"

    changes = [
        {"from": snapshots[i].risk_score, "to": snapshots[i+1].risk_score, "delta": snapshots[i+1].delta_from_previous}
        for i in range(len(snapshots)-1)
    ]

    return {
        "velocity": round(velocity, 2),
        "total_change": round(total_delta, 2),
        "trend": trend,
        "recent_changes": changes,
    }
