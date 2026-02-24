# FILE: src/test_lightgbm.py
import numpy as np
import os
from lightgbm import LGBMRegressor
from sklearn.metrics import r2_score, mean_absolute_error

# Set seed for reproducibility
np.random.seed(42)

# Define Paths (Dynamic)
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODELS_DIR = os.path.join(BASE_DIR, 'models')

print("=" * 60)
print(" LIGHTGBM EXPERIMENT — EVALUATION ONLY")
print("=" * 60)

# --- 1. Load Data ---
print("\n--- 1. Loading Processed Data ---")

# A. Load the processed numpy arrays from the data pipeline
X_train = np.load(os.path.join(MODELS_DIR, 'X_train.npy'))
X_test  = np.load(os.path.join(MODELS_DIR, 'X_test.npy'))
y_train = np.load(os.path.join(MODELS_DIR, 'y_train.npy'))
y_test  = np.load(os.path.join(MODELS_DIR, 'y_test.npy'))

print(f"   X_train: {X_train.shape}  |  y_train: {y_train.shape}")
print(f"   X_test:  {X_test.shape}   |  y_test:  {y_test.shape}")

# --- 2. Train LightGBM ---
print("\n--- 2. Training LGBMRegressor ---")

lgbm_model = LGBMRegressor(
    n_estimators=200,
    learning_rate=0.1,
    max_depth=5,
    random_state=42,
    verbose=-1
)
lgbm_model.fit(X_train, y_train)
print("   Done.")

# --- 3. Evaluate ---
print("\n--- 3. Evaluating on Test Set ---")

# A. Compute metrics
y_pred   = lgbm_model.predict(X_test)
lgbm_r2  = r2_score(y_test, y_pred)
lgbm_mae = mean_absolute_error(y_test, y_pred)

# B. Print results table
print(f"\n   {'Model':<25} {'R² Score':>10} {'MAE':>10}")
print(f"   {'-'*45}")
print(f"   {'LGBMRegressor':<25} {lgbm_r2:>10.4f} {lgbm_mae:>10.4f}")

# --- Done ---
print("\n" + "=" * 60)
print(" LIGHTGBM EXPERIMENT COMPLETE")
print("=" * 60)
