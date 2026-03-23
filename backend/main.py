# FILE: backend/main.py
# ===========================================================================
# FastAPI server for the Tejas Scholarship Allocator.
# Loads the production sklearn pipeline and exposes dashboard endpoints.
# ===========================================================================

import csv
import io
import math
import os
import sqlite3
import sys
import time
from typing import Optional

import yaml
from uuid import uuid4

import joblib
import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from lightgbm import LGBMRegressor
from pydantic import BaseModel, Field, validator
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, r2_score
from xgboost import XGBRegressor

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from src.db_setup import DB_PATH, initialize_database

MODEL_PATH = os.path.join(BASE_DIR, "models", "scholarship_model.pkl")
KMEANS_PATH = os.path.join(BASE_DIR, "models", "kmeans_model.pkl")

# ---------------------------------------------------------------------------
# Dynamic YAML Configuration: load all thresholds & bonuses from the
# central config file so that no magic numbers exist in application code.
# ---------------------------------------------------------------------------
_CONFIG_PATH = os.path.join(BASE_DIR, "config", "scholarship_rules.yaml")
with open(_CONFIG_PATH, "r", encoding="utf-8") as _cfg_file:
    POLICY_RULES: dict = yaml.safe_load(_cfg_file)
print(f"   [OK] Loaded policy rules from {_CONFIG_PATH} (v{POLICY_RULES.get('metadata', {}).get('version', '?')})")

pipeline = None
kmeans_model = None
mlops_cache = None

# K-Means Persona Labels (updated dynamically by retrain_pipeline.py)
DEFAULT_PERSONA_MAP = {
    0: "High Need, Strong Academics",
    1: "Merit Elite",
    2: "Balanced Profile",
    3: "Borderline Candidate",
}

PARENT_OCCUPATION_MAP = {
    "bpl": "BPL",
    "apl": "APL",
    "government": "Government",
    "govt": "Government",
    "private sector": "Private Sector",
    "private": "Private Sector",
    "salaried": "Private Sector",
    "self-employed": "APL",
    "self employed": "APL",
    "farmer": "BPL",
    "unemployed": "BPL",
}

DEFAULT_ADMIN_USER = "Dr. Admin"

# ===========================================================================
# Policy Engine: Non-Linear Scoring Functions
# ===========================================================================

def calculate_income_score(current_income: float, max_income: float = 2500000, min_income: float = 50000) -> float:
    """
    Calculate income-based score using logarithmic decay.

    Formula: income_score = log(max_income / current_income) / log(max_income / min_income) * 100

    Lower income → higher score (progressive redistribution).
    Uses the Need-Based eligibility cap (₹25L) as the max reference and a
    realistic poverty floor (₹50K) as the min reference.

    Reference Points:
        ₹50,000    → 100 pts (extreme poverty)
        ₹100,000   → ~82 pts (very low income)
        ₹250,000   → ~60 pts (low income — deserves strong support)
        ₹500,000   → ~42 pts (lower-middle class)
        ₹1,000,000 → ~24 pts (middle class)
        ₹2,500,000 → ~0  pts (at eligibility cap)

    Args:
        current_income: Applicant's family income in INR
        max_income: Maximum reference income (default ₹25 lakhs — eligibility cap)
        min_income: Minimum reference income floor (default ₹50,000)

    Returns:
        Normalized income score between 0-100
    """
    if current_income <= min_income:
        return 100.0
    if current_income >= max_income:
        return 0.0

    # Logarithmic decay: lower income → higher score
    log_score = math.log(max_income / current_income)
    max_log = math.log(max_income / min_income)
    normalized_score = (log_score / max_log) * 100

    return round(max(0.0, min(100.0, normalized_score)), 2)


def calculate_merit_score(raw_merit: float, k: float = 0.1, midpoint: float = 50) -> float:
    """
    Calculate merit-based score using a sigmoid (logistic) curve.
    
    Formula: merit_score = 100 / (1 + exp(-k * (raw_merit - midpoint)))
    
    Args:
        raw_merit: Raw merit score (typically 0-100 average of exam percentiles)
        k: Steepness of the curve (default 0.1, higher = steeper transition)
        midpoint: Inflection point of the curve (default 50)
    
    Returns:
        Merit score between 0-100 with diminishing returns
    """
    exponent = -k * (raw_merit - midpoint)
    sigmoid_score = 100 / (1 + math.exp(exponent))
    
    return round(max(0.0, min(100.0, sigmoid_score)), 2)


def calculate_policy_score(
    caste_category: str,
    domicile_maharashtra: int,
    gender: str,
    disability_status: str,
    extracurricular_score: float,
    gap_year: int
) -> float:
    """
    Calculate policy-based score using rule-based bonuses.
    All bonus values are read dynamically from POLICY_RULES (scholarship_rules.yaml).

    Returns:
        Policy score component (0 to policy_score_max)
    """
    score = 0.0

    # --- Caste category bonus (from YAML) ---
    caste_bonuses: dict = POLICY_RULES.get("caste_category_bonus", {})
    score += caste_bonuses.get(caste_category, 0)

    # --- Domicile bonus (from YAML) ---
    if domicile_maharashtra == 1:
        score += POLICY_RULES.get("domicile_maharashtra_bonus", 0)

    # --- Gender bonus (from YAML) ---
    gender_bonuses: dict = POLICY_RULES.get("gender_bonus", {})
    score += gender_bonuses.get(gender, 0)

    # --- Disability (PwD) bonus (from YAML) ---
    if disability_status == "Yes":
        score += POLICY_RULES.get("pwd_bonus", 0)

    # --- Extracurricular bonus (banded lookup from YAML) ---
    ec_bands: dict = POLICY_RULES.get("extracurricular_bonus", {})
    ec_bonus = 0
    for band_key, bonus_val in ec_bands.items():
        lo, hi = (int(x) for x in str(band_key).split("-"))
        if lo <= extracurricular_score <= hi:
            ec_bonus = bonus_val
            break
    score += ec_bonus

    # --- Gap year penalty (unchanged; not in YAML) ---
    if gap_year > 0:
        score -= 5

    # --- Cap policy score (from YAML) ---
    policy_cap = POLICY_RULES.get("policy_score_max", 20)
    capped_score = min(float(policy_cap), score)

    return round(max(0.0, capped_score), 2)


def calculate_policy_priority_score(
    income_score: float,
    merit_score: float,
    policy_score: float,
    weights: Optional[dict] = None
) -> float:
    """
    Calculate final Priority Score using weighted combination.
    
    Default weights: Need (40%), Merit (40%), Policy (20%)
    
    Args:
        income_score: Score from calculate_income_score()
        merit_score: Score from calculate_merit_score()
        policy_score: Score from calculate_policy_score()
        weights: Optional dict with 'need', 'merit', 'policy' keys
    
    Returns:
        Final Priority Score (0-100)
    """
    if weights is None:
        weights = {"need": 0.4, "merit": 0.4, "policy": 0.2}
    
    final_score = (
        weights["need"] * income_score +
        weights["merit"] * merit_score +
        weights["policy"] * policy_score
    )
    
    return round(max(0.0, min(100.0, final_score)), 2)


# ===========================================================================
# Policy Engine: Budget-Aware Allocation Engine
# ===========================================================================

