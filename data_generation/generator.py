# FILE: data_generation/generator.py
# ===========================================================================
# Generates 2,000 synthetic scholarship-applicant records using a
# "Committee Simulator" approach. Thresholds, bonuses, and weights are loaded
# from config/scholarship_rules.yaml.
#
# Outputs:
# - data/scholarship.db -> applicants
# - data/scholarship.db -> generated_applications
# ===========================================================================

import random
import sqlite3
import sys
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

if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from src.db_setup import (  # noqa: E402
    CREATE_APPLICANTS_TABLE,
    CREATE_GENERATED_APPLICATIONS_TABLE,
    DB_PATH,
    initialize_database,
)

np.random.seed(42)
random.seed(42)

N_STUDENTS = 2000

# ---------------------------------------------------------------------------
# 1. Load Rules Engine (YAML Config)
# ---------------------------------------------------------------------------

print("Loading rules engine...")
with open(CONFIG_PATH, "r", encoding="utf-8") as file:
    rules = yaml.safe_load(file)

print(f"  Config loaded from {CONFIG_PATH}")
print(f"  income_threshold : {rules['income_threshold']}")
print(f"  income_weight    : {rules['income_weight']}")
print(f"  merit_weight     : {rules['merit_weight']}")

# ---------------------------------------------------------------------------
# 2. Generate IDs and Names
# ---------------------------------------------------------------------------

print(f"\nGenerating data for {N_STUDENTS} students...")

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
# 3. Generate Features
# ---------------------------------------------------------------------------

data = {
    "Application_ID": app_ids,
    "Applicant_Name": names,
    "Family_Income": np.random.lognormal(mean=13.0, sigma=0.6, size=N_STUDENTS)
    .clip(150000, 3000000)
    .astype(int),
    "Caste_Category": np.random.choice(
        ["General", "OBC", "SC", "ST"],
        size=N_STUDENTS,
        p=[0.50, 0.27, 0.15, 0.08],
    ),
    "Domicile_Maharashtra": np.random.choice([1, 0], size=N_STUDENTS, p=[0.65, 0.35]),
    "Mh_CET_Percentile": np.random.uniform(40, 99.9, N_STUDENTS).round(2),
    "JEE_Percentile": np.random.uniform(40, 99.9, N_STUDENTS).round(2),
    "University_Test_Score": np.random.normal(65, 15, N_STUDENTS).clip(30, 100).round(1),
    "12th_Percentage": np.random.normal(75, 10, N_STUDENTS).clip(50, 99.9).round(1),
    "Extracurricular_Score": np.random.randint(0, 11, N_STUDENTS),
    "10th_Percentage": np.random.normal(75, 10, N_STUDENTS).clip(35, 100).round(1),
    "Gender": np.random.choice(["Male", "Female", "Other"], size=N_STUDENTS),
    "Parent_Occupation": np.random.choice(
        ["BPL", "APL", "Government", "Private Sector"], size=N_STUDENTS
    ),
    "Gap_Year": np.random.choice([0, 1, 2], size=N_STUDENTS),
    "Disability_Status": np.random.choice(["Yes", "No"], size=N_STUDENTS, p=[0.05, 0.95]),
    "College_Branch": np.random.choice(
        ["Engineering", "Arts", "Commerce", "Medical"], size=N_STUDENTS
    ),
}

df = pd.DataFrame(data)

# ---------------------------------------------------------------------------
# 4. Committee Simulator - Calculate Priority Score
# ---------------------------------------------------------------------------

income_min = df["Family_Income"].min()
income_max = df["Family_Income"].max()
income_norm = 1 - (df["Family_Income"] - income_min) / (income_max - income_min)

merit_norm = (
    df["Mh_CET_Percentile"]
    + df["JEE_Percentile"]
    + df["12th_Percentage"]
    + df["University_Test_Score"]
    + df["10th_Percentage"]
) / (5 * 100)

base_score = (income_norm * rules["income_weight"] * 100) + (merit_norm * rules["merit_weight"] * 100)

bonus = np.zeros(N_STUDENTS)

rule_a = (df["Family_Income"] < rules["income_threshold"]).astype(float) * rules["income_bonus"]
bonus += rule_a
print(f"  Rule A (Income < {rules['income_threshold']:,})  : {int(rule_a.sum() / rules['income_bonus'])} students affected")

