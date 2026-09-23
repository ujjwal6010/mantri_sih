"""Maps anomaly types to the specific evidence an inspector must submit.

Each anomaly detected by the risk engine carries a fingerprint — a progress gap
demands on-site proof, an expenditure overrun needs the measurement book, and so on.
This module codifies those relationships so the system can tell inspectors exactly
what to bring back from the field.
"""

ANOMALY_EVIDENCE_MAP: dict[str, list[dict]] = {
    "progress_gap": [
        {
            "type": "site_photo",
            "reason": "Physical progress lag requires geo-tagged site photographs showing current construction state.",
            "weight": 1.0,
        },
        {
            "type": "geolocation",
            "reason": "GPS coordinates must confirm the inspector was physically present at the project location.",
            "weight": 0.8,
        },
    ],
    "expenditure_overrun": [
        {
            "type": "document",
            "reason": "Measurement books and running account bills must be cross-verified against reported expenditure.",
            "weight": 1.0,
        },
        {
            "type": "inspector_note",
            "reason": "Inspector's assessment of whether reported spending aligns with visible work on-ground.",
            "weight": 0.6,
        },
    ],
    "timeline_delay": [
        {
            "type": "inspector_note",
            "reason": "Field assessment of delay causes — labour shortage, material issues, or administrative bottleneck.",
            "weight": 1.0,
        },
        {
            "type": "document",
            "reason": "Revised timeline documentation or extension approval from the district authority.",
            "weight": 0.7,
        },
    ],
    "overlap_detected": [
        {
            "type": "geolocation",
            "reason": "GPS evidence confirming whether the flagged projects occupy distinct physical locations.",
            "weight": 1.0,
        },
        {
            "type": "site_photo",
            "reason": "Photographic proof that both projects represent genuinely separate works, not a duplicate claim.",
            "weight": 0.9,
        },
    ],
    "peer_deviation": [
        {
            "type": "document",
            "reason": "Utilization certificates and expenditure statements to justify deviation from state peer benchmarks.",
            "weight": 1.0,
        },
        {
            "type": "inspector_note",
            "reason": "Inspector's justification for why this project's metrics deviate from comparable projects.",
            "weight": 0.5,
        },
    ],
}

ANOMALY_KEYWORD_MAP = {
    "progress": "progress_gap",
    "physical progress": "progress_gap",
    "lag": "progress_gap",
    "gap": "progress_gap",
    "expenditure": "expenditure_overrun",
    "spending": "expenditure_overrun",
    "overrun": "expenditure_overrun",
    "exceeded": "expenditure_overrun",
    "delay": "timeline_delay",
    "overdue": "timeline_delay",
    "completion date": "timeline_delay",
    "overlap": "overlap_detected",
    "duplicate": "overlap_detected",
    "similarity": "overlap_detected",
    "nearby": "overlap_detected",
    "peer": "peer_deviation",
    "benchmark": "peer_deviation",
    "deviation": "peer_deviation",
    "iqr": "peer_deviation",
}


def classify_anomaly(reason_text: str) -> str | None:
    """Match a free-text anomaly reason to one of the known categories."""
    lower = reason_text.lower()
    for keyword, category in ANOMALY_KEYWORD_MAP.items():
        if keyword in lower:
            return category
    return None


def get_required_evidence(why_flagged: list[str]) -> list[dict]:
    """Given a list of anomaly reasons, return all unique evidence requirements.

    Deduplicates by evidence type, keeping the highest weight and
    merging reasons from multiple anomalies.
    """
    seen: dict[str, dict] = {}

    for reason in why_flagged:
        category = classify_anomaly(reason)
        if not category:
            continue

        requirements = ANOMALY_EVIDENCE_MAP.get(category, [])
        for req in requirements:
            ev_type = req["type"]
            if ev_type not in seen:
                seen[ev_type] = {
                    "type": ev_type,
                    "reasons": [req["reason"]],
                    "weight": req["weight"],
                    "source_anomalies": [category],
                }
            else:
                if req["reason"] not in seen[ev_type]["reasons"]:
                    seen[ev_type]["reasons"].append(req["reason"])
                if category not in seen[ev_type]["source_anomalies"]:
                    seen[ev_type]["source_anomalies"].append(category)
                seen[ev_type]["weight"] = max(seen[ev_type]["weight"], req["weight"])

    return sorted(seen.values(), key=lambda r: r["weight"], reverse=True)