def allocate_funds(
    ranked_applicants: list,
    total_budget: float,
    tuition_amount: float = 100000,
    use_budget: bool = True
) -> dict:
    """
    Allocate scholarship funds to ranked applicants.

    If use_budget is False:
      - Tier 1: Top 10% of applicants
      - Tier 2: Next 20% of applicants
      - Tier 3: rest

    If use_budget is True:
      - Top students get 100% of tuition
      - Middle students get 60% of tuition
      - Budget drains down the ranked list

    Returns allocations, summaries, and fairness audit.
    """
    allocations = []
    remaining_budget = total_budget
    total_applicants = len(ranked_applicants)

    # Hard thresholds for relative ranking behavior (non-budget mode)
    top_10_pct = math.ceil(total_applicants * 0.1)
    next_20_pct = math.ceil(total_applicants * 0.2)

    for idx, applicant in enumerate(ranked_applicants):
        score = applicant.get("priority_score", 0)
        applicant_gender = applicant.get("gender", "Unknown")
        applicant_caste = applicant.get("caste_category", "Unknown")

        if use_budget:
            # Budget mode based on score cutoff
            if score >= 90:
                aid_percentage = 1.0
                tier = "Tier 1"
            elif score >= 75:
                aid_percentage = 0.6
                tier = "Tier 2"
            else:
                aid_percentage = 0.0
                tier = "Tier 3"

            requested_aid = tuition_amount * aid_percentage
            if remaining_budget <= 0 or aid_percentage == 0:
                granted_aid = 0.0
                allocation_status = "Not Funded"
            elif remaining_budget < requested_aid:
                granted_aid = remaining_budget
                remaining_budget = 0.0
                allocation_status = "Partial Allocation (Budget Limit)"
            else:
                granted_aid = requested_aid
                remaining_budget -= granted_aid
                allocation_status = "Approved"

        else:
            # Relative ranking allocation without budget drain
            if idx < top_10_pct:
                aid_percentage = 1.0
                tier = "Tier 1"
            elif idx < top_10_pct + next_20_pct:
                aid_percentage = 0.6
                tier = "Tier 2"
            else:
                aid_percentage = 0.0
                tier = "Tier 3"

            requested_aid = tuition_amount * aid_percentage
            granted_aid = requested_aid
            allocation_status = "Approved" if aid_percentage > 0 else "Not Funded"

        allocations.append({
            "application_id": applicant.get("application_id"),
            "applicant_name": applicant.get("applicant_name"),
            "priority_score": score,
            "gender": applicant_gender,
            "caste_category": applicant_caste,
            "tier": tier,
            "aid_percentage": aid_percentage * 100,
            "requested_aid": round(requested_aid, 2),
            "granted_aid": round(granted_aid, 2),
            "allocation_status": allocation_status,
        })

    # Tier distributions
    tier_1_count = sum(1 for a in allocations if a["tier"] == "Tier 1")
    tier_2_count = sum(1 for a in allocations if a["tier"] == "Tier 2")
    tier_3_count = sum(1 for a in allocations if a["tier"] == "Tier 3")

    # Fairness audit: selection rate by Gender and Caste
    selected = [a for a in allocations if a["tier"] in {"Tier 1", "Tier 2"}]

    def selection_rate_by_attribute(attribute: str, values: list[str]) -> dict:
        rates = {}
        for v in values:
            total_by_attr = sum(1 for a in allocations if a.get(attribute) == v)
            selected_by_attr = sum(1 for a in selected if a.get(attribute) == v)
            rates[v] = round((selected_by_attr / total_by_attr) * 100, 2) if total_by_attr > 0 else 0.0
        return rates

    gender_options = ["Male", "Female", "Other", "Unknown"]
    caste_options = ["General", "OBC", "SC", "ST", "Unknown"]

    fairness_audit = {
        "gender_selection_rate": selection_rate_by_attribute("gender", gender_options),
        "caste_selection_rate": selection_rate_by_attribute("caste_category", caste_options),
        "overall_selection_rate": round((len(selected) / total_applicants) * 100, 2) if total_applicants > 0 else 0.0,
    }

    total_granted = sum(a["granted_aid"] for a in allocations)
    rejected_count = total_applicants - tier_1_count - tier_2_count

    return {
        "allocations": allocations,
        "budget_summary": {
            "initial_budget": round(total_budget, 2),
            "remaining_budget": round(remaining_budget, 2),
            "total_allocated": round(total_granted, 2),
            "budget_utilization_percentage": round((total_granted / total_budget) * 100, 2) if total_budget > 0 else 0
        },
        "allocation_summary": {
            "total_applicants": total_applicants,
            "tier_1": tier_1_count,
            "tier_2": tier_2_count,
            "tier_3": tier_3_count,
            "ineligible": 0,
            "rejected_or_exhausted": rejected_count,
        },
        "fairness_audit": fairness_audit,
        "allocation_engine": "greedy",
    }


# ===========================================================================
# Operations Research: Knapsack-Style Optimization Allocator
# ===========================================================================

