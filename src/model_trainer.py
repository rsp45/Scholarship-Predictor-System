# FILE: src/model_trainer.py
# ===========================================================================
# Trains RandomForestRegressor & XGBRegressor, selects the winner by R²,
# runs a Fairlearn fairness audit on Caste_Category and Gender,
# then saves the production pipeline and SHAP explainer.
# ===========================================================================

import numpy as np
import pandas as pd
import joblib
import os
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import r2_score, mean_absolute_error
from sklearn.pipeline import Pipeline
from xgboost import XGBRegressor
from fairlearn.metrics import MetricFrame
import shap

# Set seed for reproducibility
np.random.seed(42)

# Define Paths (Dynamic)
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODELS_DIR = os.path.join(BASE_DIR, 'models')

print("=" * 60)
print(" STARTING MODEL TRAINING PIPELINE")
print("=" * 60)

# --- 1. Setup & Load Artifacts ---
print("\n--- 1. Loading Processed Data ---")

# A. Load the processed numpy arrays from the data pipeline
X_train = np.load(os.path.join(MODELS_DIR, 'X_train.npy'))
X_test  = np.load(os.path.join(MODELS_DIR, 'X_test.npy'))
y_train = np.load(os.path.join(MODELS_DIR, 'y_train.npy'))
y_test  = np.load(os.path.join(MODELS_DIR, 'y_test.npy'))

# B. Load raw X_test for fairness audit (has Caste_Category & Gender columns)
X_test_raw = pd.read_csv(os.path.join(MODELS_DIR, 'X_test_raw.csv'))

print(f"   X_train: {X_train.shape}  |  y_train: {y_train.shape}")
print(f"   X_test:  {X_test.shape}   |  y_test:  {y_test.shape}")
print(f"   X_test_raw: {X_test_raw.shape}  (for fairness audit)")

# --- 2. Model Training ---
print("\n--- 2. Training Models ---")

# A. Train RandomForestRegressor
print("   A. Training RandomForestRegressor ...")
rf_model = RandomForestRegressor(n_estimators=200, random_state=42)
rf_model.fit(X_train, y_train)
print("      Done.")

# B. Train XGBRegressor
print("   B. Training XGBRegressor ...")
xgb_model = XGBRegressor(
    n_estimators=200,
    learning_rate=0.1,
    max_depth=5,
    random_state=42
)
xgb_model.fit(X_train, y_train)
print("      Done.")

# --- 3. Evaluation & Model Selection ---
print("\n--- 3. Evaluating Models ---")

# A. Evaluate both models on the test set
rf_r2  = r2_score(y_test, rf_model.predict(X_test))
rf_mae = mean_absolute_error(y_test, rf_model.predict(X_test))

xgb_r2  = r2_score(y_test, xgb_model.predict(X_test))
xgb_mae = mean_absolute_error(y_test, xgb_model.predict(X_test))

# B. Print comparison table
print(f"\n   {'Model':<25} {'R² Score':>10} {'MAE':>10}")
print(f"   {'-'*45}")
print(f"   {'RandomForestRegressor':<25} {rf_r2:>10.4f} {rf_mae:>10.4f}")
print(f"   {'XGBRegressor':<25} {xgb_r2:>10.4f} {xgb_mae:>10.4f}")

# C. Select the best model (highest R²)
if rf_r2 >= xgb_r2:
    best_model = rf_model
    best_name  = "RandomForestRegressor"
    best_r2    = rf_r2
    best_mae   = rf_mae
else:
    best_model = xgb_model
    best_name  = "XGBRegressor"
    best_r2    = xgb_r2
    best_mae   = xgb_mae

print(f"\n   WINNER: {best_name}  (R² = {best_r2:.4f}, MAE = {best_mae:.4f})")

# --- 4. Fairness Audit (Fairlearn) ---
print("\n--- 4. Fairness Audit (Fairlearn MetricFrame) ---")

# A. Get predictions from the winning model
y_pred = best_model.predict(X_test)

# B. Define the metrics to audit
fairness_metrics = {
    "MAE": mean_absolute_error,
    "R²":  r2_score,
}

# C. Audit by Caste_Category
print("\n   ── Fairness Report: by Caste_Category ──")
caste_frame = MetricFrame(
    metrics=fairness_metrics,
    y_true=y_test,
    y_pred=y_pred,
    sensitive_features=X_test_raw["Caste_Category"],
)
print(f"\n   Overall:")
print(f"   {caste_frame.overall.to_string()}")
print(f"\n   By Group:")
print(f"   {caste_frame.by_group.to_string()}")

# D. Audit by Gender
print("\n   ── Fairness Report: by Gender ──")
gender_frame = MetricFrame(
    metrics=fairness_metrics,
    y_true=y_test,
    y_pred=y_pred,
    sensitive_features=X_test_raw["Gender"],
)
print(f"\n   Overall:")
print(f"   {gender_frame.overall.to_string()}")
print(f"\n   By Group:")
print(f"   {gender_frame.by_group.to_string()}")

# --- 5. Build & Save Production Pipeline ---
print("\n--- 5. Building Production Pipeline ---")

# A. Load the fitted preprocessor from the data pipeline
preprocessor = joblib.load(os.path.join(MODELS_DIR, 'preprocessor.pkl'))
print("   A. Loaded preprocessor.pkl")

# B. Combine [preprocessor + winning model] into a single sklearn Pipeline
pipeline = Pipeline([
    ('preprocessor', preprocessor),
    ('regressor', best_model)
])
print(f"   B. Built Pipeline: {list(pipeline.named_steps.keys())}")

# C. Save the full pipeline
pipeline_path = os.path.join(MODELS_DIR, 'scholarship_model.pkl')
joblib.dump(pipeline, pipeline_path)
print(f"   C. Saved Pipeline → {pipeline_path}")

# --- 6. SHAP Explainability ---
print("\n--- 6. Creating SHAP Explainer ---")

# A. Create a SHAP Explainer on the raw regressor (NOT the full pipeline)
#    We use X_train (already processed) so SHAP understands the feature space
explainer = shap.Explainer(best_model, X_train)
print("   A. Created shap.Explainer on the regressor step")

# B. Save the explainer for the dashboard
explainer_path = os.path.join(MODELS_DIR, 'shap_explainer.pkl')
joblib.dump(explainer, explainer_path)
print(f"   B. Saved Explainer → {explainer_path}")

# --- Done ---
print("\n" + "=" * 60)
print(" MODEL TRAINING COMPLETE")
print("=" * 60)
