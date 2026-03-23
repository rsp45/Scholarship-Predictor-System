# FILE: src/policy_engine.py
# ===========================================================================
# Shared Policy Engine logic for Tejas.
# Used by both the Backend (live scoring) and Generator (synthetic data).
# ===========================================================================

import math
from typing import Optional

def calculate_income_score(current_income: float, rules: dict) -> float:
    """Calculate income-based score using logarithmic decay."""
    max_income = rules.get("income_reference_max", 2000000)
    if current_income <= 0:
        return 100.0

    ratio = max_income / current_income
    log_score = math.log(max(1.0, ratio))
    max_log = math.log(100) 
    normalized_score = (log_score / max_log) * 100

    return round(max(0.0, min(100.0, normalized_score)), 2)


def calculate_merit_score(raw_merit: float, rules: dict) -> float:
    """Calculate merit-based score using a sigmoid curve."""
    k = rules.get("merit_sigmoid_k", 0.1)
    midpoint = rules.get("merit_sigmoid_midpoint", 50)
    
    exponent = -k * (raw_merit - midpoint)
    sigmoid_score = 100 / (1 + math.exp(exponent))
    
    return round(max(0.0, min(100.0, sigmoid_score)), 2)


def calculate_policy_score(
    caste_category: str,
    domicile_maharashtra: int,
    gender: str,
    disability_status: str,
    extracurricular_score: float,
    gap_year: int,
    rules: dict
) -> float:
    """Calculate policy-based score using rule-based bonuses."""
    score = 0.0
    
    # Caste
    caste_bonuses = rules.get("caste_category_bonus", {})
    score += caste_bonuses.get(caste_category, 0)
    
    # Domicile
    if domicile_maharashtra == 1:
        score += rules.get("domicile_maharashtra_bonus", 5)
    
    # Gender
    gender_bonuses = rules.get("gender_bonus", {})
    score += gender_bonuses.get(gender, 0)
    
    # Disability
    if disability_status == "Yes":
        score += rules.get("pwd_bonus", 10)
    
    # Extracurricular (Banded)
    ec_bonuses = rules.get("extracurricular_bonus", {})
    if extracurricular_score >= 9:
        score += ec_bonuses.get("9-10", 10)
    elif extracurricular_score >= 7:
        score += ec_bonuses.get("7-8", 5)
    elif extracurricular_score >= 5:
        score += ec_bonuses.get("5-6", 2)
    else:
        score += ec_bonuses.get("0-4", 0)
    
    # Gap year penalty
    if gap_year > 0:
        score -= 5

    capped_score = min(rules.get("policy_score_max", 20.0), score)
    return round(max(0.0, capped_score), 2)
