"""V3 models: temporal risk snapshots and entity graph for cross-project intelligence."""

from datetime import datetime

from sqlalchemy import (
    Column, Integer, Float, String, DateTime, Text, ForeignKey, Index,
)
from sqlalchemy.orm import relationship

from app.db.database import Base


class RiskSnapshot(Base):
    """A point-in-time record of a project's risk score.

    Every time the analysis pipeline runs, a new snapshot is appended —
    never overwritten — so we can reconstruct how risk evolved over the
    lifetime of the project.
    """
    __tablename__ = "risk_snapshots"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(
        Integer, ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=False,
    )
    project_code = Column(String(20), nullable=False, index=True)

    # Scores at this point in time
    risk_score = Column(Float, nullable=False)
    rule_score = Column(Float, nullable=True)
    ml_anomaly_score = Column(Float, nullable=True)
    similarity_score = Column(Float, nullable=True)
    peer_score = Column(Float, nullable=True)
    confidence_score = Column(Float, nullable=True)

    # Change detection
    delta_from_previous = Column(Float, nullable=True)  # risk_score difference
    is_change_point = Column(Integer, default=0)  # 1 if jump > threshold

    # When this snapshot was taken
    snapshot_at = Column(DateTime, default=datetime.utcnow, index=True)

    __table_args__ = (
        Index("ix_snapshot_project_time", "project_id", "snapshot_at"),
    )


class EntityNode(Base):
    """A node in the entity graph — can be a project, contractor, or agency."""
    __tablename__ = "entity_nodes"

    id = Column(Integer, primary_key=True, index=True)
    entity_type = Column(String(20), nullable=False, index=True)  # project, contractor, agency
    entity_name = Column(String(300), nullable=False, index=True)
    entity_ref = Column(String(20), nullable=True)  # project_id if type=project

    # Aggregate metrics
    total_linked_projects = Column(Integer, default=0)
    avg_risk_score = Column(Float, default=0.0)
    max_risk_score = Column(Float, default=0.0)
    flagged_project_count = Column(Integer, default=0)

    created_at = Column(DateTime, default=datetime.utcnow)


class EntityEdge(Base):
    """A relationship between two entity nodes."""
    __tablename__ = "entity_edges"

    id = Column(Integer, primary_key=True, index=True)
    source_id = Column(Integer, ForeignKey("entity_nodes.id", ondelete="CASCADE"), nullable=False)
    target_id = Column(Integer, ForeignKey("entity_nodes.id", ondelete="CASCADE"), nullable=False)

    relationship_type = Column(String(50), nullable=False)  # shared_contractor, shared_agency, geo_proximity, etc.
    weight = Column(Float, default=1.0)  # strength of connection
    details = Column(Text, nullable=True)  # JSON metadata

    __table_args__ = (
        Index("ix_edge_source_target", "source_id", "target_id"),
    )
