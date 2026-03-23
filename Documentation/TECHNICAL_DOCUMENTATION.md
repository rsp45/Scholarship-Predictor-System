# Tejas Intelligent Scholarship Allocator

## Technical Documentation

**Prepared For:** STSE203 technical documentation submission  
**Project Version:** v2026.1 repository state  
**Prepared On:** March 19, 2026

---

## 1. Project Overview

Tejas is an end-to-end scholarship allocation platform designed to support university administrators in evaluating applicants using a combination of:

- rule-based policy scoring,
- machine learning model predictions,
- fairness monitoring,
- audit logging, and
- interactive administrative dashboards.

The system aims to make scholarship decisions faster, more transparent, and more consistent than manual review alone. It is built as a full-stack project with:

- a **FastAPI backend**,
- a **React + Vite frontend**,
- a **SQLite data store**,
- a **scikit-learn/XGBoost/LightGBM model evaluation workflow**, and
- supporting retraining and audit utilities.

At the product level, the system supports four major activities:

1. applicant scoring in the Decision Center,
2. policy simulation in the Command Center,
3. database and override review,
4. fairness and MLOps monitoring.

---

## 2. Problem Statement

Manual scholarship allocation creates several operational problems:

- high application volume,
- inconsistent decision quality across reviewers,
- difficulty balancing merit, need, and reservation policy,
- weak auditability of overrides,
- limited visibility into fairness across demographic groups.

Tejas addresses this by giving administrators a structured decision-support system that standardizes evaluation while still allowing supervised manual overrides and audit trails.

---

## 3. Objectives

The repository implements the following technical objectives:

- generate or store applicant datasets in a structured database,
- train a predictive model on historical/synthetic applicant data,
- compute policy-aware scholarship scores at runtime,
- expose prediction, simulation, fairness, and registry APIs,
- provide a dashboard-driven admin workflow,
- support retraining and model versioning,
- preserve override history for audit and compliance.

---

## 4. High-Level Architecture

### 4.1 Architecture Summary

The project follows a layered architecture:

1. **Data Layer**
   - SQLite database in `data/scholarship.db`
   - generated applicants, live decisions, override logs

2. **ML Layer**
   - preprocessing in `src/data_pipeline.py`
   - training and model selection in `src/model_trainer.py`
   - retraining automation in `retrain_pipeline.py`

3. **Policy Layer**
   - eligibility rules, income scoring, merit scoring, policy bonuses
   - implemented mainly in `backend/main.py`
   - configuration reference stored in `config/scholarship_rules.yaml`

4. **API Layer**
   - FastAPI app in `backend/main.py`
   - prediction, simulation, database export, fairness, health, MLOps endpoints

5. **Presentation Layer**
   - React dashboard in `frontend/src`
   - separate pages for decisioning, audits, database records, policy simulation, and model registry

### 4.2 Runtime Flow

Typical runtime flow for a single applicant:

1. Admin fills the Decision Center form.
2. Frontend sends applicant data to `POST /api/predict`.
3. Backend validates payload using Pydantic.
4. Hard eligibility checks are applied.
5. Policy-based component scores are computed.
6. The ML pipeline also produces a reference score.
7. Final score is determined from policy logic or admin override.
8. Record is saved to database tables.
9. UI displays the score, tier, and score breakdown.

---

## 5. Repository Structure

## 5.1 Root Folders and Files

| Path | Purpose |
|---|---|
| `backend/` | FastAPI backend and core API logic |
| `frontend/` | React + Vite dashboard |
| `src/` | data preprocessing, training, DB utilities, analysis scripts |
| `data/` | SQLite database and legacy proposal asset |
| `models/` | saved pipeline, explainer, arrays, metadata |
| `config/` | scholarship policy configuration YAML |
| `data_generation/` | synthetic data generation and DB seeding |
| `Documentation/` | proposal PDF and this technical documentation |
| `Tejas_v1/` | legacy Streamlit version of the product |
| `logs/` | retraining logs |
| `retrain_pipeline.py` | automated retraining workflow |
| `Setup-RetrainingTask.ps1` | Windows scheduled-task setup script |
| `README.md` | product overview and usage guide |
| `POLICY_AND_RULES_ENGINE.md` | detailed policy reference |

