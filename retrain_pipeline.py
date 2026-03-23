# FILE: retrain_pipeline.py
# ===========================================================================
# Automated Retraining Pipeline for Tejas Scholarship Allocator
# ===========================================================================
# This script can be called via CLI or scheduled task to automatically:
# 1. Extract all records from the SQLite database (applicants + decision_center)
# 2. Apply Behavioral Cloning: weight records where admins overrode scores 3x
# 3. Run the data preprocessing pipeline
# 4. Retrain the ML model (RandomForest + XGBoost)
# 5. Train K-Means clustering for Applicant Persona assignment
# 6. Save all model artifacts with date-based versioning
# ===========================================================================

import argparse
import logging
import numpy as np
import pandas as pd
import joblib
import os
import sys
import sqlite3
from datetime import datetime
from pathlib import Path
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.cluster import KMeans
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import r2_score, mean_absolute_error, silhouette_score
from sklearn.pipeline import Pipeline
from xgboost import XGBRegressor
from fairlearn.metrics import MetricFrame
import shap

# Add src to path for imports
BASE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE_DIR))

from src.db_setup import DB_PATH, get_connection

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

MODELS_DIR = BASE_DIR / "models"
DATA_DIR = BASE_DIR / "data"
LOG_DIR = BASE_DIR / "logs"

# Ensure directories exist
MODELS_DIR.mkdir(parents=True, exist_ok=True)
DATA_DIR.mkdir(parents=True, exist_ok=True)
LOG_DIR.mkdir(parents=True, exist_ok=True)

# Set seed for reproducibility
RANDOM_STATE = 42
np.random.seed(RANDOM_STATE)

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler(LOG_DIR / f"retrain_{datetime.now().strftime('%Y%m%d_%H%M%S')}.log")
    ]
)
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Feature Configuration
# ---------------------------------------------------------------------------

NUMERIC_FEATURES = [
    "Family_Income",
    "10th_Percentage",
    "12th_Percentage",
    "Mh_CET_Percentile",
    "JEE_Percentile",
    "University_Test_Score",
    "Extracurricular_Score",
    "Gap_Year",
    "Domicile_Maharashtra"
]

CATEGORICAL_FEATURES = [
    "Caste_Category",
    "Gender",
    "Parent_Occupation",
    "Disability_Status",
    "College_Branch"
]

TARGET_COLUMN = "predicted_priority_score"

SENSITIVE_FEATURES = ["Caste_Category", "Gender"]

# Behavioral Cloning: weight multiplier for admin-overridden records
OVERRIDE_WEIGHT_MULTIPLIER = 3

# K-Means Clustering Configuration
N_CLUSTERS = 4
CLUSTER_PERSONA_MAP = {
    0: "High Need, Strong Academics",
    1: "Merit Elite",
    2: "Balanced Profile",
    3: "Borderline Candidate",
}


# ---------------------------------------------------------------------------
# Database Extraction (Behavioral Cloning)
# ---------------------------------------------------------------------------

