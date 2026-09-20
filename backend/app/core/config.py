"""
Application configuration using pydantic-settings.
Loads from environment variables / .env file.
"""

from pydantic_settings import BaseSettings
from pathlib import Path


class Settings(BaseSettings):
    APP_NAME: str = "Mantri Drishti"
    APP_VERSION: str = "1.0.0"
    APP_DESCRIPTION: str = "AI-Powered MPLADS Risk Intelligence Platform"

    # Database — SQLite for V1
    DATABASE_URL: str = "sqlite:///./mantri_drishti.db"

    # CORS — allow React dev server
    CORS_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
    ]

    # Paths
    BASE_DIR: Path = Path(__file__).resolve().parent.parent.parent
    DATA_DIR: Path = BASE_DIR / "data"
    CSV_PATH: Path = DATA_DIR / "sample_projects.csv"

    # Risk fusion weights (must sum to 1.0)
    WEIGHT_RULES: float = 0.35
    WEIGHT_ISOLATION_FOREST: float = 0.30
    WEIGHT_SIMILARITY: float = 0.15
    WEIGHT_PEER_BENCHMARK: float = 0.20

    # Rule engine thresholds
    HIGH_EXPENDITURE_RATIO: float = 80.0   # % of sanctioned amount spent
    LOW_PROGRESS_THRESHOLD: float = 40.0   # % physical progress
    LARGE_PROGRESS_GAP: float = 30.0       # percentage-point gap
    EXPENDITURE_DEVIATION_FACTOR: float = 1.5  # times peer median

    # Similarity thresholds
    TEXT_SIMILARITY_THRESHOLD: float = 0.55
    GEO_PROXIMITY_KM: float = 2.0
    AMOUNT_CLOSENESS_RATIO: float = 0.30  # 30% difference
    TIME_OVERLAP_DAYS: int = 90

    # Isolation Forest
    IF_CONTAMINATION: float = 0.10
    IF_RANDOM_STATE: int = 42

    model_config = {"env_prefix": "MD_", "env_file": ".env"}


settings = Settings()
