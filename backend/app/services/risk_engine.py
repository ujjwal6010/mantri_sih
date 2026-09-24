"""Risk fusion orchestrator."""

import json
from datetime import datetime

import pandas as pd
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.models import Project, RiskAssessment
from app.db.v3_models import RiskSnapshot
from app.services.anomaly_detection import run_isolation_forest, run_rule_engine
from app.services.similarity import run_similarity_analysis
from app.services.dossier import run_peer_benchmarking

# Score Fusion

def fuse_scores(
    rule_score: float,
    ml_score: float,
    similarity_score: float,
    peer_score: float,
) -> float:
    """
    Weighted combination per spec:
      Rules: 35%, Isolation Forest: 30%, Similarity: 15%, Peer: 20%
    """
    fused = (
        settings.WEIGHT_RULES * rule_score
        + settings.WEIGHT_ISOLATION_FOREST * ml_score
        + settings.WEIGHT_SIMILARITY * similarity_score
        + settings.WEIGHT_PEER_BENCHMARK * peer_score
    )
    return round(min(100, max(0, fused)), 2)

# Confidence

def compute_confidence(project: Project, rule_score: float, ml_score: float,
                       similarity_score: float, peer_score: float) -> float:
    """
    Confidence measures data quality + signal agreement.
    NOT a duplicate of risk.

    Factors:
      - Data completeness (do we have all fields?)
      - Date validity
      - Location availability
      - Signal agreement (do engines agree?)
    """
    score = 0.0

    # Data completeness (up to 50 points)
    completeness = 0
    if project.sanctioned_amount and project.sanctioned_amount > 0:
        completeness += 8
    if project.released_amount is not None:
        completeness += 6
    if project.expenditure is not None:
        completeness += 8
    if project.physical_progress is not None:
        completeness += 8
    if project.start_date and project.expected_completion:
        completeness += 8
    if project.latitude and project.longitude:
        completeness += 6
    if project.description and len(project.description) > 10:
        completeness += 3
    if project.agency and project.contractor:
        completeness += 3
    score += completeness  # max 50

    # Signal agreement (up to 50 points)
    # If multiple engines flag the project, confidence is higher
    engines = [rule_score, ml_score, similarity_score, peer_score]
    flagging = [s for s in engines if s > 40]
    non_flagging = [s for s in engines if s <= 40]

    if len(flagging) >= 3:
        score += 40  # Strong agreement
    elif len(flagging) == 2:
        score += 30
    elif len(flagging) == 1:
        score += 20
    else:
        score += 35  # No flags = confident it's low-risk

    # Variance penalty: very mixed signals reduce confidence
    if engines:
        variance = pd.Series(engines).std()
        if variance > 30:
            score -= 10
        elif variance > 20:
            score -= 5

    # Bonus for financial consistency
    if project.expenditure_ratio is not None and 0 <= project.expenditure_ratio <= 120:
        score += 5
    if project.release_ratio is not None and 0 <= project.release_ratio <= 110:
        score += 5

    return round(min(100, max(0, score)), 2)

# Why Flagged

def build_why_flagged(
    rule_reasons: list[str],
    ml_is_anomaly: bool,
    similar_projects: list[dict],
    peer_deviations: list[dict],
) -> list[str]:
    """Collect actual contributing reasons. No generic filler."""
    reasons = []

    # Rule engine reasons
    reasons.extend(rule_reasons)

    # ML anomaly
    if ml_is_anomaly:
        reasons.append(
            "Isolation Forest detected unusual multivariate pattern across financial and progress features."
        )

    # Similarity
    if similar_projects:
        for sp in similar_projects[:2]:  # Top 2
            pid = sp.get("project_id", "unknown")
            dist = sp.get("distance_km")
            if dist is not None:
                reasons.append(
                    f"A potentially overlapping project ({pid}) was detected {dist:.1f} km away."
                )
            else:
                reasons.append(
                    f"A potentially similar/duplicate project ({pid}) was detected."
                )

    # Peer deviations
    for pd_item in peer_deviations:
        if pd_item.get("deviation") in ("above_iqr", "below_iqr"):
            metric = pd_item.get("metric", "metric")
            direction = "above" if pd_item["deviation"] == "above_iqr" else "below"
            reasons.append(
                f"{metric.replace('_', ' ').title()} is substantially {direction} the relevant peer median."
            )

    return reasons