def extract_data_from_database(min_records: int = 100) -> pd.DataFrame:
    """
    Extract applicant records from the SQLite database using Behavioral Cloning.
    
    This function implements a key ML strategy: it pulls from BOTH the base
    applicants table AND the decision_center_applications table. Records where
    an admin manually overrode the ML score are duplicated (weighted 3x) so the
    model learns to replicate human expert judgment over time.
    
    Args:
        min_records: Minimum number of records required for training
    
    Returns:
        DataFrame containing all applicant data with scores
    
    Raises:
        ValueError: If insufficient records are found
    """
    logger.info("=" * 60)
    logger.info("STEP 1: Extracting Data from Database (Behavioral Cloning)")
    logger.info("=" * 60)
    
    # Base query: all scored applicants
    base_query = """
        SELECT
            application_id,
            applicant_name,
            family_income AS Family_Income,
            caste_category AS Caste_Category,
            domicile_maharashtra AS Domicile_Maharashtra,
            mh_cet_percentile AS Mh_CET_Percentile,
            jee_percentile AS JEE_Percentile,
            university_test_score AS University_Test_Score,
            twelfth_percentage AS "12th_Percentage",
            extracurricular_score AS Extracurricular_Score,
            tenth_percentage AS "10th_Percentage",
            gender AS Gender,
            parent_occupation AS Parent_Occupation,
            gap_year AS Gap_Year,
            disability_status AS Disability_Status,
            college_branch AS College_Branch,
            predicted_priority_score,
            0 AS is_override_record
        FROM applicants
        WHERE predicted_priority_score IS NOT NULL
    """
    
    # Override query: decision center records where admin overrode the score
    # These use the admin's final_score as the target (Behavioral Cloning)
    override_query = """
        SELECT
            application_id,
            applicant_name,
            family_income AS Family_Income,
            caste_category AS Caste_Category,
            domicile_maharashtra AS Domicile_Maharashtra,
            mh_cet_percentile AS Mh_CET_Percentile,
            jee_percentile AS JEE_Percentile,
            university_test_score AS University_Test_Score,
            twelfth_percentage AS "12th_Percentage",
            extracurricular_score AS Extracurricular_Score,
            tenth_percentage AS "10th_Percentage",
            gender AS Gender,
            parent_occupation AS Parent_Occupation,
            gap_year AS Gap_Year,
            disability_status AS Disability_Status,
            college_branch AS College_Branch,
            final_score AS predicted_priority_score,
            1 AS is_override_record
        FROM decision_center_applications
        WHERE is_overridden = 1 AND final_score IS NOT NULL
    """
    
    try:
        conn = get_connection(DB_PATH)
        df_base = pd.read_sql_query(base_query, conn)
        df_overrides = pd.read_sql_query(override_query, conn)
        conn.close()
        
        logger.info(f"   Base applicant records: {len(df_base)}")
        logger.info(f"   Admin-overridden records: {len(df_overrides)}")
        
        # Behavioral Cloning: duplicate override records to weight them
        if not df_overrides.empty:
            override_weighted = pd.concat(
                [df_overrides] * OVERRIDE_WEIGHT_MULTIPLIER,
                ignore_index=True
            )
            logger.info(f"   Override records after {OVERRIDE_WEIGHT_MULTIPLIER}x weighting: {len(override_weighted)}")
            df = pd.concat([df_base, override_weighted], ignore_index=True)
        else:
            logger.info("   No override records found - using base data only")
            df = df_base
        
        logger.info(f"   Total training records (after weighting): {len(df)}")
        
        if len(df) < min_records:
            raise ValueError(
                f"Insufficient data for retraining: {len(df)} records found, "
                f"minimum {min_records} required"
            )
        
        # Data quality checks
        null_scores = df["predicted_priority_score"].isna().sum()
        if null_scores > 0:
            logger.warning(f"   Found {null_scores} records with null scores - filtering out")
            df = df.dropna(subset=["predicted_priority_score"])
        
        logger.info(f"   Final data shape: {df.shape}")
        logger.info(f"   Score range: {df['predicted_priority_score'].min():.2f} - {df['predicted_priority_score'].max():.2f}")
        override_pct = round((df["is_override_record"].sum() / len(df)) * 100, 1) if len(df) > 0 else 0
        logger.info(f"   Override-sourced records: {override_pct}% of training data")
        
        return df
        
    except sqlite3.Error as e:
        logger.error(f"Database error: {e}")
        raise


# ---------------------------------------------------------------------------
# Data Preprocessing
# ---------------------------------------------------------------------------

