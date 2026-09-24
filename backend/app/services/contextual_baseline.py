"""Contextual baseline and residual anomaly isolation."""

from sqlalchemy.orm import Session
from app.db.models import Project, RiskAssessment

def compute_contextual_factors(project: Project) -> dict:
    """Calculate the explainable portion of risk based on known environmental contexts."""
    # This uses heuristic logic for the demo.
    # In production, this would call actual weather/terrain/disaster APIs.
    
    explained_points = 0.0
    reasons = []

    # Terrain context
    difficult_terrains = ["Hilly", "Mountainous", "Forest"]
    if any(terrain.lower() in project.description.lower() for terrain in difficult_terrains):
        explained_points += 15.0
        reasons.append("Project located in difficult terrain, typical delays are expected.")

    # Scale context
    if project.sanctioned_amount > 10000000:
        explained_points += 5.0
        reasons.append("Large scale project, longer execution times are common.")

    # Monsoon context (simplistic check for demo)
    if project.start_date and project.expected_completion:
        start_month = project.start_date.month
        end_month = project.expected_completion.month
        # Assuming monsoon is roughly June(6) to Sept(9)
        monsoon_overlap = False
        if start_month <= 9 and end_month >= 6:
            monsoon_overlap = True
            
        if monsoon_overlap:
            explained_points += 10.0
            reasons.append("Execution window overlaps with monsoon season, explaining some delay/progress gaps.")
            
    # Geo context (simplistic proxy for region-specific issues)
    if project.state.lower() in ["assam", "meghalaya", "bihar"]:
         explained_points += 8.0
         reasons.append(f"Region ({project.state}) has known historical execution slowdowns.")

    return {
        "explained_points": min(explained_points, 40.0), # Cap contextual explanation
        "reasons": reasons
    }


def compute_residual_anomaly(db: Session, project_code: str) -> dict:
    """Subtracts explainable component from the raw deviation to isolate unexplained residual."""
    project = db.query(Project).filter(Project.project_id == project_code).first()
    if not project:
        return {"error": "Project not found"}
        
    ra = project.risk_assessment
    if not ra:
        return {"error": "No risk assessment found"}
        
    raw_risk = ra.risk_score
    context = compute_contextual_factors(project)
    
    # We reduce the raw risk by the explained points
    residual_risk = max(0.0, raw_risk - context["explained_points"])
    
    # Recalculate percentage of original risk that remains unexplained
    unexplained_percentage = (residual_risk / raw_risk * 100) if raw_risk > 0 else 0.0
    
    status = "normal"
    if residual_risk > 60:
        status = "high_unexplained_risk"
    elif residual_risk > 40:
        status = "moderate_unexplained_risk"
    elif raw_risk > 60 and residual_risk <= 40:
        status = "contextually_explained"

    return {
        "project_code": project_code,
        "raw_risk_score": raw_risk,
        "explained_deduction": context["explained_points"],
        "contextual_reasons": context["reasons"],
        "residual_risk_score": round(residual_risk, 2),
        "unexplained_percentage": round(unexplained_percentage, 1),
        "status": status
    }
