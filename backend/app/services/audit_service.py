"""V2 business logic: evidence management, alert lifecycle, and tamper-evident audit trails."""

import json
from datetime import datetime
from collections import Counter

from sqlalchemy.orm import Session

from app.db.models import Project, RiskAssessment
from app.db.audit_trail import AuditEvent, EvidenceRecord, AlertAction
from app.services.evidence_requirements import get_required_evidence, classify_anomaly

GENESIS_HASH = "0" * 64

VALID_TRANSITIONS = {
    "open": {"under_review", "escalated"},
    "under_review": {"evidence_submitted", "escalated", "resolved", "dismissed"},
    "evidence_submitted": {"under_review", "escalated", "resolved", "dismissed"},
    "escalated": {"under_review", "resolved"},
    "resolved": set(),
    "dismissed": set(),
}

HIGH_RISK_THRESHOLD = 60.0


def _latest_hash(db: Session, project_db_id: int) -> str:
    last_event = (
        db.query(AuditEvent)
        .filter(AuditEvent.project_id == project_db_id)
        .order_by(AuditEvent.id.desc())
        .first()
    )
    return last_event.integrity_hash if last_event else GENESIS_HASH


def record_event(
    db: Session,
    actor: str,
    action: str,
    project_db_id: int,
    details: dict | None = None,
) -> AuditEvent:
    now = datetime.utcnow()
    details_json = json.dumps(details) if details else None
    previous_hash = _latest_hash(db, project_db_id)

    integrity_hash = AuditEvent.compute_hash(
        previous_hash=previous_hash,
        actor=actor,
        action=action,
        project_id=project_db_id,
        details=details_json or "",
        timestamp=now.isoformat(),
    )

    event = AuditEvent(
        project_id=project_db_id,
        actor=actor,
        action=action,
        details=details_json,
        timestamp=now,
        integrity_hash=integrity_hash,
    )
    db.add(event)
    db.flush()
    return event


def verify_audit_chain(db: Session, project_db_id: int) -> dict:
    events = (
        db.query(AuditEvent)
        .filter(AuditEvent.project_id == project_db_id)
        .order_by(AuditEvent.id.asc())
        .all()
    )

    if not events:
        return {"valid": True, "checked": 0, "broken_at": None}

    previous_hash = GENESIS_HASH
    for event in events:
        expected = AuditEvent.compute_hash(
            previous_hash=previous_hash,
            actor=event.actor,
            action=event.action,
            project_id=event.project_id,
            details=event.details or "",
            timestamp=event.timestamp.isoformat(),
        )
        if expected != event.integrity_hash:
            return {"valid": False, "checked": event.id, "broken_at": event.id}
        previous_hash = event.integrity_hash

    return {"valid": True, "checked": len(events), "broken_at": None}


def submit_evidence(
    db: Session,
    project: Project,
    submitted_by: str,
    evidence_type: str,
    description: str,
    file_path: str | None = None,
    latitude: float | None = None,
    longitude: float | None = None,
) -> EvidenceRecord:
    record = EvidenceRecord(
        project_id=project.id,
        submitted_by=submitted_by,
        evidence_type=evidence_type,
        description=description,
        file_path=file_path,
        latitude=latitude,
        longitude=longitude,
    )
    db.add(record)
    db.flush()

    record_event(
        db, actor=submitted_by, action="evidence_submitted",
        project_db_id=project.id,
        details={
            "evidence_id": record.id,
            "evidence_type": evidence_type,
            "description": description[:200],
        },
    )

    alert = db.query(AlertAction).filter(AlertAction.project_id == project.id).first()
    if alert and alert.current_status in ("open", "under_review"):
        alert.current_status = "evidence_submitted"

    return record


def transition_alert(
    db: Session,
    project: Project,
    new_status: str,
    actor: str,
    resolution_notes: str | None = None,
) -> AlertAction:
    alert = db.query(AlertAction).filter(AlertAction.project_id == project.id).first()
    if not alert:
        raise ValueError(f"No alert exists for project {project.project_id}")

    allowed = VALID_TRANSITIONS.get(alert.current_status, set())
    if new_status not in allowed:
        raise ValueError(
            f"Cannot transition from '{alert.current_status}' to '{new_status}'. "
            f"Allowed: {allowed or 'none (terminal state)'}."
        )

    ra = project.risk_assessment
    is_high_risk = ra and ra.risk_score >= HIGH_RISK_THRESHOLD

    if is_high_risk and new_status in ("resolved", "dismissed"):
        if alert.assigned_to and actor == alert.assigned_to:
            raise ValueError(
                "Maker-checker required: a different officer must review and close "
                "high-risk alerts. The assigned inspector cannot resolve their own case."
            )
        alert.reviewed_by = actor

    old_status = alert.current_status
    alert.current_status = new_status

    if new_status == "under_review" and not alert.assigned_to:
        alert.assigned_to = actor

    if new_status in ("resolved", "dismissed"):
        alert.resolved_at = datetime.utcnow()
        alert.resolution_notes = resolution_notes

    action_type = {
        "escalated": "alert_escalated",
        "resolved": "alert_resolved",
        "dismissed": "alert_dismissed",
    }.get(new_status, "alert_status_changed")

    record_event(
        db, actor=actor, action=action_type,
        project_db_id=project.id,
        details={
            "from_status": old_status,
            "to_status": new_status,
            "notes": resolution_notes,
        },
    )

    return alert