def preprocess_data(df: pd.DataFrame, test_size: float = 0.2) -> tuple:
    """
    Preprocess the data: split into train/test and create preprocessing pipeline.
    
    Args:
        df: DataFrame with applicant data
        test_size: Fraction of data to use for testing
    
    Returns:
        Tuple of (X_train, X_test, y_train, y_test, preprocessor, X_test_raw)
    """
    logger.info("\n" + "=" * 60)
    logger.info("STEP 2: Data Preprocessing")
    logger.info("=" * 60)
    
    # Separate features and target
    X = df[NUMERIC_FEATURES + CATEGORICAL_FEATURES].copy()
    y = df[TARGET_COLUMN].copy()
    
    # Keep raw X_test for fairness audit
    X_raw = X.copy()
    
    logger.info(f"   Features: {len(NUMERIC_FEATURES)} numeric, {len(CATEGORICAL_FEATURES)} categorical")
    logger.info(f"   Total samples: {len(X)}")
    
    # Train-test split
    X_train, X_test, y_train, y_test, X_train_raw, X_test_raw = train_test_split(
        X, y, X_raw,
        test_size=test_size,
        random_state=RANDOM_STATE,
        stratify=pd.cut(y, bins=5, labels=["very_low", "low", "medium", "high", "very_high"])
    )
    
    logger.info(f"   Train set: {len(X_train)} samples")
    logger.info(f"   Test set: {len(X_test)} samples")
    
    # Create preprocessing pipeline
    preprocessor = ColumnTransformer(
        transformers=[
            ("num", StandardScaler(), NUMERIC_FEATURES),
            ("cat", OneHotEncoder(handle_unknown="ignore", sparse_output=False), CATEGORICAL_FEATURES)
        ]
    )
    
    # Fit and transform
    X_train_processed = preprocessor.fit_transform(X_train)
    X_test_processed = preprocessor.transform(X_test)
    
    logger.info(f"   Processed train shape: {X_train_processed.shape}")
    logger.info(f"   Processed test shape: {X_test_processed.shape}")
    
    return X_train_processed, X_test_processed, y_train.values, y_test.values, preprocessor, X_test_raw


# ---------------------------------------------------------------------------
# Model Training
# ---------------------------------------------------------------------------

def train_models(X_train: np.ndarray, y_train: np.ndarray) -> tuple:
    """
    Train RandomForest and XGBoost models.
    
    Args:
        X_train: Training features
        y_train: Training targets
    
    Returns:
        Tuple of (rf_model, xgb_model)
    """
    logger.info("\n" + "=" * 60)
    logger.info("STEP 3: Training Models")
    logger.info("=" * 60)
    
    # Train RandomForest
    logger.info("   Training RandomForestRegressor...")
    rf_model = RandomForestRegressor(
        n_estimators=200,
        random_state=RANDOM_STATE,
        n_jobs=-1
    )
    rf_model.fit(X_train, y_train)
    logger.info("   RandomForest training complete")
    
    # Train XGBoost
    logger.info("   Training XGBRegressor...")
    xgb_model = XGBRegressor(
        n_estimators=200,
        learning_rate=0.1,
        max_depth=5,
        random_state=RANDOM_STATE,
        n_jobs=-1
    )
    xgb_model.fit(X_train, y_train)
    logger.info("   XGBoost training complete")
    
    return rf_model, xgb_model


