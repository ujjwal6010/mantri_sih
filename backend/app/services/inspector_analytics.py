"""Inspector behaviour analytics — spots patterns that humans might miss.

If an inspector resolves 95% of their cases without ever escalating,
that's not diligence — it's a red flag. This module computes per-inspector
statistics and flags anomalous behaviour for supervisory review.
"""

from collections import defaultdict
from datetime import datetime

from sqlalchemy.orm import Session

from app.db.audit_trail import AuditEvent, AlertAction


SUSPICIOUS_RESOLVE_RATE = 0.9
MINIMUM_CASES_FOR_FLAG = 3


def get_inspector_stats(db: Session) -> list[dict]:
    """Build a behaviour profile for every inspector who has touched an alert."""

    alerts = db.query(AlertAction).all()
    events = db.query(AuditEvent).order_by(AuditEvent.timestamp.asc()).all()

    inspector_data: dict[str, dict] = defaultdict(lambda: {
        "total_handled": 0,
        "resolved": 0,
        "dismissed": 0,
        "escalated": 0,
        "under_review": 0,
        "first_action_delays": [],
        "projects_touched": set(),
    })

    for alert in alerts:
        if alert.assigned_to:
            data = inspector_data[alert.assigned_to]
            data["total_handled"] += 1
            data["projects_touched"].add(alert.project_id)

            if alert.current_status == "resolved":
                data["resolved"] += 1
            elif alert.current_status == "dismissed":
                data["dismissed"] += 1
            elif alert.current_status == "escalated":
                data["escalated"] += 1
            elif alert.current_status == "under_review":
                data["under_review"] += 1

        if alert.reviewed_by and alert.reviewed_by != alert.assigned_to:
            reviewer_data = inspector_data[alert.reviewed_by]
            reviewer_data["total_handled"] += 1
            reviewer_data["projects_touched"].add(alert.project_id)

    project_open_times: dict[int, datetime] = {}
    project_first_action: dict[int, datetime] = {}

    for event in events:
        if event.action == "alert_opened":
            project_open_times[event.project_id] = event.timestamp
        elif event.action == "alert_status_changed" and event.actor != "system":
            if event.project_id not in project_first_action:
                project_first_action[event.project_id] = event.timestamp

    for inspector, data in inspector_data.items():
        for pid in data["projects_touched"]:
            if pid in project_open_times and pid in project_first_action:
                delta = (project_first_action[pid] - project_open_times[pid]).total_seconds() / 3600
                data["first_action_delays"].append(delta)

    results = []
    for inspector, data in inspector_data.items():
        total = data["total_handled"]
        if total == 0:
            continue

        resolve_rate = (data["resolved"] + data["dismissed"]) / total
        escalation_rate = data["escalated"] / total
        avg_response_hours = (
            round(sum(data["first_action_delays"]) / len(data["first_action_delays"]), 1)
            if data["first_action_delays"] else None
        )

        is_flagged = (
            total >= MINIMUM_CASES_FOR_FLAG
            and resolve_rate >= SUSPICIOUS_RESOLVE_RATE
            and escalation_rate < 0.05
        )

        flag_reason = None
        if is_flagged:
            flag_reason = (
                f"Resolve/dismiss rate of {resolve_rate:.0%} with near-zero escalation "
                f"across {total} cases suggests potential rubber-stamping."
            )

        results.append({
            "inspector": inspector,
            "total_handled": total,
            "resolved": data["resolved"],
            "dismissed": data["dismissed"],
            "escalated": data["escalated"],
            "active_reviews": data["under_review"],
            "resolve_rate": round(resolve_rate, 3),
            "escalation_rate": round(escalation_rate, 3),
            "avg_response_hours": avg_response_hours,
            "is_flagged": is_flagged,
            "flag_reason": flag_reason,
        })

    results.sort(key=lambda r: r["total_handled"], reverse=True)
    return results
