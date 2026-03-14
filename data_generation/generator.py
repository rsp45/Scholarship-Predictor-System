# FILE: data_generation/generator.py
# ===========================================================================
# Generates 2,000 synthetic scholarship-applicant records using a
# "Committee Simulator" approach.  All thresholds, bonuses, and weights
# are loaded from config/scholarship_rules.yaml (Rules Engine).
#
# Output  → data/scholarship.db  (applicants table)
#
# Committee Simulator pipeline:
#   Step 1  Base weighted score   (Income weight + Merit weight from YAML)
#   Step 2  Fuzzy rule bonuses    (non-linear adjustments from YAML)
#   Step 3  Human noise           (np.random.normal to simulate bias)
# ===========================================================================

import random
import sqlite3
from pathlib import Path

import numpy as np
import pandas as pd
import yaml

# ---------------------------------------------------------------------------
# 0. Paths & Constants
# ---------------------------------------------------------------------------

SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parent
CONFIG_PATH = PROJECT_ROOT / "config" / "scholarship_rules.yaml"
DB_PATH = PROJECT_ROOT / "data" / "scholarship.db"

np.random.seed(42)
random.seed(42)

N_STUDENTS = 2000

# ---------------------------------------------------------------------------
# 1. Load Rules Engine (YAML Config)
# ---------------------------------------------------------------------------

print("Loading rules engine …")
with open(CONFIG_PATH, "r", encoding="utf-8") as f:
    rules = yaml.safe_load(f)

print(f"  Config loaded from {CONFIG_PATH}")
print(f"  income_threshold : {rules['income_threshold']}")
print(f"  income_weight    : {rules['income_weight']}")
print(f"  merit_weight     : {rules['merit_weight']}")

# ---------------------------------------------------------------------------
# 2. Generate IDs and Names
# ---------------------------------------------------------------------------

print(f"\nGenerating data for {N_STUDENTS} students …")

first_names = [
    "Aarav", "Vihaan", "Aditya", "Sai", "Rohan", "Priya", "Ananya",
    "Diya", "Isha", "Sneha", "Rahul", "Vikram", "Neha", "Pooja",
    "Karan", "Arjun", "Meera", "Tanvi", "Omkar", "Yash", "Sakshi",
    "Ritika", "Harsh", "Manav", "Shruti", "Gauri", "Parth", "Nisha",
]
last_names = [
    "Patil", "Deshmukh", "Joshi", "Kulkarni", "Sharma", "Singh",
    "Yadav", "Pawar", "Sawant", "Gaikwad", "Chavan", "Shinde",
    "Kale", "More", "Rao", "Jadhav", "Bhosale", "Mane", "Thakur",
]

names = [f"{random.choice(first_names)} {random.choice(last_names)}" for _ in range(N_STUDENTS)]
app_ids = [f"APP-2025-{i:04d}" for i in range(1, N_STUDENTS + 1)]

# ---------------------------------------------------------------------------
# 3. Generate Features (existing + 6 new columns)
# ---------------------------------------------------------------------------

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

    # Academic — existing
    "Mh_CET_Percentile": np.random.uniform(40, 99.9, N_STUDENTS).round(2),
    "JEE_Percentile": np.random.uniform(40, 99.9, N_STUDENTS).round(2),
    "University_Test_Score": np.random.normal(65, 15, N_STUDENTS).clip(30, 100).round(1),
    "12th_Percentage": np.random.normal(75, 10, N_STUDENTS).clip(50, 99.9).round(1),
    "Extracurricular_Score": np.random.randint(0, 11, N_STUDENTS),

    # ★ NEW — Academic
    "10th_Percentage": np.random.normal(75, 10, N_STUDENTS).clip(35, 100).round(1),

    # ★ NEW — Demographic
    "Gender": np.random.choice(["Male", "Female", "Other"], size=N_STUDENTS),

    # ★ NEW — Socio-economic
    "Parent_Occupation": np.random.choice(
        ["BPL", "APL", "Government", "Private Sector"], size=N_STUDENTS,
    ),

    # ★ NEW — Gap Year
    "Gap_Year": np.random.choice([0, 1, 2], size=N_STUDENTS),

    # ★ NEW — Disability (5 % Yes, 95 % No)
    "Disability_Status": np.random.choice(
        ["Yes", "No"], size=N_STUDENTS, p=[0.05, 0.95],
    ),

    # ★ NEW — College Branch
    "College_Branch": np.random.choice(
        ["Engineering", "Arts", "Commerce", "Medical"], size=N_STUDENTS,
    ),
}

df = pd.DataFrame(data)

# ---------------------------------------------------------------------------
# 4. Committee Simulator — Calculate Priority Score
# ---------------------------------------------------------------------------
# Step 1 (Base)       : weighted combination of normalised income & merit
# Step 2 (Fuzzy Rules): non-linear bonus bumps driven by YAML config
# Step 3 (Human Noise): Gaussian noise to simulate committee inconsistency

# ---- Step 1: Base Score ----
# Income component — lower income → higher need → higher score
income_min = df["Family_Income"].min()
income_max = df["Family_Income"].max()
income_norm = 1 - (df["Family_Income"] - income_min) / (income_max - income_min)

