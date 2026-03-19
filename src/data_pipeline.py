"""
data_pipeline.py
================
Modular data-preprocessing pipeline for the Scholarship Predictor System.

Converts the exploratory logic from notebooks/1_preprocessing.ipynb into a
professional, re-runnable script.

Usage:
    python -m src.data_pipeline          # from project root
    python src/data_pipeline.py          # also works standalone
"""

import logging
import sqlite3
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import OneHotEncoder, StandardScaler

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

# Resolve paths relative to the repo root (parent of src/)
BASE_DIR = Path(__file__).resolve().parent.parent
DB_PATH = BASE_DIR / "data" / "scholarship.db"
ARTIFACTS_DIR = BASE_DIR / "models"

# Feature definitions — single source of truth
TARGET_COL = "Scholarship_Priority_Score"

FEATURES_TO_USE = [
    "Family_Income",
    "Caste_Category",
    "Domicile_Maharashtra",
    "Mh_CET_Percentile",
    "JEE_Percentile",
    "University_Test_Score",
    "12th_Percentage",
    "Extracurricular_Score",
    "10th_Percentage",
    "Gender",
    "Parent_Occupation",
    "Gap_Year",
    "Disability_Status",
    "College_Branch",
]

NUMERICAL_FEATURES = [
    "Family_Income",
    "Mh_CET_Percentile",
    "JEE_Percentile",
    "University_Test_Score",
    "12th_Percentage",
    "Extracurricular_Score",
    "10th_Percentage",
    "Gap_Year",
]

CATEGORICAL_FEATURES = [
    "Caste_Category",
    "Gender",
    "Parent_Occupation",
    "Disability_Status",
    "College_Branch",
]

# Logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Pipeline Steps
# ---------------------------------------------------------------------------


# Column mapping: DB uses lowercase names → pipeline expects mixed-case
DB_COL_MAP = {
    "application_id": "Application_ID",
    "applicant_name": "Applicant_Name",
    "family_income": "Family_Income",
    "caste_category": "Caste_Category",
    "domicile_maharashtra": "Domicile_Maharashtra",
    "mh_cet_percentile": "Mh_CET_Percentile",
    "jee_percentile": "JEE_Percentile",
    "university_test_score": "University_Test_Score",
    "twelfth_percentage": "12th_Percentage",
    "extracurricular_score": "Extracurricular_Score",
    "tenth_percentage": "10th_Percentage",
    "gender": "Gender",
    "parent_occupation": "Parent_Occupation",
    "gap_year": "Gap_Year",
    "disability_status": "Disability_Status",
    "college_branch": "College_Branch",
    "predicted_priority_score": "Scholarship_Priority_Score",
}


def load_data(db_path: Path = DB_PATH) -> pd.DataFrame:
    """Load applicant data from SQLite and validate required columns."""
    logger.info("Loading data from %s", db_path)
    conn = sqlite3.connect(str(db_path))
    try:
        df = pd.read_sql_query("SELECT * FROM applicants", conn)
    finally:
        conn.close()

    # Rename DB columns to the mixed-case names the pipeline expects
    df.rename(columns=DB_COL_MAP, inplace=True)
    logger.info("  Shape: %s | Columns: %s", df.shape, list(df.columns))

    # Validate expected columns
    required = set(FEATURES_TO_USE + [TARGET_COL])
    missing = required - set(df.columns)
    if missing:
        raise ValueError(f"Missing required columns in data: {missing}")

    return df


def select_features(df: pd.DataFrame) -> tuple[pd.DataFrame, pd.Series]:
    """
    Select model features (X) and target (y).

    Identifiers like Application_ID and Applicant_Name are intentionally
    excluded to prevent overfitting on non-predictive attributes.
    """
    X = df[FEATURES_TO_USE].copy()
    y = df[TARGET_COL].copy()
    logger.info("Selected %d features for training", len(FEATURES_TO_USE))
    return X, y


