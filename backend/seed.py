"""Seed database from sample dataset."""

import sys
from pathlib import Path

# Ensure the backend directory is in the Python path
sys.path.insert(0, str(Path(__file__).resolve().parent))

from app.core.config import settings
from app.db.database import engine, SessionLocal, Base
from app.db.models import Project, RiskAssessment
from app.services.project_service import seed_projects

def main():
    print("=" * 60)
    print("  MANTRI DRISHTI — Database Seed")
    print("=" * 60)

    # 1. Create tables
    print("\n[1/3] Creating database tables...")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    print("      Tables created.")

    # 2. Load CSV → fingerprint → persist
    csv_path = settings.CSV_PATH
    print(f"\n[2/3] Loading data from: {csv_path}")
    if not Path(csv_path).exists():
        print(f"      ERROR: CSV not found at {csv_path}")
        print("      Run 'python generate_data.py' first to create the dataset.")
        sys.exit(1)

    db = SessionLocal()
    try:
        count = seed_projects(db, csv_path)
        print(f"      Loaded {count} projects with fingerprint features.")

        # 3. Run intelligence engines (Phase 2 — will be added later)
        print("\n[3/3] Running intelligence engines...")
        try:
            from app.services.risk_engine import run_full_analysis
            assessed = run_full_analysis(db)
            print(f"      Risk assessment complete for {assessed} projects.")
        except ImportError:
            print("      Intelligence engines not yet implemented — skipping.")
            print("      (This is expected in Phase 1)")

        # Summary
        print("\n" + "=" * 60)
        print("  SEED COMPLETE")
        print("=" * 60)

        projects = db.query(Project).all()
        print(f"\n  Total projects:  {len(projects)}")

        if projects:
            avg_progress = sum(p.physical_progress for p in projects) / len(projects)
            delayed = sum(1 for p in projects if p.delay_days and p.delay_days > 0)
            high_gap = sum(1 for p in projects if p.progress_gap and p.progress_gap > 30)
            print(f"  Avg progress:    {avg_progress:.1f}%")
            print(f"  Delayed:         {delayed}")
            print(f"  Large gap (>30): {high_gap}")

        assessments = db.query(RiskAssessment).count()
        if assessments:
            print(f"  Risk assessed:   {assessments}")

        print()
    finally:
        db.close()

if __name__ == "__main__":
    main()