def evaluate_and_select_model(
    rf_model,
    xgb_model,
    X_test: np.ndarray,
    y_test: np.ndarray,
    X_test_raw: pd.DataFrame
) -> tuple:
    """
    Evaluate both models and select the best one.
    
    Args:
        rf_model: Trained RandomForest model
        xgb_model: Trained XGBoost model
        X_test: Test features (processed)
        y_test: Test targets
        X_test_raw: Test features (raw, for fairness audit)
    
    Returns:
        Tuple of (best_model, best_name, best_r2, best_mae)
    """
    logger.info("\n" + "=" * 60)
    logger.info("STEP 4: Model Evaluation & Selection")
    logger.info("=" * 60)
    
    # Get predictions
    rf_pred = rf_model.predict(X_test)
    xgb_pred = xgb_model.predict(X_test)
    
    # Calculate metrics
    rf_r2 = r2_score(y_test, rf_pred)
    rf_mae = mean_absolute_error(y_test, rf_pred)
    
    xgb_r2 = r2_score(y_test, xgb_pred)
    xgb_mae = mean_absolute_error(y_test, xgb_pred)
    
    # Print comparison
    logger.info(f"\n   {'Model':<25} {'R² Score':>10} {'MAE':>10}")
    logger.info(f"   {'-' * 45}")
    logger.info(f"   {'RandomForestRegressor':<25} {rf_r2:>10.4f} {rf_mae:>10.4f}")
    logger.info(f"   {'XGBRegressor':<25} {xgb_r2:>10.4f} {xgb_mae:>10.4f}")
    
    # Select winner
    if rf_r2 >= xgb_r2:
        best_model = rf_model
        best_name = "RandomForestRegressor"
        best_r2 = rf_r2
        best_mae = rf_mae
    else:
        best_model = xgb_model
        best_name = "XGBRegressor"
        best_r2 = xgb_r2
        best_mae = xgb_mae
    
    logger.info(f"\n   WINNER: {best_name} (R² = {best_r2:.4f}, MAE = {best_mae:.4f})")
    
    # Fairness audit
    logger.info("\n   --- Fairness Audit ---")
    y_pred = best_model.predict(X_test)
    
    for sensitive_feature in SENSITIVE_FEATURES:
        if sensitive_feature in X_test_raw.columns:
            metric_frame = MetricFrame(
                metrics={"MAE": mean_absolute_error, "R²": r2_score},
                y_true=y_test,
                y_pred=y_pred,
                sensitive_features=X_test_raw[sensitive_feature]
            )
            logger.info(f"\n   Fairness by {sensitive_feature}:")
            logger.info(f"   Overall: MAE={metric_frame.overall['MAE']:.4f}, R²={metric_frame.overall['R²']:.4f}")
    
    return best_model, best_name, best_r2, best_mae


# ---------------------------------------------------------------------------
# Unsupervised ML: K-Means Applicant Persona Clustering
# ---------------------------------------------------------------------------

def train_clustering_model(
    X_train: np.ndarray,
    n_clusters: int = N_CLUSTERS
) -> KMeans:
    """
    Train a K-Means clustering model to assign Applicant Personas.
    
    This is an Unsupervised ML branch that groups applicants into
    data-driven personas based on their feature profiles, providing
    insights beyond the supervised priority score.
    
    Args:
        X_train: Preprocessed training features
        n_clusters: Number of clusters (default 4)
    
    Returns:
        Fitted KMeans model
    """
    logger.info("\n" + "=" * 60)
    logger.info("STEP 3b: Unsupervised ML - K-Means Applicant Personas")
    logger.info("=" * 60)
    
    kmeans = KMeans(
        n_clusters=n_clusters,
        random_state=RANDOM_STATE,
        n_init=10,
        max_iter=300
    )
    kmeans.fit(X_train)
    
    # Evaluate clustering quality
    labels = kmeans.labels_
    inertia = kmeans.inertia_
    sil_score = silhouette_score(X_train, labels) if len(set(labels)) > 1 else 0.0
    
    logger.info(f"   K-Means trained with k={n_clusters}")
    logger.info(f"   Inertia: {inertia:.2f}")
    logger.info(f"   Silhouette Score: {sil_score:.4f}")
    
    # Log cluster distribution
    unique, counts = np.unique(labels, return_counts=True)
    for cluster_id, count in zip(unique, counts):
        persona = CLUSTER_PERSONA_MAP.get(cluster_id, f"Cluster {cluster_id}")
        logger.info(f"   Cluster {cluster_id} ({persona}): {count} applicants ({count/len(labels)*100:.1f}%)")
    
    return kmeans


# ---------------------------------------------------------------------------
# Model Saving with Versioning
# ---------------------------------------------------------------------------

