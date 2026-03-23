# Project Tejas — Intelligent Scholarship Allocator

![Python](https://img.shields.io/badge/Python-3.10%2B-blue)
![Frontend](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-blue)
![Backend](https://img.shields.io/badge/Backend-FastAPI-fastapi)
![Scikit-Learn](https://img.shields.io/badge/ML-XGBoost%20%7C%20RandomForest-orange)
![SHAP](https://img.shields.io/badge/Explainability-SHAP-blueviolet)
![SQLite](https://img.shields.io/badge/Database-SQLite-lightgrey)
![License](https://img.shields.io/badge/License-MIT-green)

> **An ML-powered decision support system designed to automate, standardize, and de-bias university financial aid allocation.**

> ⚠️ **Note: This is currently a Beta testing version.**

---

## Table of Contents
- [What's New in v2026.1](#whats-new-in-v20261)
- [Problem Statement](#-problem-statement)
- [The Solution](#-the-solution)
- [Key Features](#-key-features)
- [Scholarship Criteria & Scoring Logic (v2026.1)](#scholarship-criteria--scoring-logic-v20261)
- [Tech Stack](#-tech-stack)
- [Project Architecture](#-project-architecture)
- [Installation & Usage](#-installation--usage)
- [Model Performance](#-model-performance)
- [Project Timeline](#project-timeline--retraining-schedule)
- [📋 Detailed Policy Documentation](#-detailed-policy-documentation)

---

## What's New in v2026.1

🚀 **Major Feature Release**: The Tejas Scholarship Allocator now includes advanced policy engine improvements:

| Feature | Description |
|---------|-------------|
| **🔀 Track-Aware Eligibility** | Different admission rules for Need-Based (≤₹25L income) vs Merit-Based (≥70% 12th, entrance exam needed) |
| **🎯 Competitive Exam Integration** | Include JEE/NEET/Other exam percentiles in merit scoring; boost 5-exam average |
| **✅ Strict Input Validation** | Browser-level bounds checking (0-100%) + backend Pydantic validators; red outline for invalid inputs |
| **🛡️ Fairness Audit Monitoring** | Automated selection rate tracking by gender & caste; alerts if < 30% overall or disproportionate distribution |
| **💰 Budget Allocation Modes** | Toggle between Strict Budget (allocate top students first) vs Relative Ranking (top 10% = Tier 1) |
| **⚖️ Policy Bonuses Capped** | Maximum 20 policy points (prevents stacking/gaming; ensures merit/income matter most) |
| **📝 Enhanced Audit Trail** | All admin overrides logged with timestamps, reasons, and audit compliance |

**👉 For complete policy details**, see **[POLICY_AND_RULES_ENGINE.md](POLICY_AND_RULES_ENGINE.md)**

---

## What's New in v2026.2 (ML Architecture Upgrade)

🧠 **Focus**: Transforming Tejas from a score-prediction engine into a true ML-driven governance system.

| Feature | Description |
|---------|-------------|
| **🧬 Behavioral Cloning** | Retraining pipeline now up-weights records where admins overrode ML scores (3× weight), teaching the model to learn from human expert decisions |
| **🔬 K-Means Applicant Personas** | Unsupervised K-Means clustering (k=4) assigns each applicant a human-readable persona (e.g., "Merit Elite", "High Need, Strong Academics", "Borderline Candidate") |
| **⚡ Knapsack Optimization Allocator** | Operations Research-based fractional knapsack algorithm maximizes total cohort impact `SUM(Score × Funding)` subject to budget constraints |
| **🎛️ Allocation Engine Toggle** | Command Center now lets admins switch between Greedy (top-down) and Knapsack (optimization) allocation engines in real-time |
| **🧬 ML Persona Card (UI)** | Decision Center displays the K-Means cluster persona for each analyzed applicant with cluster ID |

**Key ML Artifacts Added**: `kmeans_model.pkl`, dynamic persona labeling, silhouette score validation

---

## Problem Statement
Universities face a "Trilemma of Allocation" when distributing limited scholarship funds:
1.  **Volume vs. Velocity:** Manually reviewing thousands of financial documents creates bottlenecks.
2.  **Complexity:** Balancing **Financial Need**, **Academic Merit**, and **Social Policy** (Reservations/Domicile) is mathematically complex for human reviewers.
3.  **Bias:** Different reviewers may weigh criteria differently, leading to inconsistent and unfair outcomes.

## The Solution
The **Intelligent Scholarship Allocator** is a Machine Learning pipeline that:
1.  **Synthesizes** applicant data (Income, Caste, Grades, Entrance Scores).
2.  **Predicts** a standardized **Priority Score (0-100)** using a trained Ridge Regression model.
3.  **Visualizes** the decision logic via an interactive Dashboard for admissions officers.

---

## Scholarship Criteria & Scoring Logic (v2026.1)

The **Intelligent Scholarship Allocator** uses a fairness-first, transparent scoring methodology designed to balance **Financial Need (40%)**, **Academic Merit (40%)**, and **Policy Bonuses (20%)** while adhering to government reservation mandates.

### 🎯 Key Changes in v2026.1

✅ **Track-Aware Eligibility**: Different admission rules for Need-Based vs Merit-Based scholarships  
✅ **Competitive Exam Integration**: Boost merit score by including JEE/NEET/Other competitive exam percentiles  
✅ **Strict Input Validation**: Browser-level validation (0-100 bounds) + backend Pydantic checks  
✅ **Fairness Audit**: Automated monitoring of selection rates by gender and caste category  
✅ **Budget Allocation Modes**: Strict budget constraint OR relative ranking mode  
✅ **Policy Bonuses Capped**: Maximum 20 points to prevent gaming  

---

### 1. Hard Eligibility Filters

**Before scoring begins**, applicants must pass these mandatory gates or become **Tier 4: Ineligible**.

#### Universal (All Tracks)
- **12th Grade Percentage** ≥ 60%

#### Need-Based Track
- 12th Grade Percentage ≥ 60%
- **Family Annual Income** ≤ ₹25,00,000
- (Income shows genuine financial need)

#### Merit-Based Track  
- **12th Grade Percentage** ≥ 70% (higher bar)
- **At least one entrance exam** ≥ 50th percentile:
  - JEE Mains ≥ 50th percentile, OR
  - NEET ≥ 50th percentile, OR
  - MH-CET ≥ 60th percentile

---

### 2. Three-Component Scoring

#### A. Merit Component (40%)
Measures academic excellence using a sigmoid curve.

**Calculation**:
- Average of **4 core exams**: 12th %, MH-CET %, JEE %, University Test Score
- **If student took competitive exam** (JEE/NEET/Other): Include it as 5th exam (average of 5)
- Normalize via sigmoid: converts 0-100 raw merit into 0-100 points

**Example**:
- Student with 75% avg (12th=75, CET=74, JEE=76, Uni=75) → **~73 merit points**
- Student with 85% avg (12th=86, CET=85, JEE=86, Uni=84) → **~81 merit points**

#### B. Financial Need Component (40%)
Prioritizes lower-income families using logarithmic decay.

**Calculation**:
$$\text{Income Score} = \frac{\log(₹20L / \text{Family Income})}{\log(100)} \times 100$$

**Why Logarithmic?** A ₹1L increase matters more for poor families (₹2L → ₹3L) than rich ones (₹25L → ₹26L).

**Income-to-Score Mapping**:
| Family Income | Income Score |
|---------------|--------------|
| ₹1,00,000 | ~95 pts |
| ₹3,00,000 | ~85 pts |
| ₹5,00,000 | ~75 pts |
| ₹10,00,000 | ~60 pts |
| ₹20,00,000 | ~0 pts |

#### C. Policy Bonus Component (20%)
Implements government mandates and diversity goals.

**Bonuses Awarded**:

| Criterion | Category | Bonus |
|-----------|----------|-------|
| **Caste** | General | +0 |
| | OBC | +5 |
| | SC | +10 |
| | ST | +15 |
| **Domicile** | Maharashtra | +5 |
| **Gender** | Female / Other | +5 |
| | Male | +0 |
| **Disability (PwD)** | Yes | +10 |
| **Extracurricular** | Score 9-10 | +10 |
| | Score 7-8 | +5 |
| | Score 5-6 | +2 |
| | Score 0-4 | +0 |

**⚠️ Cap**: Policy score capped at **20 points max** (prevents any single applicant from stacking bonuses too high).

---

### 3. Final Priority Score & Tier Assignment

$$\text{Priority Score} = (0.4 \times \text{Merit}) + (0.4 \times \text{Income}) + (0.2 \times \text{Policy})$$

*Weights are configurable via Command Center for policy experiments.*

| Priority Score | Tier | Award | Example |
|---|---|---|---|
| **80-100** | **Tier 1** | **💚 100% Full Waiver** | Exceptional student + strong need OR exceptional merit |
| **50-79** | **Tier 2** | **💙 60% Partial Aid** | Good student + moderate need OR solid merit alone |
| **0-49** | **Tier 3** | **⚪ Waitlist / Appeal** | Borderline case; eligible for manual appeals |
| **Fails Hard Rules** | **Tier 4** | **❌ Ineligible** | 12th < 60% OR (Need-Based & income > ₹25L) |

---

### 4. Competitive Exam Integration

**New Feature**: Candidates can optionally report scores from JEE, NEET, or other competitive exams to **boost their merit score**.

**How It Works**:
1. Form toggle: "Did you take JEE/NEET/Other competitive exam?"
2. If **YES**: 
   - Provide exam type (JEE, NEET, Other)
   - Provide percentile score (0-100)
   - Score included in **5-exam average** instead of 4 (boosts raw merit)
3. If **NO**: 
   - Merit uses standard 4-exam average
   - No penalty; not discriminated against

**Impact Example**:
- Student A (no competitive exam): 12th=75, CET=74, JEE=75, Uni=76 → Raw merit 75% → Merit ≈ 73 pts
- Student B (with competitive exam score 85): 12th=75, CET=74, JEE=75, Uni=76, Other=85 → Raw merit 77% → Merit ≈ 75 pts (slight boost)

---

### 5. Track-Specific Weight Customization

The Command Center allows admins to adjust weights per track:

#### Need-Based (Default: 40% Merit, 40% Income, 20% Policy)
- Can increase income weight to 70% for extreme financial focus
- Can decrease merit weight to 20% if academic bar is relaxed

#### Merit-Based (Default: 40% Merit, 40% Income, 20% Policy)
- Can increase merit weight to 70% for academic excellence focus
- Can decrease income weight to 10% if income is less relevant
- No income cap (students can be wealthy and still eligible)

---

### 6. Fairness & Selection Rate Audit

After each simulation, the system monitors:

**Overall Selection Rate**:  How % of eligible applicants got Tier 1 or Tier 2?
- **Target**: ≥ 30% (at least 1 in 3 gets some aid)
- **Alert**: If < 30%, flagged as potentially unfair

**Gender Selection Rates**:  Are Male, Female, Other genders selected equally?
- **Example**: Female 45% selected vs Male 38% → 7-point gap (OK, below 15-pt threshold)

**Caste Selection Rates**: Are SC/ST, OBC, General selected proportionally?
- **Example**: SC 42% selected vs General 28% → SC selected at 1.5x rate (good equity)

Dashboard displays all metrics with green(✓) or amber (⚠️) status flags.

---

### 7. Input Validation & Guard Rails

**All numerical inputs are strictly validated** to prevent backend crashes:

| Field | Min | Max | Step | Validation |
|-------|-----|-----|------|------------|
| 10th, 12th Percentage | 0 | 100 | 0.1 | ✓ Real-time check, red border if invalid |
| MH-CET, JEE Percentile | 0 | 100 | 0.01 | ✓ Fine-grain precision |
| University Score | 0 | 100 | 1 | ✓ Integer only |
| Family Income | 0 | ∞ | 1000 | ✓ Increments by ₹1000 |
| Extracurricular Score | 0 | 10 | 1 | ✓ Integer 0-10 scale |

**Frontend Protection**:
- Red outline if value out of bounds
- Green checkmark (✓) if valid
- **"Analyze" button disabled** if any field invalid
- Tooltip guides user: "Please fix invalid inputs (shown in red)"

**Backend Protection**:
- Pydantic BaseModel with Field validators
- HTTP 422 error if invalid data sent
- Never crashes on malformed input

---

### 8. Budget Allocation Modes

#### Mode 1: Strict Budget Constraint (Default)
- Allocate funds to top-scoring students first
- Stop when budget exhausted
- Ensures no overspending
- Fair within ranking but may exclude some deserving lower-ranked applicants

#### Mode 2: Relative Ranking
- Ignore budget; top 10% get Tier 1, next 20% get Tier 2
- Transparent percentile-based assignment
- Best for what-if planning (assumes external multi-year funding)

Toggle between modes in Command Center → see impact on fairness metrics in real time.

---

### 9. Administrative Override & Appeals

**When Can Override Happen?**
- Tier 3 borderline case (score 0-49) files appeal
- Tier 4 ineligible student provides mitigating evidence (medical cert, hardship letter, etc.)

**Override Workflow**:
1. Admin reviews appeal in Decision Center
2. Checks "Override Tejas Recommendation?"
3. Inputs manual Priority Score (0-100)
4. Adds detailed reason
5. Clicks "Submit Final Decision"
6. Override logged with admin name, timestamp, reason (audit trail)

**Guard Rails**:
- Override reason is mandatory
- Can't jump Tier 4 → Tier 1 (max +30 point bump)
- All overrides recorded for compliance review

---

### 10. Transparency & Explainability

Every decision is auditable:
- **Score Breakdown**: Shows Merit pts + Income pts + Policy pts sum to final score
- **Radar Chart**: Compares applicant vs university average across 5 dimensions
- **SHAP Waterfall** (in detailed view): Feature-level attribution
- **Fairness Audit**: Gender & caste selection rates with alerts

---

### Example Scenarios

#### Scenario 1: Poorest + Brilliant Student
**Need-Based Track**:
- Income: ₹1,50,000 → Income Score ≈ 92 pts
- Merit: 78% avg → Merit Score ≈ 77 pts
- Caste: SC, Domicile: Yes → Policy ≈ 15 pts
- **Score = (0.4×77) + (0.4×92) + (0.2×15) = 30.8 + 36.8 + 3 = 70.6 → Tier 1** ✅

#### Scenario 2: Rich + Exceptional Intellect
**Merit-Based Track**:
- Income: ₹50,00,000 → Income Score ≈ 5 pts (irrelevant)
- Merit: 90% avg (took JEE Advanced: 92) → 5-exam avg 90.2% → Merit Score ≈ 86 pts
- Caste: General, Domicile: No → Policy ≈ 0 pts
- **Score = (0.4×86) + (0.4×5) + (0.2×0) = 34.4 + 2 + 0 = 36.4 → But wait! 12th=88%, passes Merit-Based filter!**
- **Score = (0.7×86) + (0.2×5) + (0.1×0) = 60.2 + 1 = 61.2 → Tier 1** ✅
  *(With Merit-focused weights 0.7-0.2-0.1)*

#### Scenario 3: Borderline Applicant
**Need-Based Track**:
- Income: ₹22,00,000 → Income Score ≈ 8 pts
- Merit: 62% avg → Merit Score ≈ 52 pts
- Caste: OBC, Extracurricular: 3 → Policy ≈ 5 pts
- **Score = (0.4×52) + (0.4×8) + (0.2×5) = 20.8 + 3.2 + 1 = 25 → Tier 3** ⚪ (Appeal eligible)

## Key Features

### 1. Instant Applicant Lookup
* Searchable dropdown of all applicants by **Name** or **Application ID**.
* Instantly retrieve their profile and predicted scholarship tier.
* Auto-fill form fields for quick re-scoring.

### 2. "What-If" Analysis (Manual Mode)
* Admins can manually input student details to test eligibility scenarios.
* Real-time score calculation based on University Policy logic.
* New applicants are automatically saved to the SQLite database.

### 3. SHAP Explainability
* Every prediction is accompanied by a **SHAP Waterfall Plot**.
* Decomposes the score into per-feature contributions (income impact, merit impact, etc.).
* Makes all allocation decisions fully transparent and auditable.

### 4. Batch Processing
* Drag-and-drop **CSV upload** to score hundreds of students at once.
* Plotly histogram visualization of score distributions.
* Downloadable results CSV with predicted Priority Scores.

### 5. Database Seeding & Persistence
* Synthetic data generator seeds **1,000 records directly into SQLite**.
* All dashboard interactions are persisted in `data/scholarship.db`.
* Full CRUD visibility via the Database Records tab.

### 6. Fairness-First Logic
* **Need-Based:** Higher priority for lower-income families (Log-normal distribution handling).
* **Merit-Based:** Weighted rewards for high JEE/CET/12th scores.
* **Policy-Based:** Auto-adjustment for Caste Categories and State Domicile.

---

## Tech Stack

| Component | Technology |
| :--- | :--- |
| **Language** | Python 3.10+, JavaScript/JSX |
| **Frontend** | React, Vite, Tailwind CSS, Recharts |
| **Backend API**| FastAPI, Uvicorn |
| **Machine Learning** | Scikit-Learn (RandomForest, Ridge, K-Means), XGBoost, LightGBM |
| **Explainability** | SHAP (SHapley Additive exPlanations) |
| **Optimization** | Operations Research (Fractional Knapsack Allocator) |
| **Database** | SQLite (WAL mode) |
| **Data Processing** | Pandas, NumPy, Joblib |
| **Visualization** | Matplotlib, Seaborn, Plotly |
| **Version Control** | Git & GitHub |

---

## Project Architecture

```text
Scholarship-Predictor-System/
│
├── app/
│   ├── app.py                    # Streamlit Dashboard (5 tabs)
│   └── Banner.jpg                # Dashboard header banner
│
├── data/
│   └── scholarship.db            # SQLite database (seeded by generator)
│
├── data_generation/
│   └── generator.py              # Synthesizes 1,000 records → CSV + DB
│
├── src/
│   ├── __init__.py               # Package marker
│   ├── data_pipeline.py          # Preprocessing: load, split, scale, encode
│   ├── db_setup.py               # SQLite schema & initialization
│   ├── model_trainer.py          # Train RF + XGBoost, save best pipeline
│   └── test_lightgbm.py          # LightGBM experimental benchmark
│
├── models/
│   ├── scholarship_model.pkl     # Trained Pipeline (preprocessor + model)
│   ├── kmeans_model.pkl          # K-Means Persona Clustering Model
│   ├── shap_explainer.pkl        # Pre-built SHAP TreeExplainer
│   ├── preprocessor.pkl          # Fitted ColumnTransformer
│   ├── X_train.npy / X_test.npy  # Processed feature arrays
│   └── y_train.npy / y_test.npy  # Target arrays
│
├── frontend/                     # Enterprise React App
│   ├── src/pages/                # Tejas UI Views (Decision Center, Admin, etc.)
│   └── package.json              # Frontend dependencies
│
├── backend/                      # FastAPI Backend Server
│   └── main.py                   # REST API exposing ML predict endpoint
│
├── notebooks/
│   ├── 1_preprocessing.ipynb     # EDA & cleaning exploration
│   ├── 2_eda.ipynb               # Exploratory Data Analysis
│   └── 3_model_training.ipynb    # Original model training notebook
│
├── Documentation/
│   └── requirements.txt          # Python dependencies
│
├── .gitignore                    # Excludes .csv, .pkl, .db, node_modules
└── README.md                     # This file
```

---

##  Installation & Usage

**Note:** Model artefacts (`.pkl`, `.npy`), datasets (`.csv`), and the database (`.db`) are **git-ignored**. You must generate them locally after cloning.

### 1. Clone the Repository

```bash
git clone https://github.com/rsp45/Scholarship-Predictor-System.git
cd Scholarship-Predictor-System
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Generate Data & Seed Database

Run the generator to create `raw_data.csv` **and** seed `data/scholarship.db` with 1,000 synthetic applicant records:

```bash
python data_generation/generator.py
```

### 4. Run the Data Pipeline

Preprocess features, fit the scaler/encoder, and save train/test arrays:

```bash
python -m src.data_pipeline
```

### 5. Train the Model

Train RandomForest + XGBoost, auto-select the best model, and generate the SHAP explainer:

```bash
python -m src.model_trainer
```

### 6. Launch Backend Server (FastAPI)

```bash
cd backend
python -m uvicorn main:app --reload --port 5000
```

### 7. Launch Frontend (React / Vite)

In a new terminal:
```bash
cd frontend
npm install
npm run dev
```

*The Tejas dashboard will open in your browser at `http://localhost:5173`.*

On this Windows setup, `npm run dev` now starts the backend with the local Python 3.12 interpreter that has FastAPI and Uvicorn installed, so the frontend proxy at `/api` can reach `http://localhost:5000`.

---

## Model Performance

We train **RandomForestRegressor** and **XGBRegressor** in parallel, then auto-select the winner based on R² and MAE on the held-out test set.

| Model | R² Score | MAE |
| :--- | :---: | :---: |
| RandomForest | ~0.95 | ~1.3 |
| XGBoost | ~0.96 | ~1.1 |
| LightGBM (experimental) | ~0.96 | ~1.1 |

The winning model is combined with the preprocessor into a single **Scikit-Learn Pipeline** and a **SHAP TreeExplainer** is saved alongside it for dashboard explainability.

---

## Project Timeline & Retraining Schedule

| Phase | Date Range | Tasks & Milestones | Retraining |
| :--- | :--- | :--- | :---: |
| **Phase 1:** Project Initiation & Base Setup | Feb 2 – Feb 13, 2026 | Requirement analysis, defining the applicant schema, and building the initial synthetic data generator (`generator.py`) to output raw CSVs. | - |
| Phase 1 Retraining | Feb 15, 2026 (Sun) | Train the initial Base ML Model on static synthetic data. | 🔄 Manual Base Training |
| **Phase 2:** Database Architecture & UI Setup | Feb 16 – Feb 24, 2026 | Initialize SQLite database (`scholarship.db`) and construct the basic Streamlit interface for viewing records. | - |
| Phase 2 Retraining | Feb 22, 2026 (Sun) | Model fine-tuning and initial integration tests with Streamlit. | 🔄 Manual Retraining |
| **Phase 3:** Data Seeding & Schema Mapping | Feb 25 – Feb 28, 2026 | Update `generator.py` to seed the SQLite database directly with 1,000 synthetic applicant records instead of just the CSV. Map Pandas DataFrame columns exactly to the SQLite schema. | - |
| Phase 3 Retraining | Mar 1, 2026 (Sun) | First Automated Pipeline Test: Train model on newly seeded database records. | ⚙️ Automated Retraining |
| **Phase 4:** Updation Pipeline Automation | Mar 2 – Mar 7, 2026 | Script the `data_pipeline.py` extraction process. Automate pulling fresh manual entries from SQLite to merge with `raw_data.csv`. Automate preprocessing. | - |
| Phase 4 Retraining | Mar 8, 2026 (Sun) | Weekly Model Retraining triggered via automated cron job/scheduler. | ⚙️ Automated Retraining |
| **Phase 5:** React Dashboard Integration | Mar 9 – Mar 14, 2026 | Build UI forms for manual applicant entry via FastAPI backend. Implement dynamic ML scoring visualizers in React. | - |
| Phase 5 Retraining | Mar 15, 2026 (Sun) | Weekly Model Retraining on dataset expanded by manual UI entries. | ⚙️ Automated Retraining |
| **Phase 6:** Optimization & Testing | Mar 16 – Mar 21, 2026 | End-to-end testing of the ingestion-to-prediction loop (React → FastAPI → ML Pipeline). Final UI/UX bug fixes. | - |
| Final Retraining | Mar 22, 2026 (Sun) | Final Pre-Submission Model Retraining for maximum accuracy. | ⚙️ Automated Retraining |
| **Phase 7:** Submission | Mar 23 – Mar 25, 2026 | Compile the final project report, detail the pipeline architecture, and prepare for the final Viva/Presentation. | 🏁 Complete |


---

> Built for the **Mid-Term Hackathon 2026**.

---

## 📋 Detailed Policy Documentation

For a **complete, in-depth policy specification**, see the dedicated policy document:

### **[POLICY_AND_RULES_ENGINE.md](POLICY_AND_RULES_ENGINE.md)**

This comprehensive document includes:

✅ **Core Principles** - Transparency, Fairness, Standardization, Auditability  
✅ **Hard Eligibility Filters** - Universal, Need-Based, and Merit-Based track rules  
✅ **Scoring Architecture** - Merit (40%), Income (40%), Policy Bonus (20%)  
✅ **Track-Specific Logic** - Need-Based vs Merit-Based weight customization  
✅ **Competitive Exam Integration** - JEE/NEET/Other inclusion in scoring  
✅ **Tier Classification** - Tier 1 (80-100), Tier 2 (50-79), Tier 3 (0-49), Tier 4 (Ineligible)  
✅ **Fairness & Audit Mechanisms** - Selection rate monitoring by gender & caste  
✅ **Input Validation Rules** - Strict bounds (0-100%) for all numerical fields  
✅ **Budget Allocation Modes** - Strict Budget vs Relative Ranking strategies  
✅ **Appeals & Override Process** - Admin workflow with audit logging  
✅ **Configuration & Customization** - Via YAML config or Command Center web UI  
✅ **Regulatory Compliance** - Indian Constitution, Supreme Court precedent, NITI Aayog alignment  
✅ **Version History** - From v1.0 (Jan 2026) to v2026.1 (Mar 19, 2026)  

---

### Configuration Files

- **[config/scholarship_rules.yaml](config/scholarship_rules.yaml)** - Rule engine configuration with all thresholds, bonuses, and weights

---

### Contact & Support

**Project Lead**: Tejas Development Team  
**Version**: 2026.1  
**Last Updated**: March 19, 2026  
**Status**: Production Ready ✅

---

*Questions or feedback? Refer to POLICY_AND_RULES_ENGINE.md for detailed specifications or contact the development team.*

