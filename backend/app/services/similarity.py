"""Similarity and duplicate project detection engine."""

import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from app.core.config import settings

# Haversine Distance (NumPy-based, no PostGIS)

def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Haversine distance in kilometres between two points."""
    R = 6371.0  # Earth radius in km
    lat1_r, lat2_r = np.radians(lat1), np.radians(lat2)
    dlat = np.radians(lat2 - lat1)
    dlon = np.radians(lon2 - lon1)
    a = np.sin(dlat / 2) ** 2 + np.cos(lat1_r) * np.cos(lat2_r) * np.sin(dlon / 2) ** 2
    return R * 2 * np.arctan2(np.sqrt(a), np.sqrt(1 - a))

# Temporal Overlap

def execution_overlap_days(start1, end1, start2, end2) -> int:
    """Number of overlapping days between two execution windows."""
    latest_start = max(start1, start2)
    earliest_end = min(end1, end2)
    overlap = (earliest_end - latest_start).days
    return max(0, overlap)

# Run Similarity Analysis

def run_similarity_analysis(df: pd.DataFrame) -> dict:
    """
    Compare every pair of projects for potential overlap.

    A single signal alone should NOT trigger an alert.
    We require MULTIPLE aligned signals.

    Returns:
        dict[project_id -> {
            "score": float (0–100),
            "similar_projects": list[{project_id, distance_km, text_similarity, signals}]
        }]
    """
    n = len(df)
    results = {row["project_id"]: {"score": 0.0, "similar_projects": []} for _, row in df.iterrows()}

    if n < 2:
        return results

    # Text similarity matrix (TF-IDF + Cosine)
    tfidf = TfidfVectorizer(stop_words="english", max_features=5000)
    tfidf_matrix = tfidf.fit_transform(df["description"].fillna(""))
    text_sim_matrix = cosine_similarity(tfidf_matrix)

    # Pairwise comparison
    for i in range(n):
        best_matches = []
        row_i = df.iloc[i]

        for j in range(n):
            if i == j:
                continue
            row_j = df.iloc[j]
            signals = []
            signal_count = 0

            # 1. Text similarity
            text_sim = float(text_sim_matrix[i, j])
            if text_sim >= settings.TEXT_SIMILARITY_THRESHOLD:
                signals.append(f"Similar description (similarity: {text_sim:.2f})")
                signal_count += 1

            # 2. Geographic proximity
            dist_km = None
            if (pd.notna(row_i["latitude"]) and pd.notna(row_i["longitude"])
                    and pd.notna(row_j["latitude"]) and pd.notna(row_j["longitude"])):
                dist_km = haversine_km(
                    row_i["latitude"], row_i["longitude"],
                    row_j["latitude"], row_j["longitude"],
                )
                if dist_km <= settings.GEO_PROXIMITY_KM:
                    signals.append(f"Close geographic location ({dist_km:.2f} km)")
                    signal_count += 1

            # 3. Sanctioned amount closeness
            amt_i = row_i["sanctioned_amount"]
            amt_j = row_j["sanctioned_amount"]
            if amt_i > 0 and amt_j > 0:
                diff_ratio = abs(amt_i - amt_j) / max(amt_i, amt_j)
                if diff_ratio <= settings.AMOUNT_CLOSENESS_RATIO:
                    signals.append(f"Similar sanctioned amount (diff: {diff_ratio * 100:.1f}%)")
                    signal_count += 1

            # 4. Same work type
            if row_i["work_type"] == row_j["work_type"]:
                signals.append("Same work type")
                signal_count += 1

            # 5. Overlapping execution window
            try:
                start_i = pd.Timestamp(row_i.get("start_date"))
                end_i = pd.Timestamp(row_i.get("expected_completion", start_i))
                start_j = pd.Timestamp(row_j.get("start_date"))
                end_j = pd.Timestamp(row_j.get("expected_completion", start_j))
                overlap = execution_overlap_days(start_i, end_i, start_j, end_j)
                if overlap >= settings.TIME_OVERLAP_DAYS:
                    signals.append(f"Overlapping execution window ({overlap} days)")
                    signal_count += 1
            except Exception:
                pass

            # 6. Same agency or contractor
            if row_i["agency"] == row_j["agency"]:
                signals.append("Same implementing agency")
                signal_count += 0.5  # Weaker signal alone
            if row_i["contractor"] == row_j["contractor"]:
                signals.append("Same contractor")
                signal_count += 0.5

            # Require multiple aligned signals
            if signal_count >= 3:
                match_score = min(100, signal_count * 20)
                best_matches.append({
                    "project_id": row_j["project_id"],
                    "distance_km": round(dist_km, 2) if dist_km is not None else None,
                    "text_similarity": round(text_sim, 3),
                    "signals": signals,
                    "match_strength": round(match_score, 2),
                })

        # Sort by match strength
        best_matches.sort(key=lambda m: m["match_strength"], reverse=True)

        # Overall similarity score = max match strength (capped at 100)
        top_score = best_matches[0]["match_strength"] if best_matches else 0.0

        results[row_i["project_id"]] = {
            "score": round(top_score, 2),
            "similar_projects": best_matches[:5],  # Top 5 matches
        }

    return results
