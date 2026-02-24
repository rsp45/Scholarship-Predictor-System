"""
app.py
======
Enterprise-grade Streamlit dashboard for the Scholarship Predictor System.

Provides three tabs:
  1. Single Applicant Scoring  — predict, save to DB, and explain with SHAP
  2. Batch Processing          — upload CSV, score hundreds of students at once
  3. Database Records          — review all past predictions stored in SQLite

Usage:
    streamlit run app/app.py     # from project root
"""

import os
import sqlite3
import uuid

import joblib
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import plotly.express as px
import shap
import streamlit as st

# ---------------------------------------------------------------------------
# 1. PAGE CONFIG & PATHS
# ---------------------------------------------------------------------------

st.set_page_config(
    page_title="Scholarship Priority System",
    page_icon="🎓",
    layout="wide",
)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_PATH = os.path.join(BASE_DIR, "models", "scholarship_model.pkl")
EXPLAINER_PATH = os.path.join(BASE_DIR, "models", "shap_explainer.pkl")
DB_PATH = os.path.join(BASE_DIR, "data", "scholarship.db")
BANNER_PATH = os.path.join(BASE_DIR, "app", "Banner.jpg")

# The 8 features the pipeline was trained on (order matters)
FEATURE_COLS = [
    "Family_Income",
    "Caste_Category",
    "Domicile_Maharashtra",
    "Mh_CET_Percentile",
    "JEE_Percentile",
    "University_Test_Score",
    "12th_Percentage",
    "Extracurricular_Score",
]

# ---------------------------------------------------------------------------
# 2. CUSTOM CSS
# ---------------------------------------------------------------------------

st.markdown(
    """
<style>
    /* ---- Metric cards ---- */
    div[data-testid="stMetric"] {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        padding: 18px 22px;
        border-radius: 14px;
        color: #ffffff;
        box-shadow: 0 4px 14px rgba(102, 126, 234, .35);
    }
    div[data-testid="stMetric"] label {
        color: rgba(255, 255, 255, .85) !important;
        font-weight: 600;
    }
    div[data-testid="stMetric"] [data-testid="stMetricValue"] {
        color: #ffffff !important;
        font-size: 1.8rem !important;
        font-weight: 700;
    }
    div[data-testid="stMetric"] [data-testid="stMetricDelta"] {
        color: rgba(255, 255, 255, .75) !important;
    }

    /* ---- Score badge ---- */
    .score-badge {
        padding: 24px;
        border-radius: 16px;
        text-align: center;
        box-shadow: 0 6px 20px rgba(0,0,0,.12);
    }
    .score-badge h1 { margin: 0; font-size: 3rem; }
    .score-badge h3 { margin: 4px 0 0 0; font-weight: 500; }

    /* ---- Tabs ---- */
    .stTabs [data-baseweb="tab-list"] { gap: 8px; }
    .stTabs [data-baseweb="tab"] {
        padding: 10px 24px;
        border-radius: 8px 8px 0 0;
        font-weight: 600;
    }

    /* ---- General polish ---- */
    section[data-testid="stSidebar"] { background: #fafbfe; }
</style>
""",
    unsafe_allow_html=True,
)

# ---------------------------------------------------------------------------
# 3. LOAD RESOURCES (cached)
# ---------------------------------------------------------------------------


@st.cache_resource
def load_pipeline():
    """Load the trained sklearn Pipeline (preprocessor + regressor)."""
    return joblib.load(MODEL_PATH)


@st.cache_resource
def load_explainer():
    """Load the pre-built SHAP Explainer object."""
    return joblib.load(EXPLAINER_PATH)


def get_db_connection() -> sqlite3.Connection:
    """Return a fresh SQLite connection (not cached — short-lived)."""
    conn = sqlite3.connect(DB_PATH)
    conn.execute("PRAGMA journal_mode=WAL;")
    conn.execute("PRAGMA foreign_keys=ON;")
    return conn


# ---------------------------------------------------------------------------
# 4. HELPER FUNCTIONS
# ---------------------------------------------------------------------------