def save_model_with_versioning(
    model,
    preprocessor,
    X_train: np.ndarray,
    model_name: str,
    r2_score: float,
    mae: float,
    kmeans_model: KMeans = None,
    kmeans_silhouette: float = 0.0,
    version: str = None
) -> str:
    """
    Save the model with date-based versioning.
    
    Args:
        model: Trained model
        preprocessor: Fitted preprocessor
        X_train: Training data (for SHAP)
        model_name: Name of the model
        r2_score: R² score
        mae: Mean absolute error
        kmeans_model: Trained K-Means clustering model (optional)
        kmeans_silhouette: Silhouette score for the K-Means model
        version: Optional version string (defaults to current date)
    
    Returns:
        Path to the saved model
    """
    logger.info("\n" + "=" * 60)
    logger.info("STEP 6: Saving Model with Versioning")
    logger.info("=" * 60)
    
    # Generate version string
    if version is None:
        version = datetime.now().strftime("%Y%m%d")
    
    versioned_name = f"scholarship_model_v{version}"
    
    # Build production pipeline
    pipeline = Pipeline([
        ("preprocessor", preprocessor),
        ("regressor", model)
    ])
    
    # Save versioned pipeline
    versioned_path = MODELS_DIR / f"{versioned_name}.pkl"
    joblib.dump(pipeline, versioned_path)
    logger.info(f"   Saved versioned model: {versioned_path}")
    
    # Also save as production model (overwrites previous)
    production_path = MODELS_DIR / "scholarship_model.pkl"
    joblib.dump(pipeline, production_path)
    logger.info(f"   Updated production model: {production_path}")
    
    # Save preprocessor separately
    preprocessor_path = MODELS_DIR / "preprocessor.pkl"
    joblib.dump(preprocessor, preprocessor_path)
    logger.info(f"   Saved preprocessor: {preprocessor_path}")
    
    # Save K-Means clustering model
    if kmeans_model is not None:
        kmeans_path = MODELS_DIR / "kmeans_model.pkl"
        joblib.dump(kmeans_model, kmeans_path)
        logger.info(f"   Saved K-Means persona model: {kmeans_path}")
    
    # Create and save SHAP explainer
    logger.info("   Creating SHAP explainer...")
    explainer = shap.Explainer(model, X_train)
    explainer_path = MODELS_DIR / "shap_explainer.pkl"
    joblib.dump(explainer, explainer_path)
    logger.info(f"   Saved SHAP explainer: {explainer_path}")
    
    # Save metadata
    metadata = {
        "version": version,
        "model_name": model_name,
        "r2_score": float(r2_score),
        "mae": float(mae),
        "kmeans_clusters": N_CLUSTERS,
        "kmeans_silhouette": float(kmeans_silhouette),
        "kmeans_persona_map": CLUSTER_PERSONA_MAP,
        "behavioral_cloning_weight": OVERRIDE_WEIGHT_MULTIPLIER,
        "training_date": datetime.now().isoformat(),
        "training_samples": len(X_train),
        "random_state": RANDOM_STATE
    }
    metadata_path = MODELS_DIR / f"model_metadata_v{version}.json"
    import json
    with open(metadata_path, "w") as f:
        json.dump(metadata, f, indent=2)
    logger.info(f"   Saved metadata: {metadata_path}")
    
    # Save training arrays for future reference
    logger.info("   Saving training artifacts...")
    np.save(MODELS_DIR / "X_train.npy", X_train)
    
    return str(production_path)


def save_training_data(
    X_train: np.ndarray,
    X_test: np.ndarray,
    y_train: np.ndarray,
    y_test: np.ndarray,
    X_test_raw: pd.DataFrame
):
    """Save processed training data for future use."""
    logger.info("   Saving processed data arrays...")
    np.save(MODELS_DIR / "X_train.npy", X_train)
    np.save(MODELS_DIR / "X_test.npy", X_test)
    np.save(MODELS_DIR / "y_train.npy", y_train)
    np.save(MODELS_DIR / "y_test.npy", y_test)
    X_test_raw.to_csv(MODELS_DIR / "X_test_raw.csv", index=False)
    logger.info("   All training artifacts saved")


