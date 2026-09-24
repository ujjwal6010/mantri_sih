from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.services.temporal_risk import get_risk_trajectory, get_risk_velocity
from app.services.contextual_baseline import compute_residual_anomaly
from app.services.entity_graph import get_full_network, get_entity_clusters
from app.services.gaming_detector import detect_gaming

router = APIRouter(prefix="/v3", tags=["V3 Intelligence"])

@router.get("/projects/{project_code}/risk-trajectory")
def risk_trajectory(project_code: str, db: Session = Depends(get_db)):
    """Get the historical risk trajectory for a project."""
    data = get_risk_trajectory(db, project_code)
    return {"project_code": project_code, "trajectory": data}

@router.get("/projects/{project_code}/risk-velocity")
def risk_velocity(project_code: str, db: Session = Depends(get_db)):
    """Get the risk velocity (rate of change) for a project."""
    data = get_risk_velocity(db, project_code)
    return {"project_code": project_code, "velocity_data": data}

@router.get("/projects/{project_code}/residual-anomaly")
def residual_anomaly(project_code: str, db: Session = Depends(get_db)):
    """Get the contextual vs residual risk breakdown."""
    data = compute_residual_anomaly(db, project_code)
    if "error" in data:
        raise HTTPException(status_code=404, detail=data["error"])
    return data

@router.get("/entities/graph")
def entity_graph(db: Session = Depends(get_db)):
    """Get the full cross-project entity graph."""
    data = get_full_network(db)
    return data

@router.get("/entities/clusters")
def entity_clusters(db: Session = Depends(get_db)):
    """Get suspicious entity clusters."""
    data = get_entity_clusters(db)
    return {"clusters": data}

@router.get("/monitoring/gaming-detection")
def gaming_detection(db: Session = Depends(get_db)):
    """Get projects suspected of gaming the monitoring system."""
    data = detect_gaming(db)
    return {"suspects": data}
