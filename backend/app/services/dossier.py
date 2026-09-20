"""Peer benchmarking and dossier generator."""

import numpy as np
import pandas as pd

#  ENGINE 4: PEER BENCHMARKING

def _select_peers(
    target: pd.Series,
    df: pd.DataFrame,
    min_peers: int = 3,
) -> pd.DataFrame:
    """
    Select peer projects for comparison.
    
    Criteria:
      1. Same work type
      2. Sanctioned amount within 0.5x–2x of target
      3. Same state (if enough peers exist)
    """
    peers = df[df["project_id"] != target["project_id"]].copy()

    # Same work type
    same_type = peers[peers["work_type"] == target["work_type"]]

    if len(same_type) >= min_peers:
        peers = same_type

        # Similar scale (0.5x – 2x sanctioned)
        amt = target["sanctioned_amount"]
        if amt > 0:
            scale_filtered = peers[
                (peers["sanctioned_amount"] >= amt * 0.5) &
                (peers["sanctioned_amount"] <= amt * 2.0)
            ]
            if len(scale_filtered) >= min_peers:
                peers = scale_filtered

        # Same state (if enough remain)
        same_state = peers[peers["state"] == target["state"]]
        if len(same_state) >= min_peers:
            peers = same_state

    return peers

def _benchmark_metric(
    value: float,
    peers: pd.Series,
    metric_name: str,
    higher_is_worse: bool = True,
) -> dict:
    """
    Compare a single metric against peer distribution.
    
    Returns deviation classification + stats.
    """
    if len(peers) < 2:
        return {
            "metric": metric_name,
            "project_value": round(value, 2),
            "peer_median": 0,
            "peer_q1": 0,
            "peer_q3": 0,
            "peer_group_size": len(peers),
            "deviation": "insufficient_peers",
        }

    median = float(peers.median())
    q1 = float(peers.quantile(0.25))
    q3 = float(peers.quantile(0.75))
    iqr = q3 - q1

    if higher_is_worse:
        if value > q3 + 1.5 * iqr:
            deviation = "above_iqr"
        elif value < q1 - 1.5 * iqr:
            deviation = "below_iqr"
        else:
            deviation = "within_range"
    else:
        # For metrics where LOWER is worse (e.g., progress)
        if value < q1 - 1.5 * iqr:
            deviation = "below_iqr"
        elif value > q3 + 1.5 * iqr:
            deviation = "above_iqr"
        else:
            deviation = "within_range"

    return {
        "metric": metric_name,
        "project_value": round(value, 2),
        "peer_median": round(median, 2),
        "peer_q1": round(q1, 2),
        "peer_q3": round(q3, 2),
        "peer_group_size": len(peers),
        "deviation": deviation,
    }

def run_peer_benchmarking(df: pd.DataFrame) -> dict:
    """
    Compare each project against its contextual peers.

    Metrics compared:
      - expenditure_ratio (higher = more concerning)
      - progress_gap (higher = more concerning)
      - delay_days (higher = more concerning)

    Returns:
        dict[project_id -> {
            "score": float (0–100),
            "deviations": list[dict]
        }]
    """
    results = {}

    for _, row in df.iterrows():
        pid = row["project_id"]
        peers = _select_peers(row, df)

        deviations = []

        # Benchmark expenditure_ratio
        er_bench = _benchmark_metric(
            row["expenditure_ratio"], peers["expenditure_ratio"],
            "expenditure_ratio", higher_is_worse=True,
        )
        deviations.append(er_bench)

        # Benchmark progress_gap
        pg_bench = _benchmark_metric(
            row["progress_gap"], peers["progress_gap"],
            "progress_gap", higher_is_worse=True,
        )
        deviations.append(pg_bench)

        # Benchmark delay_days
        dd_bench = _benchmark_metric(
            row["delay_days"], peers["delay_days"],
            "delay_days", higher_is_worse=True,
        )
        deviations.append(dd_bench)

        # Score: count how many metrics deviate beyond IQR
        outlier_count = sum(
            1 for d in deviations
            if d["deviation"] in ("above_iqr", "below_iqr")
        )

        if outlier_count == 3:
            score = 90.0
        elif outlier_count == 2:
            score = 65.0
        elif outlier_count == 1:
            score = 35.0
        else:
            score = 10.0

        # Bonus: if NO peers found, lower confidence but maintain score
        if len(peers) < 3:
            score = min(score, 40.0)  # Cap when peers are insufficient

        results[pid] = {
            "score": round(score, 2),
            "deviations": deviations,
        }

    return results