rule_b = df["Caste_Category"].isin(rules["reserved_categories"]).astype(float) * rules["reservation_bonus"]
bonus += rule_b
print(f"  Rule B (SC/ST bonus)            : {int(rule_b.sum() / rules['reservation_bonus'])} students affected")

rule_c = (df["Extracurricular_Score"] > rules["extracurricular_threshold"]).astype(float) * rules["extracurricular_bonus"]
bonus += rule_c
print(f"  Rule C (Extra > {rules['extracurricular_threshold']})             : {int(rule_c.sum() / rules['extracurricular_bonus'])} students affected")

rule_d = (df["Disability_Status"] == "Yes").astype(float) * rules["pwd_bonus"]
bonus += rule_d
print(f"  Rule D (PwD bonus)              : {int(rule_d.sum() / rules['pwd_bonus'])} students affected")

rule_e = (df["Gender"] == "Female").astype(float) * rules["girl_child_bonus"]
bonus += rule_e
print(f"  Rule E (Girl Child bonus)       : {int(rule_e.sum() / rules['girl_child_bonus'])} students affected")

rule_f = (df["Gap_Year"] > 0).astype(float) * rules["gap_year_penalty"]
bonus += rule_f
print(f"  Rule F (Gap Year penalty)       : {int(rule_f.sum() / rules['gap_year_penalty'])} students affected")

noise = np.random.normal(0, 5, N_STUDENTS)
raw_score = base_score + bonus + noise
df["Scholarship_Priority_Score"] = np.clip(raw_score, 0, 100).round(1)

print(
    f"\n  Score stats -> mean: {df['Scholarship_Priority_Score'].mean():.1f}  "
    f"std: {df['Scholarship_Priority_Score'].std():.1f}  "
    f"min: {df['Scholarship_Priority_Score'].min():.1f}  "
    f"max: {df['Scholarship_Priority_Score'].max():.1f}"
)

# ---------------------------------------------------------------------------
# 5. Seed SQLite Database
# ---------------------------------------------------------------------------

INSERT_APPLICANTS_SQL = """
INSERT INTO applicants (
    application_id, applicant_name, family_income, caste_category,
    domicile_maharashtra, mh_cet_percentile, jee_percentile,
    university_test_score, twelfth_percentage,
    extracurricular_score, tenth_percentage, gender,
    parent_occupation, gap_year, disability_status,
    college_branch, predicted_priority_score
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
"""

INSERT_GENERATED_SQL = """
INSERT INTO generated_applications (
    application_id, applicant_name, family_income, caste_category,
    domicile_maharashtra, mh_cet_percentile, jee_percentile,
    university_test_score, twelfth_percentage,
    extracurricular_score, tenth_percentage, gender,
    parent_occupation, gap_year, disability_status,
    college_branch, predicted_priority_score
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
"""


def seed_database(dataframe: pd.DataFrame) -> None:
    """Clear generated datasets and bulk-insert synthesized rows."""
    initialize_database(DB_PATH)

    conn = sqlite3.connect(str(DB_PATH))
    conn.execute("PRAGMA journal_mode=WAL;")
    conn.execute("PRAGMA foreign_keys=ON;")

    try:
        conn.execute("DROP TABLE IF EXISTS applicants;")
        conn.execute("DROP TABLE IF EXISTS generated_applications;")
        conn.execute(CREATE_APPLICANTS_TABLE)
        conn.execute(CREATE_GENERATED_APPLICATIONS_TABLE)
        conn.commit()

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

        conn.executemany(INSERT_APPLICANTS_SQL, rows)
        conn.executemany(INSERT_GENERATED_SQL, rows)
        conn.commit()

        count = conn.execute("SELECT COUNT(*) FROM applicants").fetchone()[0]
        generated_count = conn.execute("SELECT COUNT(*) FROM generated_applications").fetchone()[0]
        print(f"\nDB seeded -> {count} rows in applicants table ({DB_PATH})")
        print(f"Generated source table -> {generated_count} rows in generated_applications")
    finally:
        conn.close()


seed_database(df)
print(df.head())
print("SUCCESS: data generation complete")