def allocate_funds_knapsack(
    ranked_applicants: list,
    total_budget: float,
    tuition_amount: float = 100000,
) -> dict:
    """
    Optimize scholarship fund allocation using a Knapsack-style approach.
    
    Instead of greedy top-down filling, this algorithm maximizes the total
    weighted impact (Priority Score * Funding Granted) across the entire
    cohort subject to the budget constraint.
    
    Uses fractional knapsack (value-density sorting) since funding can be
    100% (Tier 1) or 60% (Tier 2), allowing for fractional allocation.
    
    Objective: Maximize SUM(priority_score * granted_aid) for all applicants
    Constraint: SUM(granted_aid) <= total_budget
    """
    total_applicants = len(ranked_applicants)
    if total_applicants == 0:
        return {
            "allocations": [],
            "budget_summary": {"initial_budget": total_budget, "remaining_budget": total_budget, "total_allocated": 0, "budget_utilization_percentage": 0},
            "allocation_summary": {"total_applicants": 0, "tier_1": 0, "tier_2": 0, "tier_3": 0, "ineligible": 0, "rejected_or_exhausted": 0},
            "fairness_audit": {},
            "allocation_engine": "knapsack",
        }

    # Step 1: Build candidate allocation items
    # Each applicant can receive Tier 1 (100%) or Tier 2 (60%) funding
    # Value = priority_score * aid_amount (impact per rupee)
    candidates = []
    for applicant in ranked_applicants:
        score = applicant.get("priority_score", 0)
        app_id = applicant.get("application_id")
        
        # Tier 1 option: Full aid
        tier1_cost = tuition_amount * 1.0
        tier1_value = score * tier1_cost  # Total impact
        tier1_density = score  # Value per rupee = score (since cost normalizes)
        
        # Tier 2 option: Partial aid
        tier2_cost = tuition_amount * 0.6
        tier2_value = score * tier2_cost
        tier2_density = score  # Same density since score/1 = score
        
        candidates.append({
            "applicant": applicant,
            "score": score,
            "tier1_cost": tier1_cost,
            "tier1_value": tier1_value,
            "tier2_cost": tier2_cost,
            "tier2_value": tier2_value,
            "density": tier1_density,  # Value density for sorting
        })
    
    # Step 2: Sort by value density (highest impact per rupee first)
    candidates.sort(key=lambda x: x["density"], reverse=True)
    
    # Step 3: Fractional Knapsack allocation
    remaining_budget = total_budget
    allocations = []
    
    for cand in candidates:
        applicant = cand["applicant"]
        score = cand["score"]
        
        if remaining_budget <= 0 or score < 50:  # Minimum score threshold
            # Not funded
            allocations.append({
                "application_id": applicant.get("application_id"),
                "applicant_name": applicant.get("applicant_name"),
                "priority_score": score,
                "gender": applicant.get("gender", "Unknown"),
                "caste_category": applicant.get("caste_category", "Unknown"),
                "tier": "Tier 3",
                "aid_percentage": 0,
                "requested_aid": 0,
                "granted_aid": 0,
                "allocation_status": "Not Funded",
            })
            continue
        
        # Try Tier 1 first (maximize impact)
        if remaining_budget >= cand["tier1_cost"] and score >= 75:
            granted = cand["tier1_cost"]
            remaining_budget -= granted
            allocations.append({
                "application_id": applicant.get("application_id"),
                "applicant_name": applicant.get("applicant_name"),
                "priority_score": score,
                "gender": applicant.get("gender", "Unknown"),
                "caste_category": applicant.get("caste_category", "Unknown"),
                "tier": "Tier 1",
                "aid_percentage": 100,
                "requested_aid": round(cand["tier1_cost"], 2),
                "granted_aid": round(granted, 2),
                "allocation_status": "Approved (Optimized)",
            })
        # Try Tier 2 (more students funded with same budget)
        elif remaining_budget >= cand["tier2_cost"] and score >= 50:
            granted = cand["tier2_cost"]
            remaining_budget -= granted
            allocations.append({
                "application_id": applicant.get("application_id"),
                "applicant_name": applicant.get("applicant_name"),
                "priority_score": score,
                "gender": applicant.get("gender", "Unknown"),
                "caste_category": applicant.get("caste_category", "Unknown"),
                "tier": "Tier 2",
                "aid_percentage": 60,
                "requested_aid": round(cand["tier2_cost"], 2),
                "granted_aid": round(granted, 2),
                "allocation_status": "Approved (Optimized)",
            })
        # Partial allocation with remaining budget
        elif remaining_budget > 0 and score >= 50:
            granted = remaining_budget
            remaining_budget = 0
            allocations.append({
                "application_id": applicant.get("application_id"),
                "applicant_name": applicant.get("applicant_name"),
                "priority_score": score,
                "gender": applicant.get("gender", "Unknown"),
                "caste_category": applicant.get("caste_category", "Unknown"),
                "tier": "Tier 2",
                "aid_percentage": round((granted / tuition_amount) * 100, 1),
                "requested_aid": round(cand["tier2_cost"], 2),
                "granted_aid": round(granted, 2),
                "allocation_status": "Partial Allocation (Budget Limit)",
            })
        else:
            allocations.append({
                "application_id": applicant.get("application_id"),
                "applicant_name": applicant.get("applicant_name"),
                "priority_score": score,
                "gender": applicant.get("gender", "Unknown"),
                "caste_category": applicant.get("caste_category", "Unknown"),
                "tier": "Tier 3",
                "aid_percentage": 0,
                "requested_aid": 0,
                "granted_aid": 0,
                "allocation_status": "Not Funded (Budget Exhausted)",
            })
    
    # Compute summaries
    tier_1_count = sum(1 for a in allocations if a["tier"] == "Tier 1")
    tier_2_count = sum(1 for a in allocations if a["tier"] == "Tier 2")
    tier_3_count = sum(1 for a in allocations if a["tier"] == "Tier 3")
    selected = [a for a in allocations if a["tier"] in {"Tier 1", "Tier 2"}]
    total_granted = sum(a["granted_aid"] for a in allocations)
    
    # Compute total weighted impact (the objective function value)
    total_impact = sum(a["priority_score"] * a["granted_aid"] for a in allocations)
    
    def selection_rate_by_attribute(attribute: str, values: list) -> dict:
        rates = {}
        for v in values:
            total_by_attr = sum(1 for a in allocations if a.get(attribute) == v)
            selected_by_attr = sum(1 for a in selected if a.get(attribute) == v)
            rates[v] = round((selected_by_attr / total_by_attr) * 100, 2) if total_by_attr > 0 else 0.0
        return rates
    
    fairness_audit = {
        "gender_selection_rate": selection_rate_by_attribute("gender", ["Male", "Female", "Other", "Unknown"]),
        "caste_selection_rate": selection_rate_by_attribute("caste_category", ["General", "OBC", "SC", "ST", "Unknown"]),
        "overall_selection_rate": round((len(selected) / total_applicants) * 100, 2) if total_applicants > 0 else 0.0,
    }
    
    return {
        "allocations": allocations,
        "budget_summary": {
            "initial_budget": round(total_budget, 2),
            "remaining_budget": round(remaining_budget, 2),
            "total_allocated": round(total_granted, 2),
            "budget_utilization_percentage": round((total_granted / total_budget) * 100, 2) if total_budget > 0 else 0,
            "total_weighted_impact": round(total_impact, 2),
        },
        "allocation_summary": {
            "total_applicants": total_applicants,
            "tier_1": tier_1_count,
            "tier_2": tier_2_count,
            "tier_3": tier_3_count,
            "ineligible": 0,
            "rejected_or_exhausted": total_applicants - tier_1_count - tier_2_count,
        },
        "fairness_audit": fairness_audit,
        "allocation_engine": "knapsack",
    }


app = FastAPI(
    title="Tejas - Intelligent Scholarship Allocator API",
    description="ML-powered priority scoring for fair scholarship allocation.",
    version="1.0.0",
)