## 5.2 Important Code Ownership by Module

### Backend

- `backend/main.py`
  - policy engine functions
  - FastAPI app
  - request schemas
  - prediction logic
  - simulation logic
  - fairness API
  - MLOps summary API
  - CSV exports

### Machine Learning and Data

- `src/db_setup.py`
  - SQLite schema creation
- `src/data_pipeline.py`
  - feature preparation and preprocessing artifacts
- `src/model_trainer.py`
  - model training, selection, fairness audit, SHAP creation
- `retrain_pipeline.py`
  - retraining automation and model versioning
- `data_generation/generator.py`
  - synthetic dataset generation

### Frontend

- `frontend/src/App.jsx`
  - route wiring
- `frontend/src/pages/DecisionCenter.jsx`
  - applicant scoring workflow
- `frontend/src/pages/CommandCenter.jsx`
  - policy simulation dashboard
- `frontend/src/pages/ApplicantDatabase.jsx`
  - record browsing and CSV export
- `frontend/src/pages/FairnessAudit.jsx`
  - fairness dashboard
- `frontend/src/pages/MLOps.jsx`
  - model registry and artifact monitoring

---

## 6. Database Design

The project uses SQLite with Write-Ahead Logging enabled.

### 6.1 Tables

#### `applicants`

Stores historical/generated applicant data with predicted priority score. This is the main source used for training and fairness analysis.

#### `generated_applications`

Stores synthetic applications produced by the data generator for policy experiments and simulations.

#### `decision_center_applications`

Stores live scoring activity performed through the Decision Center UI, including:

- ML score,
- final score,
- decision tier,
- override flag,
- submitting user.

#### `override_audit`

Stores manual override details:

- decision application id,
- applicant name,
- original ML score,
- override score,
- final tier,
- override reason,
- override user,
- timestamp.

### 6.2 Shared Applicant Fields

Core applicant attributes include:

- applicant name and application id,
- family income,
- caste category,
- domicile status,
- MH-CET percentile,
- JEE percentile,
- university test score,
- 10th and 12th percentages,
- extracurricular score,
- gender,
- parent occupation,
- gap year,
- disability status,
- college branch.

---

## 7. Machine Learning Pipeline

## 7.1 Feature Engineering

`src/data_pipeline.py` prepares the dataset for model training.

### Numerical features

- `Family_Income`
- `Mh_CET_Percentile`
- `JEE_Percentile`
- `University_Test_Score`
- `12th_Percentage`
- `Extracurricular_Score`
- `10th_Percentage`
- `Gap_Year`

### Categorical features

- `Caste_Category`
- `Gender`
- `Parent_Occupation`
- `Disability_Status`
- `College_Branch`

### Binary passthrough feature

- `Domicile_Maharashtra`

### Transformations

- `StandardScaler` for numerical fields
- `OneHotEncoder(handle_unknown="ignore")` for categorical fields
- passthrough for domicile flag

Artifacts written to `models/`:

- `preprocessor.pkl`
- `X_train.npy`
- `X_test.npy`
- `y_train.npy`
- `y_test.npy`
- `X_test_raw.csv`

## 7.2 Model Training

`src/model_trainer.py` trains:

- `RandomForestRegressor`
- `XGBRegressor`

The best model is selected by higher **R^2** on the test set. The chosen model is wrapped with the preprocessor into a single sklearn `Pipeline` and saved as:

- `models/scholarship_model.pkl`

## 7.3 Explainability

SHAP is used for explainability. The repository creates:

- `models/shap_explainer.pkl`

This supports model interpretation and helps justify how features influenced predictions.

## 7.4 Current Saved Model Snapshot

From `models/model_metadata_v20260319.json`:

- **Model:** RandomForestRegressor
- **R^2 Score:** 0.6244
- **MAE:** 4.3808
- **Training Samples:** 1625
- **Training Date:** 2026-03-19T15:46:44

---

## 8. Policy Engine and Scoring Logic

The backend uses a hybrid approach:

- the ML pipeline produces an **ML reference score**,
- the **final score used for decisioning** is computed from the policy engine unless an admin override is supplied.