def split_data(
    X: pd.DataFrame,
    y: pd.Series,
    test_size: float = 0.2,
    random_state: int = 42,
) -> tuple[pd.DataFrame, pd.DataFrame, pd.Series, pd.Series]:
    """Split data into training (80 %) and testing (20 %) sets."""
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=test_size, random_state=random_state
    )
    logger.info("  Training set: %s | Test set: %s", X_train.shape, X_test.shape)
    return X_train, X_test, y_train, y_test


def build_preprocessor() -> ColumnTransformer:
    """
    Build a sklearn ColumnTransformer:
      - StandardScaler  → numerical features
      - OneHotEncoder   → categorical features
      - passthrough     → Domicile_Maharashtra (already binary 0/1)
    """
    preprocessor = ColumnTransformer(
        transformers=[
            ("num", StandardScaler(), NUMERICAL_FEATURES),
            (
                "cat",
                OneHotEncoder(handle_unknown="ignore", sparse_output=False),
                CATEGORICAL_FEATURES,
            ),
        ],
        remainder="passthrough",  # keeps Domicile_Maharashtra as-is
    )
    logger.info("Built ColumnTransformer (num + cat + passthrough)")
    return preprocessor


def fit_and_transform(
    preprocessor: ColumnTransformer,
    X_train: pd.DataFrame,
    X_test: pd.DataFrame,
) -> tuple[np.ndarray, np.ndarray]:
    """Fit the preprocessor on training data and transform both splits."""
    logger.info("Fitting preprocessor on training data …")
    X_train_processed = preprocessor.fit_transform(X_train)
    X_test_processed = preprocessor.transform(X_test)
    logger.info(
        "  Processed shapes — train: %s, test: %s",
        X_train_processed.shape,
        X_test_processed.shape,
    )
    return X_train_processed, X_test_processed


def save_artifacts(
    preprocessor: ColumnTransformer,
    X_train_processed: np.ndarray,
    X_test_processed: np.ndarray,
    y_train: pd.Series,
    y_test: pd.Series,
    X_test_raw: pd.DataFrame,
    artifacts_dir: Path = ARTIFACTS_DIR,
) -> None:
    """Persist the preprocessor, processed arrays, and raw X_test to disk."""
    artifacts_dir.mkdir(parents=True, exist_ok=True)

    # Preprocessor object (needed by the Streamlit app at inference time)
    preprocessor_path = artifacts_dir / "preprocessor.pkl"
    joblib.dump(preprocessor, preprocessor_path)
    logger.info("Saved preprocessor → %s", preprocessor_path)

    # Processed numpy arrays (consumed by the training script)
    for name, arr in [
        ("X_train", X_train_processed),
        ("X_test", X_test_processed),
        ("y_train", y_train.to_numpy()),
        ("y_test", y_test.to_numpy()),
    ]:
        out = artifacts_dir / f"{name}.npy"
        np.save(out, arr)
        logger.info("Saved %s → %s  (shape %s)", name, out, arr.shape)

    # Raw X_test DataFrame (needed by model_trainer.py for fairness audit)
    raw_test_path = artifacts_dir / "X_test_raw.csv"
    X_test_raw.to_csv(raw_test_path, index=False)
    logger.info("Saved raw X_test → %s  (shape %s)", raw_test_path, X_test_raw.shape)


# ---------------------------------------------------------------------------
# Orchestrator
# ---------------------------------------------------------------------------


def run_pipeline() -> None:
    """Execute the full data-preprocessing pipeline end-to-end."""
    logger.info("=" * 60)
    logger.info("STARTING DATA PREPROCESSING PIPELINE")
    logger.info("=" * 60)

    df = load_data()
    X, y = select_features(df)
    X_train, X_test, y_train, y_test = split_data(X, y)
    preprocessor = build_preprocessor()
    X_train_proc, X_test_proc = fit_and_transform(preprocessor, X_train, X_test)
    save_artifacts(preprocessor, X_train_proc, X_test_proc, y_train, y_test, X_test)

    logger.info("=" * 60)
    logger.info("DATA PREPROCESSING COMPLETE")
    logger.info("=" * 60)


if __name__ == "__main__":
    run_pipeline()