def auto_open_alerts(db: Session) -> int:
    flagged = (
        db.query(Project)
        .join(RiskAssessment)
        .filter(RiskAssessment.risk_score >= HIGH_RISK_THRESHOLD)
        .all()
    )

    opened = 0
    for project in flagged:
        existing = db.query(AlertAction).filter(AlertAction.project_id == project.id).first()
        if existing:
            continue

        alert = AlertAction(
            project_id=project.id,
            current_status="open",
        )
        db.add(alert)
        db.flush()

        record_event(
            db, actor="system", action="alert_opened",
            project_db_id=project.id,
            details={
                "risk_score": project.risk_assessment.risk_score,
                "confidence": project.risk_assessment.confidence_score,
                "reason": "Auto-opened: risk score exceeds threshold.",
            },
        )
        opened += 1

    db.commit()
    return opened


def get_alert_stats(db: Session) -> dict:
    alerts = db.query(AlertAction).all()
    counts = Counter(a.current_status for a in alerts)
    return {
        "open_alerts": counts.get("open", 0),
        "under_review": counts.get("under_review", 0),
        "evidence_submitted": counts.get("evidence_submitted", 0),
        "escalated": counts.get("escalated", 0),
        "resolved": counts.get("resolved", 0),
        "dismissed": counts.get("dismissed", 0),
    }


def compute_evidence_requirements(db: Session, project: Project) -> list[dict]:
    """Figure out what evidence this project needs based on its anomalies."""
    ra = project.risk_assessment
    if not ra or not ra.why_flagged:
        return []

    why_flagged = json.loads(ra.why_flagged) if isinstance(ra.why_flagged, str) else ra.why_flagged
    requirements = get_required_evidence(why_flagged)

    submitted_types = set(
        r.evidence_type for r in
        db.query(EvidenceRecord)
        .filter(EvidenceRecord.project_id == project.id)
        .all()
    )

    for req in requirements:
        req["submitted"] = req["type"] in submitted_types

    return requirements


def compute_sufficiency_score(db: Session, project: Project) -> dict:
    """How much of the required evidence has actually been submitted.

    Returns a score from 0 to 100 weighted by each requirement's importance,
    plus a breakdown of what's still missing.
    """
    requirements = compute_evidence_requirements(db, project)

    if not requirements:
        return {
            "score": 100.0,
            "total_required": 0,
            "submitted_count": 0,
            "missing_types": [],
            "requirements": [],
        }

    total_weight = sum(r["weight"] for r in requirements)
    submitted_weight = sum(r["weight"] for r in requirements if r["submitted"])

    score = (submitted_weight / total_weight * 100) if total_weight > 0 else 0.0
    missing = [r["type"] for r in requirements if not r["submitted"]]

    return {
        "score": round(score, 1),
        "total_required": len(requirements),
        "submitted_count": sum(1 for r in requirements if r["submitted"]),
        "missing_types": missing,
        "requirements": requirements,
    }


def trigger_reinspection(db: Session, sample_rate: float = 0.2) -> int:
    """Randomly send a fraction of recently resolved alerts back for secondary review.

    Picks a different inspector than the original assigned_to,
    creating an audit trail entry so the re-inspection is fully transparent.
    """
    import random

    resolved = (
        db.query(AlertAction)
        .filter(AlertAction.current_status == "resolved")
        .all()
    )

    if not resolved:
        return 0

    sample_size = max(1, int(len(resolved) * sample_rate))
    selected = random.sample(resolved, min(sample_size, len(resolved)))

    inspectors = ["Inspector Sharma", "Inspector Verma", "Inspector Patel", "Inspector Gupta"]
    reopened = 0

    for alert in selected:
        available = [i for i in inspectors if i != alert.assigned_to]
        new_inspector = random.choice(available) if available else inspectors[0]

        old_status = alert.current_status
        alert.current_status = "under_review"
        alert.assigned_to = new_inspector
        alert.reviewed_by = None
        alert.resolved_at = None
        alert.resolution_notes = None

        record_event(
            db, actor="system", action="alert_status_changed",
            project_db_id=alert.project_id,
            details={
                "from_status": old_status,
                "to_status": "under_review",
                "reason": "Random re-inspection triggered for quality assurance.",
                "reassigned_to": new_inspector,
            },
        )
        reopened += 1

    db.commit()
    return reopened
