# FILE: backend/main.py
# ===========================================================================
# FastAPI server for the Tejas Scholarship Allocator.
# Loads the production sklearn Pipeline and exposes a prediction endpoint.
# ===========================================================================

import os
import numpy as np
import pandas as pd
import joblib
from typing import Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# ---------------------------------------------------------------------------
# 1. Setup & Configuration
# ---------------------------------------------------------------------------

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_PATH = os.path.join(BASE_DIR, "models", "scholarship_model.pkl")

app = FastAPI(
    title="Tejas — Intelligent Scholarship Allocator API",
    description="ML-powered priority scoring for fair scholarship allocation.",
    version="1.0.0",
)

# CORS — allow the Vite frontend (dev server on port 5173)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# 2. Load the Production Pipeline at Startup
# ---------------------------------------------------------------------------

pipeline = None


@app.on_event("startup")
def load_model():
    """Load the saved sklearn Pipeline (preprocessor + regressor) once."""
    global pipeline
    if not os.path.exists(MODEL_PATH):
        raise RuntimeError(f"Model file not found at {MODEL_PATH}")
    pipeline = joblib.load(MODEL_PATH)
    print(f"   ✅ Loaded pipeline from {MODEL_PATH}")
    print(f"   Pipeline steps: {list(pipeline.named_steps.keys())}")


# ---------------------------------------------------------------------------
# 3. Pydantic Data Model — all 14 features + override fields
# ---------------------------------------------------------------------------

class ApplicantData(BaseModel):
    """
    Mirrors the 14 features expected by the trained pipeline.
    Field names use snake_case; they are mapped to the pipeline's
    mixed-case column names in the predict endpoint.
    """

    # ── Numerical Features (8) ──
    family_income: float = Field(..., ge=0, description="Annual family income in INR")
    tenth_percentage: float = Field(..., ge=0, le=100, description="10th standard percentage")
    twelfth_percentage: float = Field(..., ge=0, le=100, description="12th standard percentage")
    mh_cet_percentile: float = Field(..., ge=0, le=100, description="MH-CET percentile")
    jee_percentile: float = Field(..., ge=0, le=100, description="JEE Mains percentile")
    university_test_score: float = Field(..., ge=0, le=100, description="University entrance test score")
    extracurricular_score: float = Field(..., ge=0, le=10, description="Extracurricular activity score (0-10)")
    gap_year: int = Field(..., ge=0, le=5, description="Number of gap years (0 = none)")

    # ── Categorical Features (5) ──
    caste_category: str = Field(..., description="e.g. General, OBC, SC, ST")
    gender: str = Field(..., description="e.g. Male, Female, Other")
    parent_occupation: str = Field(..., description="e.g. Salaried, Self-Employed, Unemployed, Farmer")
    disability_status: str = Field(..., description="Yes or No")
    college_branch: str = Field(..., description="e.g. Engineering, Arts, Commerce, Science, Medical")

    # ── Binary Passthrough (1) ──
    domicile_maharashtra: int = Field(..., ge=0, le=1, description="1 = Maharashtra domicile, 0 = otherwise")

    # ── Admin Override (optional) ──
    override_score: Optional[float] = Field(None, ge=0, le=100, description="Manual override score")
    override_reason: Optional[str] = Field(None, description="Admin justification for override")


# ---------------------------------------------------------------------------
# 4. Prediction Endpoint
# ---------------------------------------------------------------------------

@app.post("/api/predict")
def predict(data: ApplicantData):
    """
    Accept applicant data, run the ML pipeline, return score + tier.
    If override_score is provided, use it instead of the ML score.
    """
    if pipeline is None:
        raise HTTPException(status_code=503, detail="Model not loaded yet.")

    # A. Map Pydantic fields → DataFrame column names the pipeline expects
    row = {
        "Family_Income": data.family_income,
        "10th_Percentage": data.tenth_percentage,
        "12th_Percentage": data.twelfth_percentage,
        "Mh_CET_Percentile": data.mh_cet_percentile,
        "JEE_Percentile": data.jee_percentile,
        "University_Test_Score": data.university_test_score,
        "Extracurricular_Score": data.extracurricular_score,
        "Gap_Year": data.gap_year,
        "Caste_Category": data.caste_category,
        "Gender": data.gender,
        "Parent_Occupation": data.parent_occupation,
        "Disability_Status": data.disability_status,
        "College_Branch": data.college_branch,
        "Domicile_Maharashtra": data.domicile_maharashtra,
    }

    df = pd.DataFrame([row])

    # B. Run prediction & clip to [0, 100]
    try:
        raw_score = pipeline.predict(df)[0]
        ml_score = float(np.clip(raw_score, 0, 100))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {e}")

    # C. Override logic
    is_overridden = data.override_score is not None
    final_score = round(data.override_score if is_overridden else ml_score, 2)

    # D. Tier assignment
    if final_score > 90:
        tier = "Tier 1: Full Aid"
    elif final_score >= 70:
        tier = "Tier 2: Partial Aid"
    else:
        tier = "Tier 3: No Aid"

    if is_overridden:
        tier += " [OVERRIDE]"

    # E. Build response
    message = (
        f"Admin override applied (reason: {data.override_reason or 'N/A'})."
        if is_overridden
        else "ML prediction completed successfully."
    )

    return {
        "final_score": final_score,
        "ml_score": round(ml_score, 2),
        "tier": tier,
        "is_overridden": is_overridden,
        "message": message,
    }


# ---------------------------------------------------------------------------
# 5. Health Check
# ---------------------------------------------------------------------------

@app.get("/api/health")
def health():
    """Quick health check — confirms the API and model are operational."""
    return {
        "status": "ok",
        "model_loaded": pipeline is not None,
    }
