# FILE: data_generation/generator.py
# ===========================================================================
# Generates synthetic scholarship-applicant data and seeds it into:
#   1. data_generation/raw_data.csv  (consumed by src/data_pipeline.py)
#   2. data/scholarship.db           (applicants table — consumed by the dashboard)
# ===========================================================================

import os
import random
import sqlite3
from pathlib import Path

import numpy as np
import pandas as pd

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------

SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parent
CSV_PATH = SCRIPT_DIR / "raw_data.csv"
DB_PATH = PROJECT_ROOT / "data" / "scholarship.db"

# ---------------------------------------------------------------------------
# Seed for reproducibility
# ---------------------------------------------------------------------------

np.random.seed(42)
random.seed(42)

N_STUDENTS = 1000

print(f"Generating data for {N_STUDENTS} students...")

# --- 1. Generate IDs and Names ------------------------------------------------

first_names = [
    "Aarav", "Vihaan", "Aditya", "Sai", "Rohan", "Priya", "Ananya",
    "Diya", "Isha", "Sneha", "Rahul", "Vikram", "Neha", "Pooja",
    "Karan", "Arjun",
]
last_names = [
    "Patil", "Deshmukh", "Joshi", "Kulkarni", "Sharma", "Singh",
    "Yadav", "Pawar", "Sawant", "Gaikwad", "Chavan", "Shinde",
    "Kale", "More", "Rao",
]

names = [f"{random.choice(first_names)} {random.choice(last_names)}" for _ in range(N_STUDENTS)]
app_ids = [f"APP-2025-{i:04d}" for i in range(1, N_STUDENTS + 1)]

# --- 2. Generate Features -----------------------------------------------------

data = {
    "Application_ID": app_ids,
    "Applicant_Name": names,

    # Financial
    "Family_Income": np.random.lognormal(mean=13.0, sigma=0.6, size=N_STUDENTS)
        .clip(150000, 3000000)
        .astype(int),

    # Social
    "Caste_Category": np.random.choice(
        ["General", "OBC", "SC", "ST"],
        size=N_STUDENTS,
        p=[0.50, 0.27, 0.15, 0.08],
    ),
    "Domicile_Maharashtra": np.random.choice([1, 0], size=N_STUDENTS, p=[0.65, 0.35]),

    # Academic
    "Mh_CET_Percentile": np.random.uniform(40, 99.9, N_STUDENTS).round(2),
    "JEE_Percentile": np.random.uniform(40, 99.9, N_STUDENTS).round(2),
    "University_Test_Score": np.random.normal(65, 15, N_STUDENTS).clip(30, 100).round(1),
    "12th_Percentage": np.random.normal(75, 10, N_STUDENTS).clip(50, 99.9).round(1),
    "Extracurricular_Score": np.random.randint(0, 11, N_STUDENTS),
}

df = pd.DataFrame(data)

# --- 3. Calculate Target Variable (Priority Score) ----------------------------

income_score = 100 * np.exp(-df["Family_Income"] / 1_000_000)

merit_score = (
    df["Mh_CET_Percentile"] + df["JEE_Percentile"] + df["12th_Percentage"]
) / 3

policy_bonus = np.where(
    df["Caste_Category"] == "General", 0,
    np.where(df["Caste_Category"] == "OBC", 5,
    np.where(df["Caste_Category"] == "SC", 10, 15)),
)
domicile_bonus = df["Domicile_Maharashtra"] * 5

raw_target = (
    (income_score * 0.4)
    + (merit_score * 0.4)
    + policy_bonus
    + domicile_bonus
    + df["Extracurricular_Score"]
)

df["Scholarship_Priority_Score"] = np.clip(
    raw_target + np.random.normal(0, 3, N_STUDENTS), 0, 100
).round(1)

# --- 4. Save to CSV -----------------------------------------------------------

df.to_csv(CSV_PATH, index=False)
print(f"CSV saved  →  {CSV_PATH}")

# --- 5. Seed SQLite Database ---------------------------------------------------

CREATE_APPLICANTS_TABLE = """
CREATE TABLE IF NOT EXISTS applicants (
    id                      INTEGER PRIMARY KEY AUTOINCREMENT,
    application_id          TEXT    UNIQUE NOT NULL,
    applicant_name          TEXT    NOT NULL,
    family_income           REAL    NOT NULL,
    caste_category          TEXT    NOT NULL,
    domicile_maharashtra    INTEGER NOT NULL CHECK (domicile_maharashtra IN (0, 1)),
    mh_cet_percentile       REAL,
    jee_percentile          REAL,
    university_test_score   REAL,
    twelfth_percentage      REAL,
    extracurricular_score   INTEGER,
    predicted_priority_score REAL,
    created_at              TEXT    DEFAULT (datetime('now'))
);
"""

INSERT_SQL = """
INSERT INTO applicants (
    application_id, applicant_name, family_income, caste_category,
    domicile_maharashtra, mh_cet_percentile, jee_percentile,
    university_test_score, twelfth_percentage,
    extracurricular_score, predicted_priority_score
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
"""


def seed_database(dataframe: pd.DataFrame) -> None:
    """Clear the applicants table and bulk-insert synthesized rows."""

    # Ensure the data/ directory exists
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)

    conn = sqlite3.connect(str(DB_PATH))
    conn.execute("PRAGMA journal_mode=WAL;")
    conn.execute("PRAGMA foreign_keys=ON;")

    try:
        # Create the table if it doesn't exist
        conn.execute(CREATE_APPLICANTS_TABLE)
        conn.commit()

        # Wipe existing rows so re-runs are idempotent
        conn.execute("DELETE FROM applicants;")
        conn.commit()

        # Prepare rows as list of tuples (column order matches INSERT_SQL)
        rows = list(
            dataframe[
                [
                    "Application_ID",
                    "Applicant_Name",
                    "Family_Income",
                    "Caste_Category",
                    "Domicile_Maharashtra",
                    "Mh_CET_Percentile",
                    "JEE_Percentile",
                    "University_Test_Score",
                    "12th_Percentage",
                    "Extracurricular_Score",
                    "Scholarship_Priority_Score",
                ]
            ].itertuples(index=False, name=None)
        )

        conn.executemany(INSERT_SQL, rows)
        conn.commit()

        count = conn.execute("SELECT COUNT(*) FROM applicants").fetchone()[0]
        print(f"DB seeded →  {count} rows in applicants table ({DB_PATH})")

    finally:
        conn.close()


seed_database(df)
print(df.head())
print("SUCCESS: data generation complete ✓")