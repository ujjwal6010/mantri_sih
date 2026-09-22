"""V2 models: audit events, evidence records, and alert lifecycle."""

import hashlib
import json
from datetime import datetime

from sqlalchemy import (
    Column, Integer, Float, String, DateTime, Text, Enum, ForeignKey,
)
from sqlalchemy.orm import relationship

from app.db.database import Base


class AuditEvent(Base):
    """
    Append-only, tamper-evident event log.

    Each row carries a SHA-256 integrity hash computed from
    the previous row's hash plus this row's content,
    forming a verifiable chain.
    """
    __tablename__ = "audit_events"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(
        Integer, ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=False, index=True,
    )

    actor = Column(String(200), nullable=False)
    action = Column(
        Enum(
            "alert_opened", "alert_status_changed", "evidence_submitted",
            "dossier_viewed", "chain_verified", "alert_escalated",
            "alert_resolved", "alert_dismissed",
            name="audit_action_type",
        ),
        nullable=False, index=True,
    )

    details = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)
    integrity_hash = Column(String(64), nullable=False)

    project = relationship("Project", back_populates="audit_events")

    @staticmethod
    def compute_hash(previous_hash: str, actor: str, action: str,
                     project_id: int, details: str, timestamp: str) -> str:
        payload = f"{previous_hash}|{actor}|{action}|{project_id}|{details}|{timestamp}"
        return hashlib.sha256(payload.encode("utf-8")).hexdigest()

    def __repr__(self) -> str:
        return f"<AuditEvent {self.action} by {self.actor} on project {self.project_id}>"


class EvidenceRecord(Base):
    """Inspector-submitted evidence against a flagged project."""
    __tablename__ = "evidence_records"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(
        Integer, ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=False, index=True,
    )

    submitted_by = Column(String(200), nullable=False)
    evidence_type = Column(
        Enum(
            "site_photo", "document", "geolocation", "inspector_note",
            name="evidence_type_enum",
        ),
        nullable=False,
    )
    description = Column(Text, nullable=False)
    file_path = Column(String(500), nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    submitted_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    project = relationship("Project", back_populates="evidence_records")

    def __repr__(self) -> str:
        return f"<Evidence {self.evidence_type} by {self.submitted_by}>"


class AlertAction(Base):
    """
    Lifecycle tracker for a flagged project's review process.

    Maker-checker: resolving or dismissing a high-risk alert
    requires reviewed_by ≠ assigned_to.
    """
    __tablename__ = "alert_actions"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(
        Integer, ForeignKey("projects.id", ondelete="CASCADE"),
        unique=True, nullable=False, index=True,
    )

    current_status = Column(
        Enum(
            "open", "under_review", "evidence_submitted",
            "escalated", "resolved", "dismissed",
            name="alert_status_enum",
        ),
        nullable=False, default="open",
    )

    assigned_to = Column(String(200), nullable=True)
    reviewed_by = Column(String(200), nullable=True)
    resolution_notes = Column(Text, nullable=True)

    opened_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    resolved_at = Column(DateTime, nullable=True)

    project = relationship("Project", back_populates="alert_action")

    def __repr__(self) -> str:
        return f"<AlertAction {self.current_status} for project {self.project_id}>"