_frontend_url = os.environ.get("FRONTEND_URL", "http://localhost:5173")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[_frontend_url, "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ApplicantData(BaseModel):
    """Input payload expected by the trained pipeline and dashboard."""

    applicant_name: Optional[str] = Field(None, description="Applicant name for dashboard persistence")
    family_income: float = Field(..., ge=0, description="Annual family income in INR")
    tenth_percentage: float = Field(..., ge=0, le=100, description="10th standard percentage")
    twelfth_percentage: float = Field(..., ge=0, le=100, description="12th standard percentage")
    mh_cet_percentile: float = Field(..., ge=0, le=100, description="MH-CET percentile")
    jee_percentile: float = Field(..., ge=0, le=100, description="JEE Mains percentile")
    university_test_score: float = Field(..., ge=0, le=100, description="University entrance test score")
    extracurricular_score: float = Field(..., ge=0, le=10, description="Extracurricular activity score (0-10)")
    gap_year: int = Field(..., ge=0, le=5, description="Number of gap years (0 = none)")
    caste_category: str = Field(..., description="e.g. General, OBC, SC, ST")
    gender: str = Field(..., description="e.g. Male, Female, Other")
    parent_occupation: str = Field(..., description="Accepted values: BPL, APL, Government, Private Sector")
    disability_status: str = Field(..., description="Yes or No")
    college_branch: str = Field(..., description="e.g. Engineering, Arts, Commerce, Science, Medical")
    domicile_maharashtra: int = Field(..., ge=0, le=1, description="1 = Maharashtra domicile, 0 = otherwise")
    took_competitive_exam: bool = Field(default=False, description="Whether applicant took JEE/NEET/competitive exam")
    competitive_exam_type: Optional[str] = Field(None, description="e.g. JEE, NEET, Other")
    competitive_exam_score: Optional[float] = Field(None, ge=0, le=100, description="JEE/NEET percentile or score (0-100)")
    scholarship_track: str = Field(default="Need Based", description="Scholarship track: 'Merit Based' or 'Need Based'")
    override_score: Optional[float] = Field(None, ge=0, le=100, description="Manual override score")
    override_reason: Optional[str] = Field(None, description="Admin justification for override")
    override_user: Optional[str] = Field(None, description="Admin user who submitted the override")

    @validator("parent_occupation")
    def normalize_parent_occupation(cls, value: str) -> str:
        normalized = PARENT_OCCUPATION_MAP.get(value.strip().lower())
        if normalized is None:
            allowed = ", ".join(sorted(set(PARENT_OCCUPATION_MAP.values())))
            raise ValueError(f"Unsupported parent_occupation '{value}'. Use one of: {allowed}")
        return normalized


def check_eligibility(applicant: 'ApplicantData', track: str) -> bool:
    """Hard eligibility filters: if failed, applicant is Tier 4 Ineligible.

    All thresholds are read dynamically from POLICY_RULES (scholarship_rules.yaml).

    Criteria (from YAML):
    - All tracks: 12th percentage >= academic_floor_twelfth_percent
    - Need Based: Family income <= need_based_income_cap
    - Merit Based: 12th percentage >= merit_based_academic_floor
                   AND at least one entrance exam meets threshold
                       (JEE >= merit_based_entrance_exam_min OR
                        MH-CET >= merit_based_mhcet_threshold)
    """
    # Universal criteria (from YAML)
    universal_floor = POLICY_RULES.get("academic_floor_twelfth_percent", 60)
    if applicant.twelfth_percentage < universal_floor:
        return False

    # Track-specific criteria
    if track == "Need Based":
        income_cap = POLICY_RULES.get("need_based_income_cap", 2500000)
        if applicant.family_income > income_cap:
            return False
    elif track == "Merit Based":
        # Higher academic bar (from YAML)
        merit_floor = POLICY_RULES.get("merit_based_academic_floor", 70)
        if applicant.twelfth_percentage < merit_floor:
            return False

        # Entrance exam gate: at least one exam must meet its threshold
        entrance_min = POLICY_RULES.get("merit_based_entrance_exam_min", 50)
        mhcet_min = POLICY_RULES.get("merit_based_mhcet_threshold", 60)

        jee_ok = applicant.jee_percentile >= entrance_min
        mhcet_ok = applicant.mh_cet_percentile >= mhcet_min

        if not (jee_ok or mhcet_ok):
            return False

    return True


class SimulationRequest(BaseModel):
    """Input payload for the What-If Policy Simulator."""

    total_budget: float = Field(default=5000000, ge=0, description="Total scholarship budget in INR")
    merit_weight: float = Field(default=0.4, ge=0, le=1, description="Weight for merit component (0-1)")
    income_weight: float = Field(default=0.4, ge=0, le=1, description="Weight for income/need component (0-1)")
    policy_weight: float = Field(default=0.2, ge=0, le=1, description="Weight for policy component (0-1)")
    base_tuition: float = Field(default=100000, gt=0, description="Base tuition amount for aid calculations")
    allocation_engine: str = Field(default="greedy", description="Allocation engine: 'greedy' or 'knapsack'")
    use_budget: bool = Field(default=True, description="Whether to enforce budget constraint")


@app.on_event("startup")
def startup() -> None:
    """Ensure schema exists and load the production pipeline + K-Means."""
    global pipeline, kmeans_model

    initialize_database()

    if not os.path.exists(MODEL_PATH):
        raise RuntimeError(f"Model file not found at {MODEL_PATH}")

    pipeline = joblib.load(MODEL_PATH)
    print(f"   [OK] Loaded pipeline from {MODEL_PATH}")
    print(f"   Pipeline steps: {list(pipeline.named_steps.keys())}")

    # Load K-Means Persona Model (optional, non-fatal if missing)
    if os.path.exists(KMEANS_PATH):
        kmeans_model = joblib.load(KMEANS_PATH)
        print(f"   [OK] Loaded K-Means persona model from {KMEANS_PATH}")
    else:
        print(f"   [WARN] K-Means model not found at {KMEANS_PATH} - personas disabled")


def get_db_connection() -> sqlite3.Connection:
    """Open the SQLite database with row access enabled."""
    initialize_database()
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL;")
    conn.execute("PRAGMA foreign_keys=ON;")
    return conn


def score_to_tier(score: Optional[float]) -> str:
    """Map a numeric score to the display tier used across the product."""
    if score is None:
        return "Unscored"
    if score >= 80:
        return "Tier 1"
    if score >= 50:
        return "Tier 2"
    return "Tier 3"


def score_to_label(score: float, overridden: bool = False) -> str:
    """Map a numeric score to the user-facing Decision Center label."""
    if score >= 80:
        label = "Tier 1: Full Aid"
    elif score >= 50:
        label = "Tier 2: Partial Aid"
    else:
        label = "Tier 3: No Aid"

    if overridden:
        label += " [OVERRIDE]"
    return label


def normalized_name(data: ApplicantData) -> str:
    """Return a non-empty applicant name."""
    value = (data.applicant_name or "Unnamed Applicant").strip()
    return value or "Unnamed Applicant"


def normalized_override_user(data: ApplicantData) -> str:
    """Return the acting admin user, using a safe default when auth is absent."""
    value = (data.override_user or DEFAULT_ADMIN_USER).strip()
    return value or DEFAULT_ADMIN_USER


def fetch_database_rows(
    *,
    table_name: str,
    search: str = "",
    page: int = 1,
    page_size: int = 10,
    export_all: bool = False,
) -> tuple[list[dict], int]:
    """Fetch paginated rows for the Applicant Database sub-tabs."""
    if table_name not in {"generated_applications", "decision_center_applications", "override_audit"}:
        raise HTTPException(status_code=400, detail="Unsupported database view requested.")

    normalized_search = search.strip().lower()
    offset = (page - 1) * page_size

    query_map = {
        "generated_applications": """
            SELECT
                application_id,
                applicant_name,
                caste_category,
                family_income,
                twelfth_percentage,
                mh_cet_percentile,
                jee_percentile,
                predicted_priority_score,
                created_at
            FROM generated_applications
        """,
        "decision_center_applications": """
            SELECT
                application_id,
                applicant_name,
                ml_score,
                final_score,
                decision_tier,
                is_overridden,
                submitted_by,
                created_at
            FROM decision_center_applications
        """,
        "override_audit": """
            SELECT
                decision_application_id,
                applicant_name,
                ml_score,
                override_score,
                final_tier,
                override_reason,
                override_user,
                created_at
            FROM override_audit
        """,
    }

    search_column_id = "decision_application_id" if table_name == "override_audit" else "application_id"
    base_query = query_map[table_name]
    params = []

    if normalized_search:
        base_query += f" WHERE lower({search_column_id}) LIKE ? OR lower(applicant_name) LIKE ?"
        like_value = f"%{normalized_search}%"
        params.extend([like_value, like_value])

    base_query += " ORDER BY datetime(created_at) DESC"
    if not export_all:
        base_query += " LIMIT ? OFFSET ?"
        params.extend([page_size, offset])

    count_query = f"SELECT COUNT(*) FROM ({query_map[table_name]}"
    count_params = []
    if normalized_search:
        count_query += f" WHERE lower({search_column_id}) LIKE ? OR lower(applicant_name) LIKE ?"
        like_value = f"%{normalized_search}%"
        count_params.extend([like_value, like_value])
    count_query += ")"

    try:
        with get_db_connection() as conn:
            total = conn.execute(count_query, count_params).fetchone()[0]
            rows = conn.execute(base_query, params).fetchall()
    except sqlite3.Error as exc:
        raise HTTPException(status_code=500, detail=f"Database query failed: {exc}") from exc

    items: list[dict] = []
    for row in rows:
        if table_name == "generated_applications":
            score = row["predicted_priority_score"]
            items.append(
                {
                    "application_id": row["application_id"],
                    "applicant_name": row["applicant_name"],
                    "caste_category": row["caste_category"],
                    "family_income": float(row["family_income"]) if row["family_income"] is not None else None,
                    "twelfth_percentage": row["twelfth_percentage"],
                    "mh_cet_percentile": row["mh_cet_percentile"],
                    "jee_percentile": row["jee_percentile"],
                    "predicted_priority_score": score,
                    "tier": score_to_tier(score),
                    "created_at": row["created_at"],
                }
            )
        elif table_name == "decision_center_applications":
            items.append(
                {
                    "application_id": row["application_id"],
                    "applicant_name": row["applicant_name"],
                    "ml_score": row["ml_score"],
                    "final_score": row["final_score"],
                    "decision_tier": row["decision_tier"],
                    "is_overridden": bool(row["is_overridden"]),
                    "submitted_by": row["submitted_by"],
                    "created_at": row["created_at"],
                }
            )
        else:
            items.append(
                {
                    "decision_application_id": row["decision_application_id"],
                    "applicant_name": row["applicant_name"],
                    "ml_score": row["ml_score"],
                    "override_score": row["override_score"],
                    "final_tier": row["final_tier"],
                    "override_reason": row["override_reason"],
                    "override_user": row["override_user"],
                    "created_at": row["created_at"],
                }
            )

    return items, total


def write_csv_response(filename: str, headers: list[str], rows: list[list[object]]) -> StreamingResponse:
    """Create a CSV streaming response."""
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(headers)
    writer.writerows(rows)
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


def persist_decision_records(data: ApplicantData, ml_score: float, final_score: float, final_tier: str) -> None:
    """Persist Decision Center submissions into dedicated tables and training history."""
    applicant_name = normalized_name(data)
    application_id = f"DEC-{uuid4().hex[:8].upper()}"
    submitted_by = normalized_override_user(data)
    is_overridden = data.override_score is not None

    try:
        with get_db_connection() as conn:
            decision_payload = (
                application_id,
                applicant_name,
                data.family_income,
                data.caste_category,
                data.domicile_maharashtra,
                data.mh_cet_percentile,
                data.jee_percentile,
                data.university_test_score,
                data.twelfth_percentage,
                data.extracurricular_score,
                data.tenth_percentage,
                data.gender,
                data.parent_occupation,
                data.gap_year,
                data.disability_status,
                data.college_branch,
                ml_score,
                final_score,
                final_tier,
                int(is_overridden),
                submitted_by,
            )

            conn.execute(
                """
                INSERT INTO decision_center_applications (
                    application_id,
                    applicant_name,
                    family_income,
                    caste_category,
                    domicile_maharashtra,
                    mh_cet_percentile,
                    jee_percentile,
                    university_test_score,
                    twelfth_percentage,
                    extracurricular_score,
                    tenth_percentage,
                    gender,
                    parent_occupation,
                    gap_year,
                    disability_status,
                    college_branch,
                    ml_score,
                    final_score,
                    decision_tier,
                    is_overridden,
                    submitted_by
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                decision_payload,
            )

            conn.execute(
                """
                INSERT INTO applicants (
                    application_id,
                    applicant_name,
                    family_income,
                    caste_category,
                    domicile_maharashtra,
                    mh_cet_percentile,
                    jee_percentile,
                    university_test_score,
                    twelfth_percentage,
                    extracurricular_score,
                    tenth_percentage,
                    gender,
                    parent_occupation,
                    gap_year,
                    disability_status,
                    college_branch,
                    predicted_priority_score
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    application_id,
                    applicant_name,
                    data.family_income,
                    data.caste_category,
                    data.domicile_maharashtra,
                    data.mh_cet_percentile,
                    data.jee_percentile,
                    data.university_test_score,
                    data.twelfth_percentage,
                    data.extracurricular_score,
                    data.tenth_percentage,
                    data.gender,
                    data.parent_occupation,
                    data.gap_year,
                    data.disability_status,
                    data.college_branch,
                    final_score,
                ),
            )

            if is_overridden:
                conn.execute(
                    """
                    INSERT INTO override_audit (
                        decision_application_id,
                        applicant_name,
                        ml_score,
                        override_score,
                        final_tier,
                        override_reason,
                        override_user
                    ) VALUES (?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        application_id,
                        applicant_name,
                        ml_score,
                        final_score,
                        final_tier,
                        data.override_reason or "",
                        submitted_by,
                    ),
                )

            conn.commit()
    except sqlite3.Error as exc:
        raise HTTPException(status_code=500, detail=f"Prediction save failed: {exc}") from exc


@app.post("/api/predict")
def predict(data: ApplicantData):
    """
    Accept applicant data, run the ML pipeline, return score + tier.
    If override_score is provided, use it instead of the ML score.
    Applies dynamic weights based on scholarship_track.
    """
    if pipeline is None:
        raise HTTPException(status_code=503, detail="Model not loaded yet.")

    # Determine dynamic weights based on scholarship track
    track = data.scholarship_track or "Need Based"
    if track == "Merit Based":
        # Merit-focused: 60% merit, 20% income, 20% policy
        dynamic_weights = {"merit": 0.60, "income": 0.20, "policy": 0.20}
    elif track == "Need Based":
        # Need-focused: 25% merit, 55% income, 20% policy
        # (Prioritizes financial need but still rewards academic excellence)
        dynamic_weights = {"merit": 0.25, "income": 0.55, "policy": 0.20}
    else:
        # Default/fallback weights
        dynamic_weights = {"merit": 0.40, "income": 0.40, "policy": 0.20}

    # Hard eligibility filters
    if not check_eligibility(data, track):
        final_score = 0.0
        ml_score = 0.0
        tier = "Tier 4: Ineligible"
        score_breakdown = {
            "merit_contribution": 0.0,
            "income_contribution": 0.0,
            "policy_contribution": 0.0,
        }

        persist_decision_records(data, ml_score, final_score, tier)

        ineligibility_reason = "12th percentage < 60"
        if track == "Need Based" and data.family_income > 2500000:
            ineligibility_reason = "Family income > ₹25,00,000 for Need Based track"
        elif track == "Merit Based" and data.twelfth_percentage < 70:
            ineligibility_reason = "12th percentage < 70% required for Merit Based track"

        return {
            "final_score": final_score,
            "ml_score": ml_score,
            "tier": tier,
            "is_overridden": False,
            "scholarship_track": track,
            "weights_used": dynamic_weights,
            "breakdown": score_breakdown,
            "message": f"Ineligible: {ineligibility_reason}.",
        }

    # Calculate individual component scores for policy engine
    income_score = calculate_income_score(data.family_income)
    
    # Compute raw merit score (average of academic percentiles)
    # If competitive exam taken, include it; otherwise use standard exams
    if data.took_competitive_exam and data.competitive_exam_score is not None:
        raw_merit = (
            data.twelfth_percentage + data.mh_cet_percentile + 
            data.jee_percentile + data.university_test_score + data.competitive_exam_score
        ) / 5
    else:
        raw_merit = (
            data.twelfth_percentage + data.mh_cet_percentile + 
            data.jee_percentile + data.university_test_score
        ) / 4
    merit_score = calculate_merit_score(raw_merit, k=0.1, midpoint=50)
    
    # Calculate policy score
    policy_score = calculate_policy_score(
        caste_category=data.caste_category,
        domicile_maharashtra=data.domicile_maharashtra,
        gender=data.gender,
        disability_status=data.disability_status,
        extracurricular_score=data.extracurricular_score,
        gap_year=data.gap_year,
    )
    
    # Calculate weighted contributions (breakdown for XAI)
    weights_for_calc = {"need": dynamic_weights["income"], "merit": dynamic_weights["merit"], "policy": dynamic_weights["policy"]}
    merit_contribution = merit_score * weights_for_calc["merit"]
    income_contribution = income_score * weights_for_calc["need"]
    policy_contribution = policy_score * weights_for_calc["policy"]
    
    # Calculate final priority score with dynamic weights
    priority_score = merit_contribution + income_contribution + policy_contribution
    
    # Build breakdown for explainability
    score_breakdown = {
        "merit_contribution": round(merit_contribution, 2),
        "income_contribution": round(income_contribution, 2),
        "policy_contribution": round(policy_contribution, 2),
    }

    # Run ML pipeline for reference
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

    try:
        raw_score = pipeline.predict(df)[0]
        ml_score = round(float(np.clip(raw_score, 0, 100)), 2)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {exc}") from exc

    # Use priority score from policy engine as final score
    is_overridden = data.override_score is not None
    final_score = round(data.override_score if is_overridden else priority_score, 2)
    tier = score_to_label(final_score, overridden=is_overridden)

    persist_decision_records(data, ml_score, final_score, tier)

    # K-Means Persona Assignment (Unsupervised ML)
    applicant_persona = None
    applicant_cluster = None
    if kmeans_model is not None:
        try:
            # Use the pipeline's preprocessor to transform the input
            preprocessor = pipeline.named_steps.get("preprocessor")
            if preprocessor is not None:
                transformed = preprocessor.transform(df)
                cluster_id = int(kmeans_model.predict(transformed)[0])
                applicant_cluster = cluster_id
                applicant_persona = DEFAULT_PERSONA_MAP.get(cluster_id, f"Cluster {cluster_id}")
        except Exception:
            applicant_persona = "Unavailable"

    message = (
        f"Admin override applied by {normalized_override_user(data)} (reason: {data.override_reason or 'N/A'})."
        if is_overridden
        else f"{track} algorithm completed successfully."
    )

    response = {
        "final_score": final_score,
        "ml_score": ml_score,
        "tier": tier,
        "is_overridden": is_overridden,
        "scholarship_track": track,
        "weights_used": dynamic_weights,
        "breakdown": score_breakdown,
        "message": message,
    }

    # Include persona if K-Means model is loaded
    if applicant_persona is not None:
        response["ml_persona"] = applicant_persona
        response["ml_cluster_id"] = applicant_cluster

    return response


@app.post("/api/simulate")
def simulate_policy(request: SimulationRequest):
    """
    What-If Policy Simulator: Test different policy weight combinations
    and see their impact on budget allocation and demographic fairness.
    """
    # Validate weights sum to approximately 1.0
    weight_sum = request.merit_weight + request.income_weight + request.policy_weight
    if abs(weight_sum - 1.0) > 0.001:
        raise HTTPException(
            status_code=400,
            detail=f"Policy weights must sum to 1.0 (got {weight_sum:.3f}). "
                   f"Adjust merit_weight ({request.merit_weight}), "
                   f"income_weight ({request.income_weight}), "
                   f"policy_weight ({request.policy_weight})."
        )

    # Fetch all applicants from the database
    query = """
        SELECT
            application_id,
            applicant_name,
            caste_category,
            gender,
            family_income,
            twelfth_percentage,
            mh_cet_percentile,
            jee_percentile,
            university_test_score,
            extracurricular_score,
            gap_year,
            domicile_maharashtra,
            disability_status
        FROM generated_applications
        WHERE predicted_priority_score IS NOT NULL
    """

    try:
        with get_db_connection() as conn:
            df = pd.read_sql_query(query, conn)
    except sqlite3.Error as exc:
        raise HTTPException(status_code=500, detail=f"Database query failed: {exc}") from exc

    if df.empty:
        return {
            "simulation_parameters": {
                "total_budget": request.total_budget,
                "merit_weight": request.merit_weight,
                "income_weight": request.income_weight,
                "policy_weight": request.policy_weight,
                "base_tuition": request.base_tuition,
            },
            "impact_summary": {
                "budget_utilized": 0,
                "students_funded": 0,
                "tier_breakdown": {"tier_1_full_aid": 0, "tier_2_partial_aid": 0},
                "demographic_impact": {},
            },
            "allocations": [],
            "message": "No applicants found in database for simulation.",
        }

    # Calculate new priority scores using policy engine with custom weights
    custom_weights = {
        "need": request.income_weight,
        "merit": request.merit_weight,
        "policy": request.policy_weight,
    }

    # Compute raw merit score (average of percentiles)
    df["raw_merit"] = (
        df["twelfth_percentage"] + df["mh_cet_percentile"] + 
        df["jee_percentile"] + df["university_test_score"]
    ) / 4

    # Calculate individual components
    df["income_score"] = df["family_income"].apply(calculate_income_score)
    df["merit_score"] = df["raw_merit"].apply(
        lambda x: calculate_merit_score(x, k=0.1, midpoint=50)
    )
    df["policy_score"] = df.apply(
        lambda row: calculate_policy_score(
            caste_category=row["caste_category"],
            domicile_maharashtra=row["domicile_maharashtra"],
            gender=row["gender"],
            disability_status=row["disability_status"],
            extracurricular_score=row["extracurricular_score"],
            gap_year=row["gap_year"],
        ),
        axis=1,
    )

    # Calculate final priority score with custom weights
    df["simulated_priority_score"] = df.apply(
        lambda row: calculate_policy_priority_score(
            income_score=row["income_score"],
            merit_score=row["merit_score"],
            policy_score=row["policy_score"],
            weights=custom_weights,
        ),
        axis=1,
    )

    # Sort by simulated priority score (highest first)
    df_sorted = df.sort_values("simulated_priority_score", ascending=False)

    # Prepare ranked applicants for allocation
    ranked_applicants = df_sorted[[
        "application_id", "applicant_name", "simulated_priority_score",
        "gender", "caste_category"
    ]].to_dict("records")

    # Rename column for allocation function
    for applicant in ranked_applicants:
        applicant["priority_score"] = applicant.pop("simulated_priority_score")

    # Run budget allocation (selectable engine)
    if request.allocation_engine == "knapsack" and request.use_budget:
        allocation_result = allocate_funds_knapsack(
            ranked_applicants=ranked_applicants,
            total_budget=request.total_budget,
            tuition_amount=request.base_tuition,
        )
    else:
        allocation_result = allocate_funds(
            ranked_applicants=ranked_applicants,
            total_budget=request.total_budget,
            tuition_amount=request.base_tuition,
            use_budget=request.use_budget,
        )

    # Calculate impact metrics
    allocations = allocation_result["allocations"]
    funded_students = [a for a in allocations if a["granted_aid"] > 0]
    budget_utilized = allocation_result["budget_summary"]["total_allocated"]

    # Tier breakdown (using allocation status and aid percentage)
    tier_1_count = sum(1 for a in allocations if a["aid_percentage"] >= 90)
    tier_2_count = sum(1 for a in allocations if 50 <= a["aid_percentage"] < 90)

    # Demographic impact analysis
    funded_df = df_sorted[df_sorted["application_id"].isin(
        [a["application_id"] for a in funded_students]
    )]

    demographic_impact = {}

    if not funded_df.empty:
        # Gender breakdown
        gender_counts = funded_df["gender"].value_counts()
        total_funded = len(funded_df)

        for gender in ["Male", "Female", "Other"]:
            count = gender_counts.get(gender, 0)
            demographic_impact[f"{gender.lower()}_pct"] = round((count / total_funded) * 100, 2) if total_funded > 0 else 0

        # Caste breakdown (General vs Reserved)
        reserved_categories = {"OBC", "SC", "ST"}
        general_count = sum(1 for c in funded_df["caste_category"] if c == "General")
        reserved_count = sum(1 for c in funded_df["caste_category"] if c in reserved_categories)

        demographic_impact["general_pct"] = round((general_count / total_funded) * 100, 2) if total_funded > 0 else 0
        demographic_impact["reserved_pct"] = round((reserved_count / total_funded) * 100, 2) if total_funded > 0 else 0

        # Detailed caste breakdown
        caste_counts = funded_df["caste_category"].value_counts()
        for caste in ["General", "OBC", "SC", "ST"]:
            count = caste_counts.get(caste, 0)
            demographic_impact[f"{caste.lower()}_pct"] = round((count / total_funded) * 100, 2) if total_funded > 0 else 0

    return {
        "simulation_parameters": {
            "total_budget": request.total_budget,
            "merit_weight": request.merit_weight,
            "income_weight": request.income_weight,
            "policy_weight": request.policy_weight,
            "base_tuition": request.base_tuition,
        },
        "impact_summary": {
            "budget_utilized": round(budget_utilized, 2),
            "students_funded": len(funded_students),
            "tier_breakdown": {
                "tier_1_full_aid": tier_1_count,
                "tier_2_partial_aid": tier_2_count,
            },
            "demographic_impact": demographic_impact,
        },
        "budget_summary": allocation_result["budget_summary"],
        "allocation_summary": allocation_result["allocation_summary"],
        "fairness_audit": allocation_result["fairness_audit"],
        "top_allocations": allocations[:20],  # Return top 20 for preview
        "total_applicants": len(df),
        "message": f"Policy simulation complete. Funded {len(funded_students)} students with ₹{budget_utilized:,.2f}.",
    }


@app.get("/api/databases/generated")
def list_generated_applications(
    q: str = Query("", description="Search by roll number or applicant name"),
    page: int = Query(1, ge=1, description="1-based page number"),
    page_size: int = Query(10, ge=1, le=100, description="Number of rows per page"),
):
    """Return generated application rows for the Applicant Database page."""
    items, total = fetch_database_rows(
        table_name="generated_applications",
        search=q,
        page=page,
        page_size=page_size,
    )
    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": max(1, int(np.ceil(total / page_size))) if total else 1,
    }


@app.get("/api/databases/decision-center")
def list_decision_center_records(
    q: str = Query("", description="Search by roll number or applicant name"),
    page: int = Query(1, ge=1, description="1-based page number"),
    page_size: int = Query(10, ge=1, le=100, description="Number of rows per page"),
):
    """Return Decision Center-scored candidate records."""
    items, total = fetch_database_rows(
        table_name="decision_center_applications",
        search=q,
        page=page,
        page_size=page_size,
    )
    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": max(1, int(np.ceil(total / page_size))) if total else 1,
    }


@app.get("/api/databases/overrides")
def list_override_records(
    q: str = Query("", description="Search by roll number or applicant name"),
    page: int = Query(1, ge=1, description="1-based page number"),
    page_size: int = Query(10, ge=1, le=100, description="Number of rows per page"),
):
    """Return override audit records with reason and acting user."""
    items, total = fetch_database_rows(
        table_name="override_audit",
        search=q,
        page=page,
        page_size=page_size,
    )
    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": max(1, int(np.ceil(total / page_size))) if total else 1,
    }


@app.get("/api/databases/generated/export")
def export_generated_applications(q: str = Query("", description="Search by roll number or applicant name")):
    """Export generated application records as CSV."""
    items, _ = fetch_database_rows(table_name="generated_applications", search=q, export_all=True)
    rows = [
        [
            row["application_id"],
            row["applicant_name"],
            row["caste_category"],
            row["family_income"],
            row["twelfth_percentage"],
            row["mh_cet_percentile"],
            row["jee_percentile"],
            row["predicted_priority_score"],
            row["tier"],
            row["created_at"],
        ]
        for row in items
    ]
    return write_csv_response(
        "generated_applications.csv",
        [
            "application_id",
            "applicant_name",
            "caste_category",
            "family_income",
            "twelfth_percentage",
            "mh_cet_percentile",
            "jee_percentile",
            "predicted_priority_score",
            "tier",
            "created_at",
        ],
        rows,
    )


@app.get("/api/databases/decision-center/export")
def export_decision_center_records(q: str = Query("", description="Search by roll number or applicant name")):
    """Export Decision Center records as CSV."""
    items, _ = fetch_database_rows(table_name="decision_center_applications", search=q, export_all=True)
    rows = [
        [
            row["application_id"],
            row["applicant_name"],
            row["ml_score"],
            row["final_score"],
            row["decision_tier"],
            row["is_overridden"],
            row["submitted_by"],
            row["created_at"],
        ]
        for row in items
    ]
    return write_csv_response(
        "decision_center_records.csv",
        [
            "application_id",
            "applicant_name",
            "ml_score",
            "final_score",
            "decision_tier",
            "is_overridden",
            "submitted_by",
            "created_at",
        ],
        rows,
    )


@app.get("/api/databases/overrides/export")
def export_override_records(q: str = Query("", description="Search by roll number or applicant name")):
    """Export override audit records as CSV."""
    items, _ = fetch_database_rows(table_name="override_audit", search=q, export_all=True)
    rows = [
        [
            row["decision_application_id"],
            row["applicant_name"],
            row["ml_score"],
            row["override_score"],
            row["final_tier"],
            row["override_reason"],
            row["override_user"],
            row["created_at"],
        ]
        for row in items
    ]
    return write_csv_response(
        "override_audit.csv",
        [
            "decision_application_id",
            "applicant_name",
            "ml_score",
            "override_score",
            "final_tier",
            "override_reason",
            "override_user",
            "created_at",
        ],
        rows,
    )


def fetch_fairness_source_rows() -> pd.DataFrame:
    """Load the columns needed to compute live fairness metrics."""
    query = """
        SELECT
            application_id,
            applicant_name,
            caste_category,
            gender,
            family_income,
            predicted_priority_score,
            created_at
        FROM applicants
        WHERE predicted_priority_score IS NOT NULL
    """

    try:
        with get_db_connection() as conn:
            return pd.read_sql_query(query, conn)
    except sqlite3.Error as exc:
        raise HTTPException(status_code=500, detail=f"Fairness query failed: {exc}") from exc


def classify_metric_status(value: float, good_threshold: float, warning_threshold: float) -> tuple[str, str]:
    """Map a numeric fairness metric to a UI status string and color."""
    if value >= good_threshold:
        return "Within Limit", "green"
    if value >= warning_threshold:
        return "Borderline", "amber"
    return "Requires Review", "red"


def build_fairness_flags(df: pd.DataFrame) -> list[dict]:
    """Generate lightweight review flags from live applicant records."""
    flagged_rows = []

    for _, row in df.iterrows():
        score = float(row["predicted_priority_score"])
        income = float(row["family_income"])
        caste = row["caste_category"]

        issue = None
        severity = None
        confidence = None

        if income <= 250000 and score < 55:
            issue = "Low-income applicant scored below expected support range"
            severity = "High"
            confidence = "82%"
        elif caste in {"SC", "ST"} and score < 60:
            issue = "Reserved-category applicant scored below monitoring threshold"
            severity = "Medium"
            confidence = "68%"
        elif abs(score - 70) <= 3 or abs(score - 90) <= 3:
            issue = "Borderline tier classification near allocation threshold"
            severity = "Low"
            confidence = "61%"
        elif income >= 1500000 and score > 90:
            issue = "High-income applicant received top-tier score; review merit-policy balance"
            severity = "Medium"
            confidence = "58%"

        if issue:
            flagged_rows.append(
                {
                    "id": row["application_id"],
                    "name": row["applicant_name"],
                    "issue": issue,
                    "confidence": confidence,
                    "severity": severity,
                    "created_at": row["created_at"],
                }
            )

    severity_order = {"High": 0, "Medium": 1, "Low": 2}
    flagged_rows.sort(key=lambda item: (severity_order[item["severity"]], item["created_at"]), reverse=False)
    return flagged_rows[:8]


@app.get("/api/fairness-audit")
def fairness_audit():
    """Compute fairness KPIs, parity chart data, and recent review flags from live records."""
    df = fetch_fairness_source_rows()
    if df.empty:
        return {
            "kpis": [],
            "parity_data": [],
            "recent_flags": [],
            "summary": {
                "approval_threshold": 70,
                "total_scored_applicants": 0,
            },
        }

    approval_threshold = 70
    df["approved"] = df["predicted_priority_score"] >= approval_threshold

    caste_rates = df.groupby("caste_category")["approved"].mean()
    gender_rates = df.groupby("gender")["approved"].mean()

    caste_parity = float(caste_rates.min() / caste_rates.max()) if caste_rates.max() > 0 else 0.0
    gender_disparate_impact = float(gender_rates.min() / gender_rates.max()) if gender_rates.max() > 0 else 0.0

    parity_status, parity_color = classify_metric_status(caste_parity, 0.9, 0.8)
    impact_status, impact_color = classify_metric_status(gender_disparate_impact, 0.9, 0.8)

    grouped_scores = (
        df[df["gender"].isin(["Male", "Female"])]
        .groupby(["caste_category", "gender"])["predicted_priority_score"]
        .mean()
        .unstack(fill_value=np.nan)
    )

    ordered_categories = ["General", "OBC", "SC", "ST"]
    parity_data = []
    for category in ordered_categories:
        category_scores = grouped_scores.loc[category] if category in grouped_scores.index else {}
        parity_data.append(
            {
                "category": category,
                "maleScore": round(float(category_scores.get("Male", np.nan)), 1) if pd.notna(category_scores.get("Male", np.nan)) else 0,
                "femaleScore": round(float(category_scores.get("Female", np.nan)), 1) if pd.notna(category_scores.get("Female", np.nan)) else 0,
            }
        )

    recent_flags = build_fairness_flags(df)
    flag_status, flag_color = classify_metric_status(float(max(0, 1 - (len(recent_flags) / max(len(df), 1)) * 10)), 0.95, 0.85)

    kpis = [
        {
            "label": "Demographic Parity",
            "value": f"{caste_parity:.2f}",
            "status": parity_status,
            "statusColor": parity_color,
            "icon": "scale",
        },
        {
            "label": "Disparate Impact Score",
            "value": f"{gender_disparate_impact:.2f}",
            "status": impact_status,
            "statusColor": impact_color,
            "icon": "shield",
        },
        {
            "label": "Flagged Decisions",
            "value": str(len(recent_flags)),
            "status": flag_status if recent_flags else "Within Limit",
            "statusColor": flag_color if recent_flags else "green",
            "icon": "alert",
        },
    ]

    return {
        "kpis": kpis,
        "parity_data": parity_data,
        "recent_flags": recent_flags,
        "summary": {
            "approval_threshold": approval_threshold,
            "total_scored_applicants": int(len(df)),
        },
    }


@app.get("/api/fairness-audit/export")
def export_fairness_audit():
    """Export the current fairness review flags as CSV."""
    df = fetch_fairness_source_rows()
    flags = build_fairness_flags(df) if not df.empty else []
    rows = [[row["id"], row["name"], row["issue"], row["confidence"], row["severity"], row["created_at"]] for row in flags]
    return write_csv_response(
        "fairness_audit_flags.csv",
        ["application_id", "applicant_name", "issue", "confidence", "severity", "created_at"],
        rows,
    )


def format_duration(seconds: float) -> str:
    """Format a duration in a compact UI-friendly way."""
    if seconds < 1:
        return f"{seconds * 1000:.0f} ms"
    return f"{seconds:.2f} s"


def format_artifact_time(path: str) -> str:
    """Return the artifact modification timestamp in ISO-like local format."""
    if not os.path.exists(path):
        return "Unavailable"
    return time.strftime("%Y-%m-%d %H:%M:%S", time.localtime(os.path.getmtime(path)))


def infer_model_name(regressor) -> str:
    """Convert a regressor instance into a human-friendly label."""
    name_map = {
        "RandomForestRegressor": "Random Forest",
        "XGBRegressor": "XGBoost",
        "LGBMRegressor": "LightGBM",
    }
    return name_map.get(regressor.__class__.__name__, regressor.__class__.__name__)


def build_live_mlops_snapshot() -> dict:
    """Build a real MLOps snapshot from saved model artifacts and benchmark evaluation."""
    global pipeline

    if pipeline is None:
        raise HTTPException(status_code=503, detail="Model not loaded yet.")

    models_dir = os.path.join(BASE_DIR, "models")
    required_files = [
        os.path.join(models_dir, "X_train.npy"),
        os.path.join(models_dir, "X_test.npy"),
        os.path.join(models_dir, "y_train.npy"),
        os.path.join(models_dir, "y_test.npy"),
        MODEL_PATH,
        os.path.join(models_dir, "preprocessor.pkl"),
        os.path.join(models_dir, "shap_explainer.pkl"),
    ]

    missing = [path for path in required_files if not os.path.exists(path)]
    if missing:
        raise HTTPException(status_code=500, detail=f"Missing MLOps artifact(s): {missing}")

    x_train = np.load(os.path.join(models_dir, "X_train.npy"))
    x_test = np.load(os.path.join(models_dir, "X_test.npy"))
    y_train = np.load(os.path.join(models_dir, "y_train.npy"))
    y_test = np.load(os.path.join(models_dir, "y_test.npy"))

    production_regressor = pipeline.named_steps["regressor"]
    production_name = infer_model_name(production_regressor)

    benchmark_specs = [
        ("rf-v1", RandomForestRegressor(n_estimators=200, random_state=42), "Baseline Candidate", "#8b8fa3"),
        ("xgb-v1", XGBRegressor(n_estimators=200, learning_rate=0.1, max_depth=5, random_state=42), "Boosted Tree Candidate", "#22c55e"),
        ("lgbm-v1", LGBMRegressor(n_estimators=200, learning_rate=0.1, max_depth=5, random_state=42, verbose=-1), "Experimental Candidate", "#3b82f6"),
    ]

    model_rows = []
    current_snapshot = []

    for model_id, model, model_type, color in benchmark_specs:
        train_started = time.perf_counter()
        model.fit(x_train, y_train)
        train_duration = time.perf_counter() - train_started

        predict_started = time.perf_counter()
        predictions = model.predict(x_test)
        inference_duration = (time.perf_counter() - predict_started) / max(len(x_test), 1)

        r2_value = float(r2_score(y_test, predictions))
        mae_value = float(mean_absolute_error(y_test, predictions))

        friendly_name = infer_model_name(model)
        is_active = friendly_name == production_name

        model_rows.append(
            {
                "id": model_id,
                "name": friendly_name,
                "version": "live-eval",
                "type": "Production Champion" if is_active else model_type,
                "r2": round(r2_value, 4),
                "mae": round(mae_value, 4),
                "trainTime": format_duration(train_duration),
                "infTime": format_duration(inference_duration),
                "status": "Active" if is_active else "Ready",
                "color": color,
            }
        )

        current_snapshot.append({"model": friendly_name, "r2": round(r2_value, 4), "mae": round(mae_value, 4)})

    active_model = next((row for row in model_rows if row["status"] == "Active"), model_rows[0])

    sample_count = min(len(x_test), 100)
    production_predict_started = time.perf_counter()
    production_regressor.predict(x_test[:sample_count])
    production_predict_duration = (time.perf_counter() - production_predict_started) / max(sample_count, 1)

    return {
        "active_model": {
            "name": active_model["name"],
            "version": "production",
            "deployed_at": format_artifact_time(MODEL_PATH),
            "r2": active_model["r2"],
            "mae": active_model["mae"],
            "next_retrain": "Manual trigger required",
            "inference_latency": format_duration(production_predict_duration),
        },
        "evaluation_snapshot": current_snapshot,
        "models": model_rows,
        "artifacts": [
            {
                "name": "scholarship_model.pkl",
                "size_kb": round(os.path.getsize(MODEL_PATH) / 1024, 1),
                "updated_at": format_artifact_time(MODEL_PATH),
            },
            {
                "name": "preprocessor.pkl",
                "size_kb": round(os.path.getsize(os.path.join(models_dir, "preprocessor.pkl")) / 1024, 1),
                "updated_at": format_artifact_time(os.path.join(models_dir, "preprocessor.pkl")),
            },
            {
                "name": "shap_explainer.pkl",
                "size_kb": round(os.path.getsize(os.path.join(models_dir, "shap_explainer.pkl")) / 1024, 1),
                "updated_at": format_artifact_time(os.path.join(models_dir, "shap_explainer.pkl")),
            },
        ],
        "dataset": {
            "x_train_shape": list(x_train.shape),
            "x_test_shape": list(x_test.shape),
            "y_train_count": int(len(y_train)),
            "y_test_count": int(len(y_test)),
        },
    }


@app.get("/api/mlops/summary")
def mlops_summary(refresh: bool = Query(False, description="Recompute benchmark results instead of using cache")):
    """Return live model registry and artifact metadata for the MLOps dashboard."""
    global mlops_cache

    if mlops_cache is None or refresh:
        mlops_cache = build_live_mlops_snapshot()

    return mlops_cache


@app.get("/api/health")
def health():
    """Quick health check - confirms the API and model are operational."""
    return {
        "status": "ok",
        "model_loaded": pipeline is not None,
    }
