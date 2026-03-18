"""
db_setup.py
===========
Initialise the local SQLite database for the Scholarship Predictor System.

Creates ``data/scholarship.db`` with:
- ``applicants``: combined training / historical scoring dataset
- ``generated_applications``: synthetic applications produced by the generator
- ``decision_center_applications``: live submissions scored through the UI
- ``override_audit``: manual override trail with reason and acting user
"""

import logging
import sqlite3
from pathlib import Path

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

BASE_DIR = Path(__file__).resolve().parent.parent
DB_DIR = BASE_DIR / "data"
DB_PATH = DB_DIR / "scholarship.db"

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Shared Column SQL
# ---------------------------------------------------------------------------

APPLICATION_COLUMNS_SQL = """
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
    college_branch          TEXT
"""

# ---------------------------------------------------------------------------
# SQL Definitions
# ---------------------------------------------------------------------------

CREATE_APPLICANTS_TABLE = f"""
CREATE TABLE IF NOT EXISTS applicants (
    id                      INTEGER PRIMARY KEY AUTOINCREMENT,
    {APPLICATION_COLUMNS_SQL},
    predicted_priority_score REAL,
    created_at              TEXT    DEFAULT (datetime('now'))
);
"""

CREATE_GENERATED_APPLICATIONS_TABLE = f"""
CREATE TABLE IF NOT EXISTS generated_applications (
    id                      INTEGER PRIMARY KEY AUTOINCREMENT,
    {APPLICATION_COLUMNS_SQL},
    predicted_priority_score REAL,
    generated_batch         TEXT    DEFAULT 'default',
    created_at              TEXT    DEFAULT (datetime('now'))
);
"""

CREATE_DECISION_CENTER_APPLICATIONS_TABLE = f"""
CREATE TABLE IF NOT EXISTS decision_center_applications (
    id                      INTEGER PRIMARY KEY AUTOINCREMENT,
    {APPLICATION_COLUMNS_SQL},
    ml_score                REAL,
    final_score             REAL    NOT NULL,
    decision_tier           TEXT    NOT NULL,
    is_overridden           INTEGER NOT NULL CHECK (is_overridden IN (0, 1)) DEFAULT 0,
    submitted_by            TEXT    DEFAULT 'Dr. Admin',
    created_at              TEXT    DEFAULT (datetime('now'))
);
"""

CREATE_OVERRIDE_AUDIT_TABLE = """
CREATE TABLE IF NOT EXISTS override_audit (
    id                      INTEGER PRIMARY KEY AUTOINCREMENT,
    decision_application_id TEXT    NOT NULL,
    applicant_name          TEXT    NOT NULL,
    ml_score                REAL,
    override_score          REAL    NOT NULL,
    final_tier              TEXT    NOT NULL,
    override_reason         TEXT,
    override_user           TEXT    NOT NULL,
    created_at              TEXT    DEFAULT (datetime('now'))
);
"""


# ---------------------------------------------------------------------------
# Functions
# ---------------------------------------------------------------------------

def get_connection(db_path: Path = DB_PATH) -> sqlite3.Connection:
    """Open (or create) a SQLite database and return a connection."""
    conn = sqlite3.connect(str(db_path))
    conn.execute("PRAGMA journal_mode=WAL;")
    conn.execute("PRAGMA foreign_keys=ON;")
    logger.info("Connected to database: %s", db_path)
    return conn


def create_tables(conn: sqlite3.Connection) -> None:
    """Create all database tables used by the product."""
    conn.execute(CREATE_APPLICANTS_TABLE)
    conn.execute(CREATE_GENERATED_APPLICATIONS_TABLE)
    conn.execute(CREATE_DECISION_CENTER_APPLICATIONS_TABLE)
    conn.execute(CREATE_OVERRIDE_AUDIT_TABLE)
    conn.commit()
    logger.info("Tables are ready: applicants, generated_applications, decision_center_applications, override_audit")


def initialize_database(db_path: Path = DB_PATH) -> None:
    """Ensure the database file exists and all required tables are present."""
    logger.info("=" * 60)
    logger.info("INITIALISING SCHOLARSHIP DATABASE")
    logger.info("=" * 60)

    db_path.parent.mkdir(parents=True, exist_ok=True)

    conn = get_connection(db_path)
    try:
        create_tables(conn)
    finally:
        conn.close()
        logger.info("Database connection closed")

    logger.info("=" * 60)
    logger.info("DATABASE SETUP COMPLETE  ->  %s", db_path)
    logger.info("=" * 60)


if __name__ == "__main__":
    initialize_database()