# ---------------------------------------------------------------------------
# Main Pipeline
# ---------------------------------------------------------------------------

def run_retraining_pipeline(
    test_size: float = 0.2,
    min_records: int = 100,
    version: str = None,
    dry_run: bool = False
) -> dict:
    """
    Run the complete retraining pipeline.
    
    Args:
        test_size: Fraction of data for testing
        min_records: Minimum records required
        version: Optional version string
        dry_run: If True, don't save the model
    
    Returns:
        Dictionary with results summary
    """
    start_time = datetime.now()
    logger.info("\n" + "=" * 60)
    logger.info("TEJAS SCHOLARSHIP MODEL - AUTOMATED RETRAINING PIPELINE")
    logger.info("=" * 60)
    logger.info(f"Started at: {start_time}")
    
    try:
        # Step 1: Extract data (with Behavioral Cloning weighting)
        df = extract_data_from_database(min_records=min_records)
        
        # Step 2: Preprocess
        X_train, X_test, y_train, y_test, preprocessor, X_test_raw = preprocess_data(df, test_size=test_size)
        
        # Save processed data
        if not dry_run:
            save_training_data(X_train, X_test, y_train, y_test, X_test_raw)
        
        # Step 3a: Train supervised models
        rf_model, xgb_model = train_models(X_train, y_train)
        
        # Step 3b: Train unsupervised K-Means clustering
        kmeans_model = train_clustering_model(X_train)
        kmeans_sil = silhouette_score(X_train, kmeans_model.labels_) if len(set(kmeans_model.labels_)) > 1 else 0.0
        
        # Step 4: Evaluate and select best supervised model
        best_model, best_name, best_r2, best_mae = evaluate_and_select_model(
            rf_model, xgb_model, X_test, y_test, X_test_raw
        )
        
        # Step 5: Assign persona labels to clusters based on centroid analysis
        _assign_persona_labels(kmeans_model, preprocessor)
        
        # Step 6: Save all model artifacts
        if not dry_run:
            model_path = save_model_with_versioning(
                best_model,
                preprocessor,
                X_train,
                best_name,
                best_r2,
                best_mae,
                kmeans_model=kmeans_model,
                kmeans_silhouette=kmeans_sil,
                version=version
            )
        else:
            model_path = "DRY_RUN_NO_MODEL_SAVED"
            logger.info("\n   DRY RUN: Model not saved")
        
        end_time = datetime.now()
        duration = (end_time - start_time).total_seconds()
        
        logger.info("\n" + "=" * 60)
        logger.info("RETRAINING PIPELINE COMPLETE")
        logger.info("=" * 60)
        logger.info(f"Duration: {duration:.2f} seconds")
        logger.info(f"Supervised Model: {best_name}")
        logger.info(f"R² Score: {best_r2:.4f}")
        logger.info(f"MAE: {best_mae:.4f}")
        logger.info(f"Unsupervised K-Means Silhouette: {kmeans_sil:.4f}")
        logger.info(f"Saved to: {model_path}")
        
        return {
            "success": True,
            "model_path": model_path,
            "model_name": best_name,
            "r2_score": best_r2,
            "mae": best_mae,
            "kmeans_silhouette": kmeans_sil,
            "kmeans_clusters": N_CLUSTERS,
            "training_samples": len(df),
            "duration_seconds": duration,
            "timestamp": end_time.isoformat()
        }
        
    except Exception as e:
        logger.error(f"Pipeline failed: {e}", exc_info=True)
        return {
            "success": False,
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }


