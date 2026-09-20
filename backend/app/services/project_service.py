"""Data ingestion, preprocessing, and fingerprint computation."""

from datetime import date, timedelta
from pathlib import Path

import numpy as np
import pandas as pd
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.models import Project

# Data Loading & Cleaning

def load_csv(csv_path: Path | str | None = None) -> pd.DataFrame:
    """Load the raw CSV into a DataFrame."""
    path = csv_path or settings.CSV_PATH
    df = pd.read_csv(path, parse_dates=["start_date", "expected_completion"])
    return df

def clean_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    """Validate types, handle nulls, clamp values, and ensure consistency."""
    df = df.copy()

    # String fields: strip whitespace
    str_cols = ["project_id", "state", "district", "constituency",
                "work_type", "description", "agency", "contractor"]
    for col in str_cols:
        df[col] = df[col].astype(str).str.strip()

    # Numeric fields: coerce and floor at 0
    num_cols = ["sanctioned_amount", "released_amount", "expenditure", "physical_progress"]
    for col in num_cols:
        df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0).clip(lower=0)

    # Clamp physical_progress to 0–100
    df["physical_progress"] = df["physical_progress"].clip(upper=100)

    # Dates: ensure valid
    df["start_date"] = pd.to_datetime(df["start_date"], errors="coerce")
    df["expected_completion"] = pd.to_datetime(df["expected_completion"], errors="coerce")

    # Drop rows missing critical fields
    df = df.dropna(subset=["project_id", "start_date", "expected_completion"])

    # Coordinates: keep NaN if missing
    df["latitude"] = pd.to_numeric(df["latitude"], errors="coerce")
    df["longitude"] = pd.to_numeric(df["longitude"], errors="coerce")

    return df.reset_index(drop=True)

# Fingerprint Feature Engineering

def compute_fingerprint(df: pd.DataFrame, reference_date: date | None = None) -> pd.DataFrame:
    """
    Compute all derived fingerprint features.

    Per the spec:
      - expenditure_ratio  = expenditure / sanctioned_amount * 100
      - release_ratio      = released_amount / sanctioned_amount * 100
      - spending_velocity  = expenditure / elapsed_days
      - expected_progress  = (elapsed_days / planned_duration_days) * 100  [clamped 0-100]
      - progress_gap       = expected_progress - physical_progress
      - planned_duration_days = (expected_completion - start_date).days
      - elapsed_days       = (today - start_date).days
      - delay_days         = max(0, today - expected_completion).days
    """
    df = df.copy()
    today = pd.Timestamp(reference_date or date.today())

    # Financial features
    df["expenditure_ratio"] = np.where(
        df["sanctioned_amount"] > 0,
        (df["expenditure"] / df["sanctioned_amount"]) * 100,
        0.0,
    )
    df["release_ratio"] = np.where(
        df["sanctioned_amount"] > 0,
        (df["released_amount"] / df["sanctioned_amount"]) * 100,
        0.0,
    )

    # Temporal features
    df["planned_duration_days"] = (df["expected_completion"] - df["start_date"]).dt.days
    df["elapsed_days"] = (today - df["start_date"]).dt.days.clip(lower=0)

    overdue = (today - df["expected_completion"]).dt.days
    df["delay_days"] = overdue.clip(lower=0)

    # Spending velocity
    df["spending_velocity"] = np.where(
        df["elapsed_days"] > 0,
        df["expenditure"] / df["elapsed_days"],
        0.0,
    )

    # Expected progress (TIMELINE-BASED, not 100 - physical)
    df["expected_progress"] = np.where(
        df["planned_duration_days"] > 0,
        (df["elapsed_days"] / df["planned_duration_days"]) * 100,
        0.0,
    )
    df["expected_progress"] = df["expected_progress"].clip(0, 100)

    # Progress gap
    df["progress_gap"] = df["expected_progress"] - df["physical_progress"]

    # Round floats for cleanliness
    float_cols = [
        "expenditure_ratio", "release_ratio", "spending_velocity",
        "expected_progress", "progress_gap",
    ]
    df[float_cols] = df[float_cols].round(2)

    return df

# Database Persistence

def df_to_projects(df: pd.DataFrame) -> list[Project]:
    """Convert a fingerprinted DataFrame into ORM Project objects."""
    projects = []
    for _, row in df.iterrows():
        p = Project(
            project_id=row["project_id"],
            state=row["state"],
            district=row["district"],
            constituency=row["constituency"],
            work_type=row["work_type"],
            description=row["description"],
            sanctioned_amount=float(row["sanctioned_amount"]),
            released_amount=float(row["released_amount"]),
            expenditure=float(row["expenditure"]),
            physical_progress=float(row["physical_progress"]),
            start_date=row["start_date"].date() if hasattr(row["start_date"], "date") else row["start_date"],
            expected_completion=row["expected_completion"].date() if hasattr(row["expected_completion"], "date") else row["expected_completion"],
            latitude=float(row["latitude"]) if pd.notna(row["latitude"]) else None,
            longitude=float(row["longitude"]) if pd.notna(row["longitude"]) else None,
            agency=row["agency"],
            contractor=row["contractor"],
            # Computed fingerprint
            expenditure_ratio=float(row["expenditure_ratio"]),
            release_ratio=float(row["release_ratio"]),
            spending_velocity=float(row["spending_velocity"]),
            expected_progress=float(row["expected_progress"]),
            progress_gap=float(row["progress_gap"]),
            planned_duration_days=int(row["planned_duration_days"]),
            elapsed_days=int(row["elapsed_days"]),
            delay_days=int(row["delay_days"]),
        )
        projects.append(p)
    return projects

def seed_projects(db: Session, csv_path: Path | str | None = None) -> int:
    """Full pipeline: CSV → clean → fingerprint → persist. Returns count."""
    df = load_csv(csv_path)
    df = clean_dataframe(df)
    df = compute_fingerprint(df)
    projects = df_to_projects(df)

    # Clear existing and insert fresh
    db.query(Project).delete()
    db.add_all(projects)
    db.commit()

    return len(projects)