# Merit component — average of all 5 academic scores, normalised to 0–1
merit_norm = (
    df["Mh_CET_Percentile"]
    + df["JEE_Percentile"]
    + df["12th_Percentage"]
    + df["University_Test_Score"]
    + df["10th_Percentage"]
) / (5 * 100)

base_score = (income_norm * rules["income_weight"] * 100) + (merit_norm * rules["merit_weight"] * 100)

# ---- Step 2: Fuzzy Rule Bonuses (config-driven) ----
bonus = np.zeros(N_STUDENTS)

# Rule A — Low income bonus
rule_a = (df["Family_Income"] < rules["income_threshold"]).astype(float) * rules["income_bonus"]
bonus += rule_a
print(f"  Rule A (Income < {rules['income_threshold']:,})  : {int(rule_a.sum() / rules['income_bonus'])} students affected")

# Rule B — SC / ST reservation bonus
rule_b = df["Caste_Category"].isin(rules["reserved_categories"]).astype(float) * rules["reservation_bonus"]
bonus += rule_b
print(f"  Rule B (SC/ST bonus)            : {int(rule_b.sum() / rules['reservation_bonus'])} students affected")

# Rule C — Exceptional extracurricular achievers
rule_c = (df["Extracurricular_Score"] > rules["extracurricular_threshold"]).astype(float) * rules["extracurricular_bonus"]
bonus += rule_c
print(f"  Rule C (Extra > {rules['extracurricular_threshold']})             : {int(rule_c.sum() / rules['extracurricular_bonus'])} students affected")

# Rule D — PwD (Persons with Disability) bonus
rule_d = (df["Disability_Status"] == "Yes").astype(float) * rules["pwd_bonus"]
bonus += rule_d
print(f"  Rule D (PwD bonus)              : {int(rule_d.sum() / rules['pwd_bonus'])} students affected")

# Rule E — Girl Child bonus (Female applicants)
rule_e = (df["Gender"] == "Female").astype(float) * rules["girl_child_bonus"]
bonus += rule_e
print(f"  Rule E (Girl Child bonus)       : {int(rule_e.sum() / rules['girl_child_bonus'])} students affected")

# Rule F — Gap Year penalty
rule_f = (df["Gap_Year"] > 0).astype(float) * rules["gap_year_penalty"]
bonus += rule_f
print(f"  Rule F (Gap Year penalty)       : {int(rule_f.sum() / rules['gap_year_penalty'])} students affected")

# ---- Step 3: Human Noise ----
noise = np.random.normal(0, 5, N_STUDENTS)

raw_score = base_score + bonus + noise
df["Scholarship_Priority_Score"] = np.clip(raw_score, 0, 100).round(1)

print(f"\n  Score stats → mean: {df['Scholarship_Priority_Score'].mean():.1f}  "
      f"std: {df['Scholarship_Priority_Score'].std():.1f}  "
      f"min: {df['Scholarship_Priority_Score'].min():.1f}  "
      f"max: {df['Scholarship_Priority_Score'].max():.1f}")

# ---------------------------------------------------------------------------
# 5. Seed SQLite Database
# ---------------------------------------------------------------------------

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
    tenth_percentage        REAL,
    gender                  TEXT,
    parent_occupation       TEXT,
    gap_year                INTEGER,
    disability_status       TEXT,
    college_branch          TEXT,
    predicted_priority_score REAL,
    created_at              TEXT    DEFAULT (datetime('now'))
);
"""

INSERT_SQL = """
INSERT INTO applicants (
    application_id, applicant_name, family_income, caste_category,
    domicile_maharashtra, mh_cet_percentile, jee_percentile,
    university_test_score, twelfth_percentage,
    extracurricular_score, tenth_percentage, gender,
    parent_occupation, gap_year, disability_status,
    college_branch, predicted_priority_score
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
"""


def seed_database(dataframe: pd.DataFrame) -> None:
    """Clear the applicants table and bulk-insert synthesized rows."""

    # Ensure the data/ directory exists
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)

    conn = sqlite3.connect(str(DB_PATH))
    conn.execute("PRAGMA journal_mode=WAL;")
    conn.execute("PRAGMA foreign_keys=ON;")

    try:
        # Drop & recreate the table to pick up schema changes
        conn.execute("DROP TABLE IF EXISTS applicants;")
        conn.execute(CREATE_APPLICANTS_TABLE)
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
                    "10th_Percentage",
                    "Gender",
                    "Parent_Occupation",
                    "Gap_Year",
                    "Disability_Status",
                    "College_Branch",
                    "Scholarship_Priority_Score",
                ]
            ].itertuples(index=False, name=None)
        )

        conn.executemany(INSERT_SQL, rows)
        conn.commit()

        count = conn.execute("SELECT COUNT(*) FROM applicants").fetchone()[0]
        print(f"\nDB seeded →  {count} rows in applicants table ({DB_PATH})")

    finally:
        conn.close()


seed_database(df)
print(df.head())
print("SUCCESS: data generation complete ✓")