def classify_tier(score: float) -> tuple[str, str, str]:
    """Return (tier_label, badge_bg_colour, badge_text_colour) for a score."""
    if score >= 80:
        return (
            "🟢 High Priority — Full Scholarship",
            "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
            "#064e3b",
        )
    elif score >= 50:
        return (
            "🟠 Medium Priority — Partial Aid",
            "linear-gradient(135deg, #f6d365 0%, #fda085 100%)",
            "#78350f",
        )
    else:
        return (
            "🔴 Low Priority — No Aid",
            "linear-gradient(135deg, #ff9a9e 0%, #fad0c4 100%)",
            "#7f1d1d",
        )


def predict_single(pipeline, input_df: pd.DataFrame) -> float:
    """Run the pipeline on a single-row DataFrame and return clipped score."""
    raw = pipeline.predict(input_df)[0]
    return float(np.clip(raw, 0, 100))


def insert_applicant(
    app_id: str,
    name: str,
    income: float,
    caste: str,
    domicile: int,
    cet: float,
    jee: float,
    uni: float,
    hsc: float,
    extra: int,
    score: float,
) -> None:
    """Insert a single applicant record into the SQLite database."""
    conn = get_db_connection()
    try:
        conn.execute(
            """
            INSERT INTO applicants (
                application_id, applicant_name, family_income, caste_category,
                domicile_maharashtra, mh_cet_percentile, jee_percentile,
                university_test_score, twelfth_percentage,
                extracurricular_score, predicted_priority_score
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (app_id, name, income, caste, domicile, cet, jee, uni, hsc, extra, score),
        )
        conn.commit()
    finally:
        conn.close()


def fetch_all_applicants() -> pd.DataFrame:
    """Return every row in the applicants table as a DataFrame."""
    conn = get_db_connection()
    try:
        df = pd.read_sql_query("SELECT * FROM applicants ORDER BY id DESC", conn)
    finally:
        conn.close()
    return df


def fetch_summary_stats() -> dict:
    """Return aggregate statistics from the applicants table."""
    conn = get_db_connection()
    try:
        row = conn.execute(
            """
            SELECT
                COUNT(*)                                        AS total,
                COALESCE(ROUND(AVG(predicted_priority_score), 1), 0) AS avg_score,
                COALESCE(SUM(CASE WHEN predicted_priority_score >= 80
                             THEN 1 ELSE 0 END), 0)            AS high_count,
                COALESCE(MAX(predicted_priority_score), 0)      AS max_score
            FROM applicants
            """
        ).fetchone()
    finally:
        conn.close()
    return {
        "total": row[0],
        "avg_score": row[1],
        "high_count": row[2],
        "max_score": row[3],
    }


def get_shap_feature_names(pipeline) -> list[str]:
    """Derive human-readable feature names from the pipeline's preprocessor."""
    preprocessor = pipeline.named_steps["preprocessor"]
    try:
        return list(preprocessor.get_feature_names_out())
    except Exception:
        # Fallback — generic names
        n = pipeline.named_steps["regressor"].n_features_in_
        return [f"Feature {i}" for i in range(n)]


# ---------------------------------------------------------------------------
# 5. BANNER & TITLE
# ---------------------------------------------------------------------------

if os.path.exists(BANNER_PATH):
    st.image(BANNER_PATH, use_container_width=True)

st.title("🎓 Intelligent Scholarship Allocator")
st.caption("Predict priority scores · Explain decisions with SHAP · Manage records")

# ---------------------------------------------------------------------------
# 6. TOP-LEVEL METRIC CARDS
# ---------------------------------------------------------------------------

stats = fetch_summary_stats()

m1, m2, m3, m4 = st.columns(4)
m1.metric("Total Applicants", f"{stats['total']:,}")
m2.metric("Avg Priority Score", f"{stats['avg_score']:.1f}")
m3.metric("High-Priority (≥80)", f"{stats['high_count']:,}")
m4.metric("Highest Score", f"{stats['max_score']:.1f}")

st.divider()

# ---------------------------------------------------------------------------
# 7. LOAD ML ARTEFACTS
# ---------------------------------------------------------------------------

pipeline = load_pipeline()
explainer = load_explainer()

# ---------------------------------------------------------------------------
# 8. TABS
# ---------------------------------------------------------------------------

tab1, tab2, tab3 = st.tabs(
    ["📝 Single Applicant Scoring", "📦 Batch Processing", "🗄️ Database Records"]
)

# ========================== TAB 1: SINGLE APPLICANT ========================

with tab1:
    st.subheader("Score a New Applicant")
    st.info("Fill in the applicant's details below and click **Calculate Score**.")

    # --- Input Form ---
    with st.form("applicant_form", clear_on_submit=False):
        id_col, name_col = st.columns(2)
        with id_col:
            app_id = st.text_input(
                "Application ID (auto-generated)",
                value=f"APP-{uuid.uuid4().hex[:8].upper()}",
                disabled=True,
            )
        with name_col:
            applicant_name = st.text_input("Applicant Name", value="")

        st.markdown("---")

        c1, c2, c3, c4 = st.columns(4)
        with c1:
            income = st.number_input(
                "Annual Family Income (₹)", min_value=0, max_value=5_000_000,
                value=450_000, step=10_000,
            )
        with c2:
            caste = st.selectbox("Caste Category", ["General", "OBC", "SC", "ST"])
        with c3:
            domicile = st.selectbox("Domicile Maharashtra", ["Yes", "No"])
        with c4:
            extra = st.slider("Extracurricular Score (0-10)", 0, 10, 5)

        c5, c6, c7, c8 = st.columns(4)
        with c5:
            hsc = st.slider("12th Grade %", 40.0, 100.0, 75.0)
        with c6:
            cet = st.slider("MH-CET Percentile", 0.0, 100.0, 80.0)
        with c7:
            jee = st.slider("JEE Mains Percentile", 0.0, 100.0, 70.0)
        with c8:
            uni = st.slider("University Test Score", 0.0, 100.0, 65.0)

        submitted = st.form_submit_button(
            "🚀 Calculate Score", type="primary", use_container_width=True
        )

    # --- Prediction & DB Insert ---
    if submitted:
        if not applicant_name.strip():
            st.warning("⚠️ Please enter the applicant's name.")
            st.stop()

        is_mh = 1 if domicile == "Yes" else 0

        input_df = pd.DataFrame(
            {
                "Family_Income": [income],
                "Caste_Category": [caste],
                "Domicile_Maharashtra": [is_mh],
                "Mh_CET_Percentile": [cet],
                "JEE_Percentile": [jee],
                "University_Test_Score": [uni],
                "12th_Percentage": [hsc],
                "Extracurricular_Score": [extra],
            }
        )

        # Predict
        score = predict_single(pipeline, input_df)
        tier_label, badge_bg, badge_fg = classify_tier(score)

        # Save to database
        try:
            insert_applicant(
                app_id, applicant_name, income, caste, is_mh,
                cet, jee, uni, hsc, extra, score,
            )
            db_saved = True
        except Exception as e:
            db_saved = False
            db_error = str(e)

        # --- Display Results ---
        res_left, res_right = st.columns([1, 1])

        with res_left:
            st.markdown(
                f"""
                <div class="score-badge" style="background:{badge_bg}; color:{badge_fg};">
                    <h1>{score:.2f} / 100</h1>
                    <h3>{tier_label}</h3>
                </div>
                """,
                unsafe_allow_html=True,
            )
            if db_saved:
                st.success(
                    f"✅ Record saved to database — **{app_id}** ({applicant_name})"
                )
            else:
                st.error(f"❌ Database error: {db_error}")

        with res_right:
            st.markdown("##### 📋 Submitted Details")
            st.dataframe(
                pd.DataFrame(
                    {
                        "Field": [
                            "Application ID", "Name", "Family Income",
                            "Caste", "Domicile MH", "12th %",
                            "MH-CET", "JEE", "University", "Extra-curricular",
                        ],
                        "Value": [
                            app_id, applicant_name, f"₹{income:,}",
                            caste, domicile, f"{hsc:.1f}",
                            f"{cet:.1f}", f"{jee:.1f}", f"{uni:.1f}", str(extra),
                        ],
                    }
                ),
                hide_index=True,
                use_container_width=True,
            )

        # --- SHAP Explainability ---
        st.divider()
        st.subheader("🔍 SHAP Explainability — What Drove This Score?")

        try:
            # Transform through the preprocessor step only
            preprocessor = pipeline.named_steps["preprocessor"]
            X_processed = preprocessor.transform(input_df)

            # Compute SHAP values
            shap_values = explainer(X_processed)

            # Derive feature names
            feature_names = get_shap_feature_names(pipeline)
            shap_values.feature_names = feature_names

            # Render waterfall plot via matplotlib
            fig_shap, ax_shap = plt.subplots(figsize=(10, 5))
            shap.plots.waterfall(shap_values[0], max_display=12, show=False)
            st.pyplot(plt.gcf(), use_container_width=True)
            plt.close("all")
        except Exception as e:
            st.warning(f"⚠️ Could not generate SHAP plot: {e}")

# ========================== TAB 2: BATCH PROCESSING ========================

with tab2:
    st.subheader("📦 Batch Score Students from CSV")
    st.info(
        "Upload a CSV file with columns: "
        + ", ".join(f"`{c}`" for c in FEATURE_COLS)
        + ". The system will predict Priority Scores for every row."
    )

    uploaded = st.file_uploader(
        "Drag & drop your CSV here", type=["csv"], label_visibility="collapsed"
    )

    if uploaded is not None:
        try:
            df_batch = pd.read_csv(uploaded)
        except Exception as e:
            st.error(f"❌ Failed to read CSV: {e}")
            st.stop()

        # Validate required columns
        missing = set(FEATURE_COLS) - set(df_batch.columns)
        if missing:
            st.error(f"❌ Missing required columns: **{', '.join(missing)}**")
            st.stop()

        # Predict
        with st.spinner("Scoring applicants …"):
            raw_preds = pipeline.predict(df_batch[FEATURE_COLS])
            df_batch["Predicted_Priority_Score"] = np.clip(raw_preds, 0, 100).round(2)

        st.success(f"✅ Scored **{len(df_batch):,}** applicants successfully!")

        # Summary metrics
        b1, b2, b3, b4 = st.columns(4)
        b1.metric("Students Scored", f"{len(df_batch):,}")
        b2.metric("Mean Score", f"{df_batch['Predicted_Priority_Score'].mean():.1f}")
        b3.metric(
            "High Priority (≥80)",
            f"{(df_batch['Predicted_Priority_Score'] >= 80).sum():,}",
        )
        b4.metric("Median Score", f"{df_batch['Predicted_Priority_Score'].median():.1f}")

        # Plotly histogram
        st.markdown("#### 📊 Score Distribution")
        fig = px.histogram(
            df_batch,
            x="Predicted_Priority_Score",
            nbins=30,
            color_discrete_sequence=["#667eea"],
            labels={"Predicted_Priority_Score": "Priority Score"},
            title="Distribution of Predicted Priority Scores",
        )
        fig.update_layout(
            bargap=0.05,
            xaxis_title="Priority Score",
            yaxis_title="Number of Students",
            template="plotly_white",
            font=dict(family="Inter, sans-serif"),
        )
        # Add tier reference lines
        fig.add_vline(x=80, line_dash="dash", line_color="#16a34a",
                      annotation_text="High ≥ 80")
        fig.add_vline(x=50, line_dash="dash", line_color="#ea580c",
                      annotation_text="Medium ≥ 50")
        st.plotly_chart(fig, use_container_width=True)

        # Preview + Download
        st.markdown("#### 📄 Results Preview")
        st.dataframe(df_batch, use_container_width=True, height=400)

        csv_bytes = df_batch.to_csv(index=False).encode("utf-8")
        st.download_button(
            label="⬇️ Download Results CSV",
            data=csv_bytes,
            file_name="batch_scored_results.csv",
            mime="text/csv",
            type="primary",
            use_container_width=True,
        )

# ========================== TAB 3: DATABASE RECORDS ========================

with tab3:
    st.subheader("🗄️ Applicant Records — SQLite Database")

    if st.button("🔄 Refresh Records", type="secondary"):
        st.rerun()

    try:
        df_records = fetch_all_applicants()
    except Exception as e:
        st.error(f"❌ Database error: {e}")
        st.stop()

    if df_records.empty:
        st.info("No applicant records found yet. Use the **Single Applicant** tab to add entries.")
    else:
        st.caption(f"Showing **{len(df_records):,}** records (most recent first)")
        st.dataframe(df_records, use_container_width=True, height=500)

        # Quick stats below
        r1, r2, r3 = st.columns(3)
        r1.metric("Total Records", f"{len(df_records):,}")
        r2.metric(
            "Avg Score",
            f"{df_records['predicted_priority_score'].mean():.1f}"
            if "predicted_priority_score" in df_records.columns
            else "N/A",
        )
        r3.metric(
            "High Priority",
            f"{(df_records['predicted_priority_score'] >= 80).sum():,}"
            if "predicted_priority_score" in df_records.columns
            else "N/A",
        )