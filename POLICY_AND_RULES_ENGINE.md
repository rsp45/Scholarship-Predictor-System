# Tejas Scholarship Allocator: Policy & Rules Engine (v2026.1)

**Document Version**: 2026.1  
**Last Updated**: March 19, 2026  
**Status**: Production  

---

## Executive Summary

The **Tejas Intelligent Scholarship Allocator** is a fairness-first, ML-powered decision support system that automates scholarship allocation while adhering to government policy mandates and institutional equity goals. This document defines the complete rules engine, eligibility criteria, scoring methodology, and allocation logic.

---

## Table of Contents

1. [Core Principles](#core-principles)
2. [Hard Eligibility Filters](#hard-eligibility-filters)
3. [Scoring Architecture](#scoring-architecture)
   - [Merit Component (40%)](#merit-component-40)
   - [Income Component (40%)](#income-component-40)
   - [Policy Bonus Component (20%)](#policy-bonus-component-20)
4. [Track-Specific Logic](#track-specific-logic)
5. [Competitive Exam Integration](#competitive-exam-integration)
6. [Tier Classification](#tier-classification)
7. [Fairness & Audit Mechanisms](#fairness--audit-mechanisms)
8. [Input Validation Rules](#input-validation-rules)
9. [Budget Allocation Modes](#budget-allocation-modes)
10. [Appeals & Override Process](#appeals--override-process)

---

## Core Principles

### 1. Transparency
- Every decision is explainable via score breakdown (Merit + Income + Policy contributions)
- Admins see exactly why a student landed in Tier 1 vs Tier 2
- SHAP waterfall plots available for deep-dive feature attribution

### 2. Fairness & Equity
- Dedicated fairness audit monitors selection rates by **Gender** and **Caste Category**
- Automated alerts flag disparity if selection rate < 30% overall
- Policy bonuses ensure affirmative action mandates are met

### 3. Standardization
- No manual subjective scoring—all criteria are quantifiable
- Weights are uniform (Merit 40%, Income 40%, Policy 20%) unless explicitly varied
- Dynamic weight adjustment available via Command Center for what-if analysis

### 4. Auditability
- All override decisions logged with admin name, timestamp, reason
- Selection rates tracked across demographics
- Decision records persist in SQLite for regulatory compliance

---

## Hard Eligibility Filters

**Before any scoring happens**, applicants must pass these mandatory gates. Failure results in **Tier 4: Ineligible**.

### Universal Criteria (All Tracks)

| Criterion | Threshold | Reason |
|-----------|-----------|--------|
| **12th Grade Percentage** | ≥ 60% | Baseline academic competency |
| **Valid Form Submission** | Required | Ensure data completeness |

### Need-Based Track Specific

| Criterion | Threshold | Reason |
|-----------|-----------|--------|
| **Family Annual Income** | ≤ ₹25,00,000 | Poverty line for "financial need" classification |
| **12th Grade Percentage** | ≥ 60% | (Same universal minimum) |

**Rationale**: Need-Based scholarships are explicitly for economically disadvantaged students. Income > ₹25L disqualifies them (assumed financial comfort).

### Merit-Based Track Specific

| Criterion | Threshold | Reason |
|-----------|-----------|--------|
| **12th Grade Percentage** | ≥ 70% | Higher academic bar for merit track |
| **Entrance Exam Eligibility** | (See below) | Must demonstrate competitive exam aptitude |

**Rationale**: Merit-Based scholarships prioritize academic excellence. A 70% cutoff ensures only top-performing students compete.

### Entrance Exam Requirements (Merit-Based)

Minimum **one** of the following must be satisfied:
- **JEE Mains Percentile** ≥ 50th percentile
- **NEET Percentile** ≥ 50th percentile  
- **MH-CET Percentile** ≥ 60th percentile

**Rationale**: Validates engineering/medical/general aptitude via standardized competitive exams.

---

## Scoring Architecture

Once an applicant passes hard eligibility filters, their **Priority Score (0-100)** is calculated as:

$$\text{Priority Score} = (w_{\text{Merit}} \times \text{Merit Score}) + (w_{\text{Income}} \times \text{Income Score}) + (w_{\text{Policy}} \times \text{Policy Score})$$

**Default Weights:**
- $w_{\text{Merit}} = 0.40$ (40%)
- $w_{\text{Income}} = 0.40$ (40%)  
- $w_{\text{Policy}} = 0.20$ (20%)

**Weights are configurable** via Command Center for policy experimentation.

---

### Merit Component (40%)

**Goal**: Reward academic excellence and intellectual capability.

#### Calculation

**Raw Merit** is the average of four academic percentiles (or five if competitive exam taken):

##### Standard Path (No Competitive Exam)
$$\text{Raw Merit} = \frac{\text{12th %} + \text{MH-CET %} + \text{JEE %} + \text{University Score}}{4}$$

##### Enhanced Path (With Competitive Exam)
$$\text{Raw Merit} = \frac{\text{12th %} + \text{MH-CET %} + \text{JEE %} + \text{University Score} + \text{Competitive Exam Score}}{5}$$

#### Sigmoid Normalization

Raw merit is then normalized to 0-100 scale using a **Sigmoid curve**:

$$\text{Merit Score} = \frac{100}{1 + e^{-k(\text{Raw Merit} - \text{midpoint})}}$$

Where:
- $k = 0.1$ (steepness of curve)
- $\text{midpoint} = 50$ (50th percentile raw merit = 50 points)

**Interpretation:**
- Student with 75% average raw merit ≈ 70-75 merit points
- Student with 55% average raw merit ≈ 50-55 merit points
- Student with 30% average raw merit ≈ 20-25 merit points

#### Competitive Exam Impact

- If `took_competitive_exam == true` and `competitive_exam_score` is populated:
  - Score is included in the 5-exam average (boosts raw merit)
  - Examples: JEE percentile 85, NEET percentile 75, Other exam score 80
- If `took_competitive_exam == false`:
  - Excluded from calculation; uses 4-exam average only
  - No penalty; student not discriminated against

---

### Income Component (40%)

**Goal**: Prioritize financially disadvantaged students (progressive redistribution).

#### Calculation

Income Score uses **logarithmic decay**:

$$\text{Income Score} = \frac{\log(\text{Max Income} / \text{Current Income})}{\log(\text{Max Income} / \text{Min Income})} \times 100$$

Where:
- $\text{Current Income}$ = Family annual income (₹)
- $\text{Max Income}$ = ₹20,00,000 (reference ceiling)
- $\text{Min Income}$ = ₹1 (floor for log safety)

#### Score Mapping

| Family Income | Income Score |
|---------------|--------------|
| ₹1,00,000 | ~95 points |
| ₹3,00,000 | ~85 points |
| ₹5,00,000 | ~75 points |
| ₹10,00,000 | ~60 points |
| ₹20,00,000 | ~0 points |

#### Why Logarithmic?

**Linear scaling would be unfair**:
- Student A: ₹3L vs ₹4L (₹1L difference) should have **bigger score gap**
- Student B: ₹25L vs ₹26L (₹1L difference) should have **smaller score gap**
- Log function captures this: relative increase matters more than absolute dollars

#### Track-Aware Application

- **Need-Based Track**: Always applies (applicant must be ≤ ₹25L anyway)
- **Merit-Based Track**: Still calculated, but applicants not filtered on income. Higher-income merit students can still get scholarships if academically strong.

---

### Policy Bonus Component (20%)

**Goal**: Implement government mandates (SC/ST/OBC reservations) and encourage diversity (gender, disability, extracurriculars).

#### Caste Category Bonuses

| Category | Bonus Points | Justification |
|----------|--------------|---------------|
| **General** | +0 | No bonus (baseline) |
| **OBC** | +5 | Other Backward Classes (Central & State list) |
| **SC** | +10 | Scheduled Caste (constitutional mandate) |
| **ST** | +15 | Scheduled Tribe (highest historical marginalization) |

**Rationale**: Follows Indian Constitution (Articles 15 & 16) and Supreme Court guidelines on affirmative action.

#### Domicile Bonus

| Category | Bonus Points | Justification |
|----------|--------------|---------------|
| **Maharashtra Domicile** | +5 | Prioritizes in-state students |
| **Non-Maharashtra** | +0 | No local priority |

**Rationale**: Universities prioritize local talent for community engagement.

#### Extracurricular Bonus

| Score (0-10 Scale) | Bonus Points |
|--------------------|--------------|
| 0-4 | +0 |
| 5-6 | +2 |
| 7-8 | +5 |
| 9-10 | +10 |

**Rationale**: Rewards well-rounded development (sports, arts, leadership, social work).

#### Gender Bonus

| Gender | Bonus Points | Justification |
|--------|--------------|---------------|
| **Female** | +5 | Promote gender diversity in STEM/higher education |
| **Male** | +0 | Baseline |
| **Other** | +5 | Inclusivity for non-binary applicants |

**Rationale**: Addresses historical underrepresentation of women & marginalized genders.

#### Disability Bonus

| Status | Bonus Points | Justification |
|--------|--------------|---------------|
| **PwD (Yes)** | +10 | Highest priority; accessibility-related expenses are real |
| **No PwD** | +0 | Baseline |

**Rationale**: Students with disabilities often face additional costs (adaptive tech, care).

#### Cap on Policy Bonuses

**Maximum policy score capped at 20 points** to prevent any single applicant from gaming the system.

Example: A female SC student with extracurricular score 9, domicile Maharashtra, and PwD status:
- Raw bonus: 5 (SC) + 5 (gender) + 10 (extracurricular) + 5 (domicile) + 10 (PwD) = 35 points
- **Actual policy score: 20 points (capped)**

---

## Track-Specific Logic

### Need-Based Track (Default: 70% Income Weight, 30% Merit Weight)

**Use Case**: Scholarship for economically disadvantaged students who demonstrate reasonable academic competency.

**Eligibility**:
1. 12th percentage ≥ 60%
2. Family income ≤ ₹25,00,000

**Weight Override** (configurable via Command Center):
- Income weight may be increased to 70-80%
- Merit weight decreased to 20-30%
- Policy weight fixed at 0-15%

**Example Applicant**:
- 12th: 72%, MH-CET: 65%, JEE: 58%, University: 60% → Raw merit = ~63% → Merit Score ≈ 62 pts
- Income: ₹4,50,000 → Income Score ≈ 72 pts
- Caste: OBC, Domicile: Yes, Extracurricular: 6 → Policy Score = 5 + 5 + 2 = 12 pts
- **With default track weights (I:0.7, M:0.3)**:
  - Priority = (0.7 × 72) + (0.3 × 62) = 50.4 + 18.6 = **69 points → Tier 1**

### Merit-Based Track (Default: 70% Merit Weight, 20% Income Weight)

**Use Case**: Scholarship for exceptionally talented students (engineering/medical aspirants).

**Eligibility**:
1. 12th percentage ≥ 70% (higher bar)
2. At least one entrance exam score ≥ 50th percentile (JEE ≥50 OR NEET ≥50 OR MH-CET ≥60)
3. No income cap

**Weight Override** (configurable):
- Merit weight may be 70-80%
- Income weight 10-20%
- Policy weight 5-15%

**Example Applicant**:
- 12th: 88%, MH-CET: 92%, JEE: 85%, University: 90%, Competitive Exam (JEE advanced equivalent): 78%
  - Raw merit = (88+92+85+90+78)/5 = 86.6% → Merit Score ≈ 83 pts
- Income: ₹35,00,000 (no filter) → Income Score ≈ 15 pts
- Caste: General, Domicile: No, Extracurricular: 4 → Policy Score = 0 pts
- **With default track weights (M:0.7, I:0.2, P:0.1)**:
  - Priority = (0.7 × 83) + (0.2 × 15) + (0.1 × 0) = 58.1 + 3 + 0 = **61.1 points → Tier 1**

---

## Competitive Exam Integration

### What's Included?

**Competitive Exams** = Standardized tests taken by applicants beyond regular coursework:
- JEE Mains / JEE Advanced
- NEET (National Eligibility cum Entrance Test)
- Other entrance exams (GMAT, CAT, State CET, etc.)

### How It Works

**Form Field**: `took_competitive_exam` (Boolean toggle)

**If YES**:
- `competitive_exam_type` (string: "JEE", "NEET", "Other")
- `competitive_exam_score` (float: 0-100, normalized percentile)
- Score is included in Merit calculation (5-exam average instead of 4)
- Student gets **slight boost** to merit score proportional to exam performance

**If NO**:
- Fields are ignored
- Merit calculation uses 4-exam average (12th, MH-CET, JEE, University)
- No penalty for not taking competitive exam
- Student still eligible for full Tier 1 if other scores are strong

### Example Impact

**Student A (No Competitive Exam)**:
- Exams: 12th=75%, MH-CET=74%, JEE=75%, University=76%
- Raw merit = (75+74+75+76)/4 = 75% → **Merit Score ≈ 73 pts**

**Student B (With Competitive Exam)**:
- Exams: 12th=75%, MH-CET=74%, JEE=75%, University=76%, Other Exam=75%
- Raw merit = (75+74+75+76+75)/5 = 75% → **Merit Score ≈ 73 pts (same)**

**Student C (With Higher Competitive Exam)**:
- Exams: 12th=75%, MH-CET=74%, JEE=75%, University=76%, JEE Advanced=88%
- Raw merit = (75+74+75+76+88)/5 = 77.6% → **Merit Score ≈ 75 pts (boost!)**

---

## Tier Classification

Once Priority Score is calculated, students are binned into tiers:

| Priority Score Range | Tier | Scholarship Award | Selection Criteria |
|---------------------|------|----------------|-------------------|
| **80-100** | Tier 1 | **100% Full Waiver** | Exceptional need + merit OR exceptional merit |
| **50-79** | Tier 2 | **60% Partial Aid** | Moderate need & merit OR good merit alone |
| **0-49** | Tier 3 | **No Aid / Waitlist** | Below threshold but near borderline; eligible for appeals |
| **Fails Eligibility** | Tier 4 | **Ineligible** | Hardcoded rules violated (income > ₹25L for Need-Based, or 12th < 60% for all) |

### Tier 1 Characteristics
- Nearly guaranteed scholarship (pending budget)
- High priority for fund allocation
- Minimal appeals burden

### Tier 2 Characteristics
- Receives aid if budget permits
- Subject to strict budget constraints (allocate top earners first)
- May be waitlisted if budget exhausted

### Tier 3 Characteristics
- Borderline cases (e.g., score = 48)
- Can file appeals with supporting documents
- Considered only if remaining funds available

### Tier 4 Characteristics
- No exceptions (hard rules violated)
- Best outcome: appeal to override committee for explicit waiver
- Example: Income exceeded limit by ₹1,00,000 but student has exceptional circumstances

---

## Fairness & Audit Mechanisms

### Selection Rate Monitoring

After each simulation run, the system calculates:

#### Overall Selection Rate
$$\text{Selection Rate} = \frac{\text{# Tier 1 + Tier 2 Students}}{\text{# Total Eligible Students}} \times 100\%$$

**Target**: ≥ 30% (at least 1 in 3 eligible students get some aid)  
**Alert**: If < 30%, flagged as potentially discriminatory

#### Gender Selection Rates
$$\text{Selection Rate}_{\text{Gender}} = \frac{\text{# Selected (Gender)}}{\text{# Applicants (Gender)}} \times 100\%$$

**Measures**:
- Female selection rate vs Male selection rate
- Other gender selection rate
- **Alert**: If any gender disparity > 15 percentage points

**Example**:
- Female: 45% selection rate
- Male: 38% selection rate
- Disparity: 7 points → OK (below 15pt threshold)

#### Caste-Based Selection Rates
$$\text{Selection Rate}_{\text{Caste}} = \frac{\text{# Selected (Caste)}}{\text{# Applicants (Caste)}} \times 100\%$$

**Measures**:
- General selection rate
- OBC selection rate
- SC selection rate
- ST selection rate

**Alert Criteria**:
- If SC/ST rate < 40% of General rate → likely systemic bias (SC/ST students historically marginalized; should get **higher** rate)
- Example: If General = 35%, SC should be ≥ 14% (proportional inclusion)

### Audit Report Output

After each /api/simulate run, the system outputs:

```json
{
  "fairness_audit": {
    "overall_selection_rate": 32.5,
    "gender_selection_rate": {
      "Male": 30.2,
      "Female": 35.1,
      "Other": 28.9
    },
    "caste_selection_rate": {
      "General": 28.5,
      "OBC": 36.2,
      "SC": 42.1,
      "ST": 48.5
    },
    "alerts": [
      "SC students selected at 2.1x rate of General (expected ~1.5x); monitor for over-weighting"
    ]
  }
}
```

---

## Input Validation Rules

To prevent corrupt data and backend crashes, all numerical inputs are strictly validated:

### Percentile / Percentage Fields
| Field | Min | Max | Step | Type |
|-------|-----|-----|------|------|
| 10th Percentage | 0 | 100 | 0.1 | Float |
| 12th Percentage | 0 | 100 | 0.1 | Float |
| MH-CET Percentile | 0 | 100 | 0.01 | Float |
| JEE Percentile | 0 | 100 | 0.01 | Float |
| University Test Score | 0 | 100 | 1.0 | Integer |
| Competitive Exam Score | 0 | 100 | 0.01 | Float |

### Financial Fields
| Field | Min | Max | Step | Type |
|-------|-----|-----|------|------|
| Annual Family Income | 0 | ∞ | 1000 | Integer (in ₹) |

### Activity Fields
| Field | Min | Max | Step | Type |
|-------|-----|-----|------|------|
| Extracurricular Score | 0 | 10 | 1.0 | Integer |

### Validation Enforcement

**Frontend (React)**:
- `input type="number"` with `min`, `max`, `step` attributes
- Real-time validation on onChange
- **Red border** if invalid
- **Analyze button disabled** if any field invalid
- Tooltip: "Please fix invalid inputs (shown in red)"

**Backend (FastAPI)**:
- Pydantic BaseModel with Field validators
- `ge=0, le=100` constraints on Percentage fields
- Reject requests with out-of-bounds values (HTTP 422 Unprocessable Entity)

**Example Error Response**:
```json
{
  "detail": [
    {
      "loc": ["body", "twelfth_percentage"],
      "msg": "ensure this value is less than or equal to 100",
      "type": "value_error.number.not_le"
    }
  ]
}
```

---

## Budget Allocation Modes

The Command Center offers two allocation strategies:

### Mode 1: Strict Budget Constraint (use_budget = true)

**Algorithm:**
1. Sort all eligible applicants by Priority Score (descending)
2. Allocate scholarships in rank order:
   - Tier 1 students first: deduct full scholarship amount from budget
   - Tier 2 students next: deduct 60% of full amount
   - Stop when budget exhausted
3. Remaining students get Tier 3 (waitlist) or Tier 4

**Characteristics**:
- Ensures hard budget cap (no overspending)
- Prioritizes highest-scoring students
- Fair within ranking but can exclude deserving lower-ranked applicants
- Best for limited budgets

**Example**:
- Budget: ₹50,00,000
- Avg Tier 1 award: ₹1,00,000 per student
- Can fund ~50 Tier 1 students; remaining get Tier 2/3

### Mode 2: Relative Ranking (use_budget = false)

**Algorithm:**
1. Calculate selection percentiles independent of budget
2. Top 10% → Tier 1
3. Next 20% (10-30%) → Tier 2
4. Remaining → Tier 3/4
5. Budget is ignored; all Tier 1 & Tier 2 students get their award (assume external funding or multi-year rollout)

**Characteristics**:
- Focuses on merit/fairness, not financial constraints
- Transparent: students know exactly where they rank
- Disconnects from real-world budget (use for planning only)
- Best for multi-year rollouts or grants-based scholarship

**Example**:
- 1,000 applicants; top 100 → Tier 1; next 200 → Tier 2
- Actual funding distributed via separate grant cycles

### Mode 3: Knapsack Optimization (allocation_engine = "knapsack") 🆕

**Algorithm (Operations Research - Fractional Knapsack):**
1. For each applicant, compute value density = Priority Score (impact per rupee)
2. Sort candidates by value density (descending)
3. Allocate to maximize `SUM(Priority Score × Granted Aid)` under budget constraint:
   - Score ≥ 75 → Tier 1 (100% tuition)
   - Score ≥ 50 → Tier 2 (60% tuition)
   - Score < 50 → Not Funded
4. If budget runs out mid-allocation, fractional allocation to the boundary student

**Objective Function:**
$$\text{Maximize } \sum_{i=1}^{n} (\text{Score}_i \times \text{Funding}_i) \quad \text{s.t. } \sum \text{Funding}_i \leq B$$

**Characteristics**:
- Optimizes total cohort impact (not just individual ranking)
- May prefer funding more students at Tier 2 over fewer at Tier 1
- Reports `total_weighted_impact` score for comparison
- Available via Command Center toggle

---

## Appeals & Override Process

### When Can An Applicant Appeal?

1. **Tier 3 Borderline Case** (Score 0-49): Can file appeal for reconsideration
2. **Tier 4 Ineligible** (Hard Rule Violated): Can appeal only with mitigating evidence

### Evidence Accepted

- Medical certificates (if disability not initially disclosed)
- Income certification if family circumstances changed
- Character references for hardship cases
- Transfer certificates for domicile questions

### Override Workflow

**Triggering Override**:
1. Admin reviews appeal in Decision Center
2. Checks "Override Tejas Recommendation?"
3. Inputs manual Priority Score (0-100)
4. Adds reason (e.g., "Medical emergency, exceptional circumstance")
5. Clicks "Submit Final Decision"

**Logging**:
```json
{
  "applicant_id": "APP_001234",
  "original_score": 48,
  "override_score": 62,
  "override_user": "Dr. Sarah Kumar",
  "override_reason": "Medical emergency; family's monthly expenses doubled due to ongoing treatment",
  "override_timestamp": "2026-03-19T14:32:15",
  "is_override": true
}
```

**Audit Trail**: All overrides recorded in `override_audit` table for compliance review.

### Override Guard Rails

- Override cannot create Tier 4 → Tier 1 jump (max +30 point bump)
- Override reason is **mandatory**
- Override applies only to current evaluation (doesn't cascade to other applicants)
- Admin name logged (accountability)

---

## Configuration & Customization

All policy parameters are configurable (with approvals):

### Via YAML Config (config/scholarship_rules.yaml)

- Caste bonuses
- Domicile bonuses
- Extracurricular thresholds
- PwD & gender bonuses
- Income threshold for Need-Based filter

### Via Command Center (Web UI)

- Merit weight (0.0-1.0)
- Income weight (0.0-1.0)
- Policy bonus weight (0.0-1.0)
- Total budget (₹)
- Allocation mode (Budget Constraint vs Relative Ranking)

### Via Backend (FastAPI)

- Track-specific weights (if needed)
- Eligibility thresholds
- Competitive exam inclusion/exclusion

---

## Regulatory Compliance

### Indian Constitution & Supreme Court Precedent

✅ **SC/ST Reservations**: Implemented via caste-based bonuses (Articles 15, 16)  
✅ **Gender Equity**: Female & Other gender bonuses address historical underrepresentation  
✅ **PwD Inclusion**: Disability bonus per Rights of Persons with Disabilities Act, 2016  
✅ **Transparency**: Every decision explainable via score breakdown

### NITI Aayog Guidelines

✅ **Merit Recognition**: 40% weight for academic excellence  
✅ **Financial Inclusion**: 40% weight for income-based need  
✅ **Fairness Monitoring**: Automated fairness audit per Selection Rate methodology

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Jan 2026 | Initial policy (3-tier, single-track) |
| 2.0 | Feb 2026 | Added track-aware logic, competitive exams, fairness audit |
| 2026.1 | Mar 19, 2026 | Input validation, Command Center modes, policy bonuses capped |
| **2026.2** | **Mar 23, 2026** | **(This Version)** Behavioral Cloning, K-Means Personas, Knapsack Optimization Allocator |

---

## Appendix: Scoring Formula Reference

$$\text{Priority Score} = (w_{\text{Merit}} \times \text{Merit Score}) + (w_{\text{Income}} \times \text{Income Score}) + (w_{\text{Policy}} \times \text{Policy Score})$$

Where:

$$\text{Merit Score} = \frac{100}{1 + e^{-0.1(\text{Raw Merit} - 50)}}$$

$$\text{Income Score} = \frac{\log(20,00,000 / \text{Income})}{\log(100)} \times 100$$

$$\text{Policy Score} = \min(20, \text{Caste Bonus} + \text{Domicile Bonus} + \text{Extracurricular Bonus} + \text{Gender Bonus} + \text{PwD Bonus})$$

---

**End of Policy & Rules Engine Documentation**
