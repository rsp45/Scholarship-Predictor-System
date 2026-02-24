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
DATA_PATH = BASE_DIR / "data_generation" / "raw_data.csv"
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
]

NUMERICAL_FEATURES = [
    "Family_Income",
    "Mh_CET_Percentile",
    "JEE_Percentile",
    "University_Test_Score",
    "12th_Percentage",
    "Extracurricular_Score",
]

CATEGORICAL_FEATURES = ["Caste_Category"]

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


def load_data(path: Path = DATA_PATH) -> pd.DataFrame:
    """Load raw CSV data and validate that required columns are present."""
    logger.info("Loading data from %s", path)
    df = pd.read_csv(path)
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
      - OneHotEncoder   → Caste_Category
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
    artifacts_dir: Path = ARTIFACTS_DIR,
) -> None:
    """Persist the preprocessor and processed data arrays to disk."""
    artifacts_dir.mkdir(parents=True, exist_ok=True)

    # Preprocessor object (needed by the Streamlit app at inference time)
    preprocessor_path = artifacts_dir / "preprocessor.pkl"
    joblib.dump(preprocessor, preprocessor_path)
    logger.info("Saved preprocessor → %s", preprocessor_path)

    # Processed numpy arrays (consumed by the training notebook / script)
    for name, arr in [
        ("X_train", X_train_processed),
        ("X_test", X_test_processed),
        ("y_train", y_train.to_numpy()),
        ("y_test", y_test.to_numpy()),
    ]:
        out = artifacts_dir / f"{name}.npy"
        np.save(out, arr)
        logger.info("Saved %s → %s  (shape %s)", name, out, arr.shape)


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
    save_artifacts(preprocessor, X_train_proc, X_test_proc, y_train, y_test)

    logger.info("=" * 60)
    logger.info("DATA PREPROCESSING COMPLETE")
    logger.info("=" * 60)


if __name__ == "__main__":
    run_pipeline()
