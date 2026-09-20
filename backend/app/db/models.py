"""SQLAlchemy models for projects and risk assessments."""

from datetime import date, datetime

from sqlalchemy import (
    Column, Integer, Float, String, Date, DateTime, Text, ForeignKey,
)
from sqlalchemy.orm import relationship

from app.db.database import Base

class Project(Base):
    """
    Represents a single MPLADS project work.
    Contains both source fields (from CSV) and computed fingerprint features.
    """
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(String(20), unique=True, nullable=False, index=True)

    # Location
    state = Column(String(100), nullable=False, index=True)
    district = Column(String(100), nullable=False, index=True)
    constituency = Column(String(100), nullable=False, index=True)

    # Work
    work_type = Column(String(100), nullable=False, index=True)
    description = Column(Text, nullable=False)

    # Financial (source)
    sanctioned_amount = Column(Float, nullable=False)
    released_amount = Column(Float, nullable=False)
    expenditure = Column(Float, nullable=False)

    # Progress (source)
    physical_progress = Column(Float, nullable=False)  # 0–100

    # Temporal (source)
    start_date = Column(Date, nullable=False)
    expected_completion = Column(Date, nullable=False)

    # Geographic
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)

    # Entity
    agency = Column(String(200), nullable=False)
    contractor = Column(String(200), nullable=False)

    # Computed fingerprint features
    expenditure_ratio = Column(Float, nullable=True)    # expenditure / sanctioned * 100
    release_ratio = Column(Float, nullable=True)        # released / sanctioned * 100
    spending_velocity = Column(Float, nullable=True)    # expenditure / elapsed_days
    expected_progress = Column(Float, nullable=True)    # timeline-based, 0–100
    progress_gap = Column(Float, nullable=True)         # expected_progress - physical_progress
    planned_duration_days = Column(Integer, nullable=True)
    elapsed_days = Column(Integer, nullable=True)
    delay_days = Column(Integer, nullable=True)         # 0 if not overdue

    # Relationships
    risk_assessment = relationship(
        "RiskAssessment", back_populates="project", uselist=False,
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return f"<Project {self.project_id} | {self.work_type} | {self.district}>"

class RiskAssessment(Base):
    """
    Stores the output of all intelligence engines and the fused risk score.
    One-to-one with Project.
    """
    __tablename__ = "risk_assessments"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(
        Integer, ForeignKey("projects.id", ondelete="CASCADE"),
        unique=True, nullable=False,
    )

    # Individual engine scores (0–100)
    rule_score = Column(Float, nullable=True, default=0.0)
    ml_anomaly_score = Column(Float, nullable=True, default=0.0)
    similarity_score = Column(Float, nullable=True, default=0.0)
    peer_score = Column(Float, nullable=True, default=0.0)

    # Fused scores
    risk_score = Column(Float, nullable=False, default=0.0, index=True)
    confidence_score = Column(Float, nullable=False, default=0.0)

    # Explanations (JSON-serialised lists stored as text)
    why_flagged = Column(Text, nullable=True)          # JSON list of reasons
    rule_details = Column(Text, nullable=True)         # JSON list of rule hits
    ml_details = Column(Text, nullable=True)           # JSON dict of IF output
    similarity_details = Column(Text, nullable=True)   # JSON list of similar projects
    peer_details = Column(Text, nullable=True)         # JSON dict of peer comparison

    # Metadata
    assessed_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    project = relationship("Project", back_populates="risk_assessment")

    def __repr__(self) -> str:
        return f"<RiskAssessment project_id={self.project_id} risk={self.risk_score}>"
