"""
db_setup.py
===========
Initialise a local SQLite database for the Scholarship Predictor System.

Creates a ``data/scholarship.db`` file with an ``applicants`` table designed
to securely store applicant details and their predicted Priority Scores.

Usage:
    python -m src.db_setup       # from project root
    python src/db_setup.py       # also works standalone
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
# SQL Definitions
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
    predicted_priority_score REAL,
    created_at              TEXT    DEFAULT (datetime('now'))
);
"""

# ---------------------------------------------------------------------------
# Functions
# ---------------------------------------------------------------------------


def get_connection(db_path: Path = DB_PATH) -> sqlite3.Connection:
    """
    Open (or create) a SQLite database and return a connection.

    Enables WAL journal mode for safer concurrent reads and better
    write performance.
    """
    conn = sqlite3.connect(str(db_path))
    conn.execute("PRAGMA journal_mode=WAL;")
    conn.execute("PRAGMA foreign_keys=ON;")
    logger.info("Connected to database: %s", db_path)
    return conn


def create_tables(conn: sqlite3.Connection) -> None:
    """Create the applicants table (idempotent — uses IF NOT EXISTS)."""
    conn.execute(CREATE_APPLICANTS_TABLE)
    conn.commit()
    logger.info("Table 'applicants' is ready")


def initialize_database(db_path: Path = DB_PATH) -> None:
    """
    End-to-end database initialisation:
      1. Ensure the data/ directory exists.
      2. Connect to (or create) the SQLite database.
      3. Create the applicants table.
    """
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
    logger.info("DATABASE SETUP COMPLETE  →  %s", db_path)
    logger.info("=" * 60)


if __name__ == "__main__":
    initialize_database()
