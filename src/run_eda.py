# FILE: src/run_eda.py
# ===========================================================================
# SQL-driven EDA runner.  Fetches applicant data from the SQLite database
# and launches 3 interactive Plotly visualizations in the default browser.
#
# Usage:
#     python src/run_eda.py          # from project root
#     python -m src.run_eda          # also works
# ===========================================================================

import sqlite3
import sys
from pathlib import Path

# Ensure the project root is on sys.path so `src.*` imports work
_PROJECT_ROOT = str(Path(__file__).resolve().parent.parent)
if _PROJECT_ROOT not in sys.path:
    sys.path.insert(0, _PROJECT_ROOT)

import pandas as pd

from src.visualizations import (
    plot_3d_decision_landscape,
    plot_applicant_journey,
    plot_demographic_sunburst,
)
from src.data_pipeline import DB_COL_MAP

# ---------------------------------------------------------------------------
# 1. Paths
# ---------------------------------------------------------------------------

BASE_DIR = Path(__file__).resolve().parent.parent
DB_PATH = BASE_DIR / "data" / "scholarship.db"

# ---------------------------------------------------------------------------
# 2. Load Data from SQLite
# ---------------------------------------------------------------------------

print("=" * 60)
print(" STARTING EXPLORATORY DATA ANALYSIS")
print("=" * 60)

print(f"\nConnecting to {DB_PATH} …")
conn = sqlite3.connect(str(DB_PATH))
df = pd.read_sql_query("SELECT * FROM applicants", conn)
conn.close()

# Rename DB columns to mixed-case (reuse mapping from data_pipeline)
df.rename(columns=DB_COL_MAP, inplace=True)

print(f"  Loaded {len(df)} rows, {len(df.columns)} columns")
print(f"  Columns: {list(df.columns)}")

# ---------------------------------------------------------------------------
# 3. Generate & Show Visualizations
# ---------------------------------------------------------------------------

print("\n--- Generating Visualizations ---")

# A. 3D Decision Landscape
print("   A. 3D Decision Landscape …")
fig_3d = plot_3d_decision_landscape(df)
fig_3d.show()
print("      Opened in browser ✓")

# B. Applicant Journey (Parallel Coordinates)
print("   B. Applicant Journey (Parallel Coordinates) …")
fig_journey = plot_applicant_journey(df)
fig_journey.show()
print("      Opened in browser ✓")

# C. Demographic Sunburst
print("   C. Demographic Sunburst …")
fig_sunburst = plot_demographic_sunburst(df)
fig_sunburst.show()
print("      Opened in browser ✓")

# ---------------------------------------------------------------------------
# Done
# ---------------------------------------------------------------------------

print("\n" + "=" * 60)
print(" EDA COMPLETE — 3 interactive plots opened in browser")
print("=" * 60)