This means the live scholarship decision is currently more policy-driven than model-driven.

## 8.1 Eligibility Rules Implemented in Code

### Universal rule

- 12th percentage must be at least 60

### Need Based track

- 12th percentage must be at least 60
- family income must be less than or equal to INR 25,00,000

### Merit Based track

- 12th percentage must be at least 70

If these checks fail, the applicant is assigned:

- `Tier 4: Ineligible`
- `final_score = 0`

## 8.2 Income Score

Implemented by logarithmic decay:

```text
income_score = log(max_income / current_income) / log(100) * 100
```

Default reference max income:

- INR 20,00,000

Behavior:

- lower income gives higher score,
- score is clipped to 0 to 100.

## 8.3 Merit Score

Raw merit is an average of academic indicators.

Without competitive exam:

```text
(12th + MH-CET + JEE + University Test) / 4
```

With competitive exam:

```text
(12th + MH-CET + JEE + University Test + Competitive Exam) / 5
```

The raw merit is then transformed with a sigmoid:

```text
merit_score = 100 / (1 + exp(-k * (raw_merit - midpoint)))
```

Default parameters:

- `k = 0.1`
- `midpoint = 50`

## 8.4 Policy Score

Current backend implementation in `backend/main.py`:

- General: `+0`
- OBC: `+5`
- SC: `+10`
- ST: `+15`
- Maharashtra domicile: `+5`
- Female: `+5`
- Disability yes: `+10`
- Extracurricular: `+0` to `+10` using raw score directly
- Gap year greater than 0: `-5`

The total policy score is capped at:

- `20`

## 8.5 Track-Specific Weights Used by `/api/predict`

### Need Based

- Merit: `0.15`
- Income: `0.70`
- Policy: `0.15`

### Merit Based

- Merit: `0.70`
- Income: `0.15`
- Policy: `0.15`

### Fallback

- Merit: `0.40`
- Income: `0.40`
- Policy: `0.20`

## 8.6 Tier Mapping

For live decisions:

- score `>= 80` -> `Tier 1: Full Aid`
- score `>= 50 and < 80` -> `Tier 2: Partial Aid`
- score `< 50` -> `Tier 3: No Aid`
- failed eligibility -> `Tier 4: Ineligible`

---

## 9. Backend API Design

The FastAPI backend is the operational core of the system.

## 9.1 Main Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/api/predict` | score one applicant, optionally apply override |
| `POST` | `/api/simulate` | run what-if scholarship allocation simulation |
| `GET` | `/api/databases/generated` | paginated generated applications |
| `GET` | `/api/databases/decision-center` | paginated decision center records |
| `GET` | `/api/databases/overrides` | paginated override records |
| `GET` | `/api/databases/generated/export` | export generated records CSV |
| `GET` | `/api/databases/decision-center/export` | export decision records CSV |
| `GET` | `/api/databases/overrides/export` | export override log CSV |
| `GET` | `/api/fairness-audit` | fairness KPIs and flags |
| `GET` | `/api/fairness-audit/export` | fairness flags CSV |
| `GET` | `/api/mlops/summary` | model registry and artifact summary |
| `GET` | `/api/health` | backend health check |

## 9.2 `/api/predict` Response Design

The endpoint returns:

- `final_score`
- `ml_score`
- `tier`
- `is_overridden`
- `scholarship_track`
- `weights_used`
- `breakdown`
- `message`

This is good API design for explainability because it separates:

- reference model output,
- final policy output,
- override state,
- human-readable explanation.

## 9.3 Simulation Engine

`/api/simulate` supports:

- budget amount,
- merit weight,
- income weight,
- policy weight,
- tuition amount.

It returns:

- simulation parameters,
- budget utilization,
- students funded,
- tier breakdown,
- demographic impact,
- top allocations,
- fairness audit summary.

---

## 10. Frontend Dashboard Design

The frontend is built with:

- React 19,
- React Router,
- Vite,
- Tailwind CSS,
- Recharts,
- Lucide icons.

## 10.1 Routes

Defined in `frontend/src/App.jsx`:

- `/` -> Landing Page
- `/admin-overview` -> admin summary
- `/decision-center` -> applicant scoring form
- `/policy-rules` -> policy/rules page
- `/timeline` -> project timeline
- `/suggestions` -> suggestions page
- `/command-center` -> policy simulator
- `/applicant-database` -> database browser
- `/fairness-audit` -> fairness monitoring
- `/mlops` -> model registry dashboard
- `/security` -> security audit page

## 10.2 Decision Center

The Decision Center is the main operational page. It provides:

- validated form inputs,
- track selection,
- competitive exam toggle,
- prediction request,
- override submission,
- result visualization,
- local prediction history.

## 10.3 Command Center

This page allows admins to experiment with:

- total budget,
- merit/income/policy weights,
- allocation mode toggle,
- simulation output,
- fairness summary.

## 10.4 Applicant Database

Provides three tabs:

- generated applications,
- decision center records,
- override database.

Features:

- pagination,
- search,
- CSV export,
- tier formatting.

## 10.5 Fairness Audit

Visualizes:

- demographic parity,
- disparate impact style indicators,
- recent flagged decisions,
- score comparisons by gender and caste.

## 10.6 MLOps Dashboard

Displays:

- active production model,
- benchmark comparison,
- artifact metadata,
- dataset shapes,
- refreshable live evaluation snapshot.

---

## 11. Fairness and Audit Mechanisms

Fairness is implemented in two distinct ways:

### 11.1 Training-Time Fairness

`src/model_trainer.py` uses Fairlearn `MetricFrame` to inspect model performance by:

- `Caste_Category`
- `Gender`

Metrics:

- MAE
- R^2

### 11.2 Runtime Fairness Dashboard

`/api/fairness-audit` computes live operational metrics from database records:

- approval threshold check,
- caste parity ratio,
- gender disparate impact style ratio,
- flagged decisions requiring review,
- grouped score visualization data.

This makes the project stronger from a governance perspective because fairness is not limited to offline experimentation.

---

## 12. MLOps and Retraining

## 12.1 Retraining Pipeline

`retrain_pipeline.py` performs:

1. extraction of scored applicant records from SQLite,
2. preprocessing and train/test split,
3. training of RandomForest and XGBoost,
4. evaluation and best-model selection,
5. fairness audit,
6. artifact save,
7. model versioning.

Artifacts include:

- versioned model file,
- production model file,
- model metadata,
- logs.

## 12.2 Scheduled Automation

`Setup-RetrainingTask.ps1` creates a Windows scheduled task to run retraining:

- weekly,
- every Sunday,
- at 2:00 AM,
- with highest privileges.

This demonstrates practical MLOps thinking beyond a one-time notebook model.

---

## 13. Legacy Version

The folder `Tejas_v1/` contains an earlier Streamlit implementation.

This version already supported:

- single applicant scoring,
- batch processing,
- criteria information,
- timeline views,
- database browsing,
- SHAP explainability.

The current repo has evolved beyond this into a React + FastAPI architecture, but the legacy app is useful as:

- a historical prototype,
- a fallback reference implementation,
- evidence of project evolution.

---

## 14. Technology Stack

## 14.1 Backend and Data

- Python
- FastAPI
- Pydantic
- SQLite
- Pandas
- NumPy
- PyYAML

## 14.2 Machine Learning

- scikit-learn
- XGBoost
- LightGBM
- SHAP
- Fairlearn
- Joblib

## 14.3 Frontend

- React
- React Router
- Vite
- Tailwind CSS
- Recharts
- Lucide React

---

## 15. How to Run the Project

## 15.1 Python Dependencies

Install backend and ML requirements:

```bash
pip install -r requirements.txt
```

## 15.2 Frontend Dependencies

From the `frontend` folder:

```bash
npm install
```

## 15.3 Start Backend

From project root:

```bash
uvicorn main:app --port 5000 --reload --app-dir backend
```

## 15.4 Start Frontend

From `frontend`:

```bash
npm run dev
```

## 15.5 Combined Frontend Workflow

The frontend `package.json` also includes:

```bash
npm run dev
```

which uses `concurrently` to launch:

