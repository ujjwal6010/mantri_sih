"""Detects projects exhibiting suspicious timing patterns indicative of gaming the system."""

from sqlalchemy.orm import Session
from datetime import datetime, timedelta

from app.db.models import Project
from app.db.audit_trail import EvidenceRecord, AlertAction

def detect_gaming(db: Session) -> list[dict]:
    """Analyzes all active alerts/projects for gaming patterns."""
    
    # 1. Pre-inspection clustering
    # Projects where 80%+ of evidence is uploaded within 48h of an inspection
    flagged = []
    
    projects = db.query(Project).all()
    
    for p in projects:
        gaming_score = 0
        reasons = []
        
        evidence = p.evidence_records
        if not evidence or len(evidence) < 3:
            continue
            
        # Pattern 1: Sudden perfect corrections
        # If an alert was raised for progress, and suddenly progress jumps > 40% in one update
        has_alert = False
        if p.alert_action and p.alert_action.status == "open":
            has_alert = True
            
        # We don't have historical progress in the schema right now, 
        # so we'll simulate the "sudden correction" heuristic based on evidence metadata.
        sudden_updates = sum(1 for e in evidence if "progress" in e.document_type.lower() and e.submitted_at > (datetime.utcnow() - timedelta(days=2)))
        if has_alert and sudden_updates >= 2:
            gaming_score += 40
            reasons.append("Sudden burst of progress evidence immediately following an alert.")
            
        # Pattern 2: Timeline clustering
        # All evidence uploaded on the same day
        dates = [e.submitted_at.date() for e in evidence]
        unique_dates = set(dates)
        if len(evidence) >= 4 and len(unique_dates) == 1:
            gaming_score += 60
            reasons.append("Highly clustered evidence submission (all documents uploaded on a single day).")
            
        # Pattern 3: Missing geo-metadata on recent uploads
        # Uploads done in a rush often lack proper GPS tagging
        missing_geo = sum(1 for e in evidence if not e.latitude or not e.longitude)
        if len(evidence) > 0 and (missing_geo / len(evidence)) > 0.5:
            gaming_score += 30
            reasons.append(f"High proportion of evidence ({missing_geo}/{len(evidence)}) missing geo-metadata.")

        # Cap gaming score
        gaming_score = min(100, gaming_score)

        if gaming_score >= 50:
            flagged.append({
                "project_id": p.project_id,
                "project_name": p.work_type,
                "agency": p.agency,
                "contractor": p.contractor,
                "gaming_score": gaming_score,
                "reasons": reasons,
                "evidence_count": len(evidence)
            })
            
    # Sort by score descending
    flagged.sort(key=lambda x: x["gaming_score"], reverse=True)
    return flagged
