"""Rule engine and isolation forest anomaly detection."""

import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler

from app.core.config import settings

#  ENGINE 1: RULE ENGINE

def run_rule_engine(df: pd.DataFrame) -> dict:
    """
    Apply deterministic rules to each project.

    Returns:
        dict[project_id -> {"score": float, "reasons": list[str]}]
    """
    results = {}

    for _, row in df.iterrows():
        pid = row["project_id"]
        score = 0.0
        reasons = []

        # Rule A: High expenditure + low progress
        if (row["expenditure_ratio"] > settings.HIGH_EXPENDITURE_RATIO
                and row["physical_progress"] < settings.LOW_PROGRESS_THRESHOLD):
            score += 35
            reasons.append(
                f"High expenditure ({row['expenditure_ratio']:.1f}%) relative to "
                f"reported physical progress ({row['physical_progress']:.1f}%)."
            )

        # Rule B: Large progress gap
        if row["progress_gap"] > settings.LARGE_PROGRESS_GAP:
            score += 25
            reasons.append(
                f"Physical progress is {row['progress_gap']:.1f} percentage points "
                f"below timeline-based expected progress."
            )

        # Rule C: Project delayed (past expected completion)
        if row["delay_days"] > 0:
            # Scale: more delay → more score
            delay_score = min(20, row["delay_days"] / 30 * 5)  # ~5 pts per month, cap 20
            score += delay_score
            reasons.append(
                f"Project has exceeded expected completion date by {row['delay_days']} days."
            )

        # Rule D: Expenditure exceeds sanctioned
        if row["expenditure_ratio"] > 100:
            score += 15
            reasons.append(
                f"Expenditure ({row['expenditure_ratio']:.1f}%) exceeds sanctioned amount."
            )

        # Rule E: Very low release ratio
        if row["release_ratio"] < 50 and row["physical_progress"] > 60:
            score += 10
            reasons.append(
                f"Only {row['release_ratio']:.1f}% of sanctioned amount released, "
                f"but {row['physical_progress']:.1f}% progress reported."
            )

        # Rule F: Zero or near-zero progress with elapsed time
        if row["elapsed_days"] > 180 and row["physical_progress"] < 5:
            score += 20
            reasons.append(
                f"Near-zero progress ({row['physical_progress']:.1f}%) after "
                f"{row['elapsed_days']} elapsed days."
            )

        results[pid] = {
            "score": round(min(100, score), 2),
            "reasons": reasons,
        }

    return results

#  ENGINE 2: ISOLATION FOREST

def run_isolation_forest(df: pd.DataFrame) -> dict:
    """
    Unsupervised anomaly detection on numerical fingerprint features.

    Features used:
      expenditure_ratio, release_ratio, physical_progress,
      expected_progress, progress_gap, delay_days,
      spending_velocity, sanctioned_amount

    Returns:
        dict[project_id -> {"score": float, "is_anomaly": bool}]
    """
    feature_cols = [
        "expenditure_ratio", "release_ratio", "physical_progress",
        "expected_progress", "progress_gap", "delay_days",
        "spending_velocity", "sanctioned_amount",
    ]

    # Prepare feature matrix
    X = df[feature_cols].fillna(0).values

    # Standardise features
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    # Fit Isolation Forest
    iso_forest = IsolationForest(
        contamination=settings.IF_CONTAMINATION,
        random_state=settings.IF_RANDOM_STATE,
        n_estimators=100,
    )
    iso_forest.fit(X_scaled)

    # Get predictions and anomaly scores
    predictions = iso_forest.predict(X_scaled)       # 1 = normal, -1 = anomaly
    raw_scores = iso_forest.decision_function(X_scaled)  # lower = more anomalous

    # Convert decision_function to 0–100 score
    # decision_function: negative = anomalous, positive = normal
    # We invert and scale so anomalies get HIGH scores
    min_score = raw_scores.min()
    max_score = raw_scores.max()
    score_range = max_score - min_score if max_score != min_score else 1

    results = {}
    for i, (_, row) in enumerate(df.iterrows()):
        # Invert: most negative raw_score → highest anomaly score
        normalised = (1 - (raw_scores[i] - min_score) / score_range) * 100
        normalised = round(min(100, max(0, normalised)), 2)

        results[row["project_id"]] = {
            "score": normalised,
            "is_anomaly": bool(predictions[i] == -1),
            "raw_decision_score": round(float(raw_scores[i]), 4),
        }

    return results
