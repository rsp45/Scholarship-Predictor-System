# FILE: src/model_trainer.py
import numpy as np
import joblib
import os
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import r2_score, mean_absolute_error
from sklearn.pipeline import Pipeline
from xgboost import XGBRegressor
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

print(f"   X_train: {X_train.shape}  |  y_train: {y_train.shape}")
print(f"   X_test:  {X_test.shape}   |  y_test:  {y_test.shape}")

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

# --- 4. Build & Save Production Pipeline ---
print("\n--- 4. Building Production Pipeline ---")

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

# --- 5. SHAP Explainability ---
print("\n--- 5. Creating SHAP Explainer ---")

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