- frontend Vite dev server,
- backend Uvicorn server.

---

## 16. Strengths of the Current Implementation

- clear full-stack separation between frontend and backend,
- strong database-backed audit trail,
- hybrid use of policy and ML scoring,
- fairness dashboard and training-time fairness checks,
- retraining and model-registry functionality,
- export support for operational review,
- structured repository with reusable utilities.

---

## 17. Important Implementation Observations and Gaps

This section is especially useful in a technical submission because it shows code-level understanding rather than only feature listing.

### 17.1 Final decision score is policy-based, not purely ML-based

The backend calculates an `ml_score`, but the final production decision returned by `/api/predict` is based on policy-engine scoring unless an override is provided.

Implication:

- the application is best described as a **hybrid policy + ML system**,
- not a pure predictive scoring engine.

### 17.2 Merit-based entrance exam rule is documented but not fully enforced in code

Project documentation describes a minimum entrance-exam rule for the merit track, but `check_eligibility()` currently checks only:

- 12th percentage threshold,
- income threshold for need-based track.

Implication:

- policy documentation and backend enforcement are not fully aligned.

### 17.3 Policy score implementation differs from the YAML/documentation reference

Observed differences in code:

- gender bonus is applied to `Female` only in backend code,
- extracurricular score is added directly as `0-10`,
- gap year penalty exists in code,
- YAML and markdown docs describe a more banded policy bonus structure.

Implication:

- the true runtime behavior is defined by `backend/main.py`, not only by `config/scholarship_rules.yaml`.

### 17.4 Command Center toggle for budget mode is not fully wired

`frontend/src/pages/CommandCenter.jsx` sends `use_budget`, but `SimulationRequest` in the backend does not define that field, and the simulation path always calls `allocate_funds()` without forwarding the toggle.

Implication:

- the current UI suggests both strict-budget and relative-ranking modes,
- but the backend currently behaves as strict-budget mode in practice.

### 17.5 `CommandCenter.jsx` hardcodes backend URL

Most of the frontend uses `frontend/src/lib/api.js`, but Command Center directly calls:

```text
http://localhost:5000/api/simulate
```

Implication:

- this is less portable than the other pages,
- environment-specific deployments will need adjustment.

### 17.6 `data_generation/generator.py` appears to target an older config schema

The generator expects keys such as:

- `income_threshold`
- `income_weight`
- `merit_weight`
- `reserved_categories`
- `reservation_bonus`

The current YAML file uses a newer structured format and does not expose those legacy keys.

Implication:

- the generator may require refactoring before reliable reuse with the current config file.

---

## 18. Submission-Worthy Conclusion

Tejas is a technically ambitious scholarship allocation platform that combines software engineering, data engineering, machine learning, fairness auditing, and admin workflow design into one integrated product.

The repository demonstrates:

- a realistic full-stack architecture,
- operational database design,
- explainable scoring logic,
- model training and artifact management,
- retraining automation,
- fairness-aware administration.

The project’s strongest quality is that it does not stop at training a model. Instead, it builds a full decision-support ecosystem around the model, including:

- policy controls,
- audit trails,
- fairness monitoring,
- deployment artifacts,
- retraining hooks.

From an academic and technical documentation perspective, the project is best characterized as a **hybrid intelligent decision-support system for scholarship allocation**, with both implemented functionality and clearly identifiable next-step improvements.

---

## 19. Recommended Future Improvements

- align backend rules exactly with `config/scholarship_rules.yaml`,
- enforce merit-track competitive exam eligibility in code,
- make simulation mode selection fully functional,
- standardize all frontend API calls through `api.js`,
- refactor the generator to the new policy config structure,
- add automated tests for scoring and policy regression,
- expose SHAP explanations directly in the React dashboard.

---

## 20. Short Viva / Presentation Summary

If this project needs to be explained quickly in a viva or submission presentation:

> Tejas is a full-stack scholarship allocation system that uses a hybrid of machine learning and rule-based policy scoring to evaluate applicants. It stores records in SQLite, exposes FastAPI endpoints for scoring, simulation, fairness auditing, and MLOps monitoring, and provides a React admin dashboard for decision-making, override tracking, and transparency.