def _assign_persona_labels(kmeans_model: KMeans, preprocessor) -> None:
    """
    Analyze cluster centroids to assign meaningful persona labels.
    
    Examines the centroid values of key features (Family_Income, academic scores)
    to dynamically order the clusters by need vs. merit profiles.
    The CLUSTER_PERSONA_MAP is updated in-place based on centroid analysis.
    """
    global CLUSTER_PERSONA_MAP
    
    centroids = kmeans_model.cluster_centers_
    n_numeric = len(NUMERIC_FEATURES)
    
    # Extract the numeric portion of each centroid (first n_numeric columns)
    # Column 0 = Family_Income (standardized), Column 1-5 = academic scores
    income_col = 0  # Family_Income is first numeric feature
    academic_cols = list(range(1, min(6, n_numeric)))  # 10th, 12th, CET, JEE, University
    
    cluster_profiles = []
    for i in range(len(centroids)):
        income_z = centroids[i][income_col]  # Standardized income (negative = low income = high need)
        academic_avg = np.mean([centroids[i][c] for c in academic_cols]) if academic_cols else 0
        cluster_profiles.append((i, income_z, academic_avg))
    
    # Sort by income (ascending = lowest income first = highest need)
    cluster_profiles.sort(key=lambda x: x[1])
    
    persona_labels = [
        "High Need, Strong Academics",
        "Balanced Profile",
        "Merit Elite",
        "Borderline Candidate",
    ]
    
    # Assign labels based on sorted order
    for idx, (cluster_id, _, _) in enumerate(cluster_profiles):
        if idx < len(persona_labels):
            CLUSTER_PERSONA_MAP[cluster_id] = persona_labels[idx]
    
    logger.info("   Persona labels assigned based on centroid analysis:")
    for cid, label in CLUSTER_PERSONA_MAP.items():
        logger.info(f"     Cluster {cid} -> {label}")


# ---------------------------------------------------------------------------
# CLI Interface
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(
        description="Automated Retraining Pipeline for Tejas Scholarship Allocator",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Run full retraining with auto-versioning (date-based)
  python retrain_pipeline.py
  
  # Run with specific version
  python retrain_pipeline.py --version 20240319
  
  # Dry run (train but don't save)
  python retrain_pipeline.py --dry-run
  
  # Adjust test split
  python retrain_pipeline.py --test-size 0.25
  
  # Require minimum records
  python retrain_pipeline.py --min-records 500
        """
    )
    
    parser.add_argument(
        "--version",
        type=str,
        default=None,
        help="Version string for the model (default: current date YYYYMMDD)"
    )
    
    parser.add_argument(
        "--test-size",
        type=float,
        default=0.2,
        help="Fraction of data to use for testing (default: 0.2)"
    )
    
    parser.add_argument(
        "--min-records",
        type=int,
        default=100,
        help="Minimum number of records required for training (default: 100)"
    )
    
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Run training but don't save the model (for testing)"
    )
    
    parser.add_argument(
        "--verbose", "-v",
        action="store_true",
        help="Enable verbose output"
    )
    
    args = parser.parse_args()
    
    # Adjust logging level
    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)
    
    # Run pipeline
    result = run_retraining_pipeline(
        test_size=args.test_size,
        min_records=args.min_records,
        version=args.version,
        dry_run=args.dry_run
    )
    
    # Exit with appropriate code
    if result["success"]:
        print("\n" + "=" * 60)
        print("RETRAINING SUCCESSFUL")
        print("=" * 60)
        print(f"Model: {result['model_name']}")
        print(f"R² Score: {result['r2_score']:.4f}")
        print(f"MAE: {result['mae']:.4f}")
        print(f"Samples: {result['training_samples']}")
        print(f"Path: {result['model_path']}")
        sys.exit(0)
    else:
        print("\n" + "=" * 60)
        print("RETRAINING FAILED")
        print("=" * 60)
        print(f"Error: {result.get('error', 'Unknown error')}")
        sys.exit(1)


if __name__ == "__main__":
    main()