# Full Analysis Orchestrator

def run_full_analysis(db: Session) -> int:
    """
    Run all intelligence engines on all projects and persist results.
    Returns the number of projects assessed.
    """
    projects = db.query(Project).all()
    if not projects:
        return 0

    # Build DataFrame for batch engines
    project_data = []
    for p in projects:
        project_data.append({
            "id": p.id,
            "project_id": p.project_id,
            "work_type": p.work_type,
            "description": p.description,
            "state": p.state,
            "district": p.district,
            "sanctioned_amount": p.sanctioned_amount,
            "released_amount": p.released_amount,
            "expenditure": p.expenditure,
            "physical_progress": p.physical_progress,
            "expenditure_ratio": p.expenditure_ratio or 0,
            "release_ratio": p.release_ratio or 0,
            "spending_velocity": p.spending_velocity or 0,
            "expected_progress": p.expected_progress or 0,
            "progress_gap": p.progress_gap or 0,
            "planned_duration_days": p.planned_duration_days or 0,
            "elapsed_days": p.elapsed_days or 0,
            "delay_days": p.delay_days or 0,
            "latitude": p.latitude,
            "longitude": p.longitude,
            "agency": p.agency,
            "contractor": p.contractor,
        })
    df = pd.DataFrame(project_data)

    # Engine 1: Rule Engine
    rule_results = run_rule_engine(df)

    # Engine 2: Isolation Forest
    ml_results = run_isolation_forest(df)

    # Engine 3: Similarity Analysis
    similarity_results = run_similarity_analysis(df)

    # Engine 4: Peer Benchmarking
    peer_results = run_peer_benchmarking(df)

    # Fuse & Persist
    # Clear old assessments
    db.query(RiskAssessment).delete()

    count = 0
    for p in projects:
        pid = p.project_id
        rule = rule_results.get(pid, {"score": 0, "reasons": []})
        ml = ml_results.get(pid, {"score": 0, "is_anomaly": False})
        sim = similarity_results.get(pid, {"score": 0, "similar_projects": []})
        peer = peer_results.get(pid, {"score": 0, "deviations": []})

        # Fuse
        risk = fuse_scores(rule["score"], ml["score"], sim["score"], peer["score"])
        confidence = compute_confidence(p, rule["score"], ml["score"], sim["score"], peer["score"])
        why = build_why_flagged(
            rule["reasons"], ml.get("is_anomaly", False),
            sim.get("similar_projects", []), peer.get("deviations", []),
        )

        ra = RiskAssessment(
            project_id=p.id,
            rule_score=round(rule["score"], 2),
            ml_anomaly_score=round(ml["score"], 2),
            similarity_score=round(sim["score"], 2),
            peer_score=round(peer["score"], 2),
            risk_score=risk,
            confidence_score=confidence,
            why_flagged=json.dumps(why),
            rule_details=json.dumps(rule.get("reasons", [])),
            ml_details=json.dumps(ml),
            similarity_details=json.dumps(sim.get("similar_projects", [])),
            peer_details=json.dumps(peer.get("deviations", [])),
            assessed_at=datetime.utcnow(),
        )
        db.add(ra)
        
        # Temporal risk tracking (V3)
        # Find previous snapshot to calculate delta
        prev_snapshot = db.query(RiskSnapshot).filter(
            RiskSnapshot.project_id == p.id
        ).order_by(RiskSnapshot.snapshot_at.desc()).first()
        
        delta = 0.0
        is_change_point = 0
        if prev_snapshot:
            delta = risk - prev_snapshot.risk_score
            # A jump of > 15 points is flagged as a change point
            if abs(delta) > 15.0:
                is_change_point = 1
                
        snapshot = RiskSnapshot(
            project_id=p.id,
            project_code=p.project_id,
            risk_score=risk,
            rule_score=round(rule["score"], 2),
            ml_anomaly_score=round(ml["score"], 2),
            similarity_score=round(sim["score"], 2),
            peer_score=round(peer["score"], 2),
            confidence_score=confidence,
            delta_from_previous=round(delta, 2) if prev_snapshot else None,
            is_change_point=is_change_point,
            snapshot_at=datetime.utcnow(),
        )
        db.add(snapshot)
        
        count += 1

    db.commit()
    return count
